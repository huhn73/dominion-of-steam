import { withBonus } from '../bonus'
import { sameHex } from '../hex'
import {
  canEnter,
  CITY_DEFENSE,
  cityAttackOdds,
  exchangeOdds,
  MAX_CITY_DAMAGE,
  terrainDefense,
} from '../rules'
import type { CombatHit, CombatOdds, CombatResult, HexCoord } from '../types'
import {
  addEvent,
  asResult,
  type CityState,
  factionOf,
  type GameState,
  msg,
  newId,
  participant,
  placeUnit,
  random,
  unitName,
  type UnitState,
  unitType,
} from './state'
import { stopsAt, tileAt } from './visibility'

/** Defense bonus of cities owned by a faction whose bonus affects cities (e.g. Salzküsten-Liga) */
function fortification(state: GameState, ownerId: string | null) {
  const bonus = factionOf(state, ownerId)?.bonus
  return bonus && bonus.stat === null && bonus.domain === null && bonus.mode === 'add'
    ? bonus.modifier
    : 0
}

const cityAt = (state: GameState, c: HexCoord) => state.cities.find((x) => sameHex(x, c))

/** Strength with faction bonus; the condition of a unit does not weaken it (classic rules) */
function attackValue(state: GameState, u: UnitState) {
  const type = unitType(u.unitTypeId)
  return withBonus(type, factionOf(state, u.ownerId), 'strength') ?? type.strength
}

function defenseValue(state: GameState, u: UnitState) {
  const type = unitType(u.unitTypeId)
  const city = cityAt(state, u)
  const base = withBonus(type, factionOf(state, u.ownerId), 'defense') ?? type.defense
  const terrain = tileAt(state, u)?.terrain
  return (
    base +
    (terrain ? terrainDefense(type, terrain) : 0) +
    (city ? CITY_DEFENSE + fortification(state, city.ownerId) : 0)
  )
}

/** Chance per combat round that the attacker lands the hit (city: chance to capture it) */
export function combatChance(
  state: GameState,
  attackerId: string,
  target: { unitId?: string; cityId?: string },
) {
  const attacker = state.units.find((u) => u.id === attackerId)!
  const a = attackValue(state, attacker)
  if (target.unitId) {
    const defender = state.units.find((u) => u.id === target.unitId)!
    const d = defenseValue(state, defender)
    return a / (a + d)
  }
  const city = state.cities.find((c) => c.id === target.cityId)!
  return a / (a + CITY_DEFENSE + fortification(state, city.ownerId))
}

/** Odds of the whole fight, as shown in the attack dialog and used by the AI */
export function combatOdds(
  state: GameState,
  attackerId: string,
  target: { unitId?: string; cityId?: string },
): CombatOdds {
  const attacker = state.units.find((u) => u.id === attackerId)!
  const aType = unitType(attacker.unitTypeId)
  const a = attackValue(state, attacker)
  if (target.unitId) {
    const defender = state.units.find((u) => u.id === target.unitId)!
    const dType = unitType(defender.unitTypeId)
    const d = defenseValue(state, defender)
    return exchangeOdds(a, d, attacker.hp, aType.damage, defender.hp, dType.damage)
  }
  return cityAttackOdds(combatChance(state, attackerId, target), attacker.hp)
}

/** An attack on a city or on a unit inside it costs the city productivity */
function damageCity(city: CityState) {
  city.damage = Math.min(MAX_CITY_DAMAGE, city.damage + 1)
  city.underFire = true
  if (city.production) city.production.turnsRemaining += 1
}

/** Whether the winner may move onto the beaten defender's tile */
function canAdvance(state: GameState, attacker: UnitState, at: HexCoord) {
  const tile = tileAt(state, at)
  if (!tile || !canEnter(unitType(attacker.unitTypeId), tile.terrain)) return false
  if (state.units.some((u) => u.ownerId !== attacker.ownerId && !u.carriedBy && sameHex(u, at)))
    return false
  const city = cityAt(state, at)
  return !city || city.ownerId === attacker.ownerId
}

/** Move the winner onto the defender's tile; aircraft burn fuel, vehicles stop in rough terrain */
function advance(state: GameState, attacker: UnitState, at: HexCoord) {
  placeUnit(state, attacker, at)
  if (attacker.fuel != null) attacker.fuel = Math.max(0, attacker.fuel - 1)
  if (stopsAt(state, attacker.unitTypeId, at)) attacker.movesLeft = 0
}

/** Remove a unit together with its cargo */
export function destroyUnit(state: GameState, unitId: string) {
  const unit = state.units.find((u) => u.id === unitId)
  if (!unit) return
  const doomed = new Set([unitId, ...unit.cargoUnitIds])
  if (unit.carriedBy) {
    const carrier = state.units.find((u) => u.id === unit.carriedBy)
    if (carrier) carrier.cargoUnitIds = carrier.cargoUnitIds.filter((id) => id !== unitId)
  }
  state.units = state.units.filter((u) => !doomed.has(u.id))
}

/**
 * Resolve an attack from the attacker's current (adjacent) position. The attack costs one
 * movement point (aircraft also one fuel); the unit may act again if it has moves left.
 */
export function resolveCombat(
  state: GameState,
  attacker: UnitState,
  target: { unitId?: string; cityId?: string },
): CombatResult {
  const chance = combatChance(state, attacker.id, target)
  const aType = unitType(attacker.unitTypeId)
  const attackerName = unitName(aType.id)
  const me = participant(state, attacker.ownerId)!
  attacker.movesLeft = Math.max(0, attacker.movesLeft - 1)
  if (attacker.fuel != null) attacker.fuel = Math.max(0, attacker.fuel - 1)
  attacker.order = { type: 'none' }
  delete attacker.patrolIndex
  const hp0 = attacker.hp

  if (target.unitId) {
    const defender = state.units.find((u) => u.id === target.unitId)!
    const dType = unitType(defender.unitTypeId)
    const defenderName = unitName(dType.id)
    const at = { col: defender.col, row: defender.row }
    const besieged = cityAt(state, at)
    const siege = besieged && besieged.ownerId !== attacker.ownerId
    if (siege) damageCity(besieged)
    const defenderHp0 = defender.hp

    // Rounds until one side is out of hit points; the chance stays the same
    const hits: CombatHit[] = []
    while (attacker.hp > 0 && defender.hp > 0) {
      if (random(state) < chance) {
        defender.hp -= aType.damage
        hits.push('attacker')
      } else {
        attacker.hp -= dType.damage
        hits.push('defender')
      }
    }
    const defenderDestroyed = defender.hp <= 0
    const attackerDestroyed = attacker.hp <= 0
    const attackerDamage = hp0 - Math.max(0, attacker.hp)
    const defenderDamage = defenderHp0 - Math.max(0, defender.hp)

    if (defenderDestroyed) {
      destroyUnit(state, defender.id)
      const advanced = canAdvance(state, attacker, at)
      if (advanced) advance(state, attacker, at)
      const text = msg(advanced ? 'events.winAdvance' : 'events.win', {
        attacker: attackerName,
        defender: defenderName,
      })
      addEvent(state, attacker.ownerId, 'combat', at, text)
      addEvent(
        state,
        defender.ownerId,
        'unitLost',
        at,
        msg(siege ? 'events.destroyedByDelay' : 'events.destroyedBy', {
          defender: defenderName,
          player: me.name,
        }),
      )
      return {
        attackerUnitId: attacker.id,
        defenderUnitId: defender.id,
        targetCityId: null,
        hits,
        attackerDamage,
        defenderDamage,
        attackerDestroyed,
        defenderDestroyed,
        advanced,
        captured: false,
        garrisonUnitId: null,
        ...asResult(text),
      }
    }
    destroyUnit(state, attacker.id)
    const text = msg('events.fell', { attacker: attackerName, defender: defenderName })
    addEvent(state, attacker.ownerId, 'unitLost', at, text)
    addEvent(
      state,
      defender.ownerId,
      'combat',
      at,
      msg(siege ? 'events.repelledDelay' : 'events.repelled', {
        defender: defenderName,
        player: me.name,
      }),
    )
    return {
      attackerUnitId: attacker.id,
      defenderUnitId: defender.id,
      targetCityId: null,
      hits,
      attackerDamage,
      defenderDamage,
      attackerDestroyed,
      defenderDestroyed,
      advanced: false,
      captured: false,
      garrisonUnitId: null,
      ...asResult(text),
    }
  }

  // A city without defenders: one roll, the attacker is spent either way
  const city = state.cities.find((c) => c.id === target.cityId)!
  const previousOwner = city.ownerId
  damageCity(city)
  const captured = random(state) < chance
  const hits: CombatHit[] = [captured ? 'attacker' : 'defender']
  // An undamaged unit with more than one hit point leaves grenadiers behind (classic rules)
  const leavesGarrison = captured && aType.hitPoints > 1 && hp0 === aType.hitPoints
  destroyUnit(state, attacker.id)
  const base = {
    attackerUnitId: attacker.id,
    defenderUnitId: null,
    targetCityId: city.id,
    hits,
    attackerDamage: hp0,
    defenderDamage: 0,
    attackerDestroyed: true,
    defenderDestroyed: false,
    advanced: false,
  }
  if (captured) {
    city.ownerId = attacker.ownerId
    city.production = null
    city.underFire = false
    const captor = state.participants.find((p) => p.id === attacker.ownerId)
    if (captor) captor.citiesCaptured += 1
    city.knownBy[attacker.ownerId] = attacker.ownerId
    let garrisonUnitId: string | null = null
    if (leavesGarrison) {
      const grenadiere = unitType('grenadiere')
      garrisonUnitId = newId(state, 'n')
      state.units.push({
        id: garrisonUnitId,
        unitTypeId: grenadiere.id,
        ownerId: attacker.ownerId,
        col: city.col,
        row: city.row,
        hp: grenadiere.hitPoints,
        movesLeft: 0,
        fuel: null,
        order: { type: 'none' },
        cargoUnitIds: [],
        carriedBy: null,
        needsOrders: false,
      })
    }
    const text = msg(leavesGarrison ? 'events.capturedGarrison' : 'events.captured', {
      city: city.name,
    })
    addEvent(state, attacker.ownerId, 'cityCaptured', city, text)
    if (previousOwner)
      addEvent(
        state,
        previousOwner,
        'cityLost',
        city,
        msg('events.cityLost', { city: city.name, player: me.name }),
      )
    return { ...base, captured: true, garrisonUnitId, ...asResult(text) }
  }
  const text = msg('events.attackFailed', { city: city.name })
  addEvent(state, attacker.ownerId, 'unitLost', city, text)
  if (previousOwner)
    addEvent(
      state,
      previousOwner,
      'combat',
      city,
      msg('events.cityRepelled', { city: city.name, player: me.name }),
    )
  return { ...base, captured: false, garrisonUnitId: null, ...asResult(text) }
}
