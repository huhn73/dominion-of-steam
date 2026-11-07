import type { ParamValue } from '../../i18n'
import { withBonus } from '../bonus'
import { findPath, hexDistance, hexKey, marchTurns, sameHex } from '../hex'
import type { HexCoord } from '../types'
import { destroyUnit } from './combat'
import { exploreTurn } from './explore'
import { knowledge, logAction, refreshNeedsOrders, snapshotVisibility, walk } from './movement'
import {
  addEvent,
  factionOf,
  type GameState,
  msg,
  newId,
  nextSeq,
  participant,
  type ParticipantState,
  turnDeadline,
  unitName,
  type UnitState,
  unitType,
} from './state'
import { seesUnit, sightingSnapshot, unitSight, updateKnowledge, visibleTiles } from './visibility'
import { capitulate, shouldCapitulate } from './surrender'
import {
  checkVictory,
  finishMatch,
  leaderByScore,
  updateDominance,
  updateEliminations,
} from './victory'

const inOwnCity = (state: GameState, u: UnitState) =>
  state.cities.some((c) => c.ownerId === u.ownerId && sameHex(c, u))

/** Air units end their owner's turn without fuel outside a city or carrier: they crash */
function crashAircraft(state: GameState, playerId: string) {
  for (const u of [...state.units]) {
    if (u.ownerId !== playerId || u.fuel == null || u.fuel > 0) continue
    if (u.carriedBy || inOwnCity(state, u)) continue
    destroyUnit(state, u.id)
    addEvent(
      state,
      playerId,
      'unitLost',
      u,
      msg('events.crashed', { unit: unitName(u.unitTypeId) }),
    )
  }
}

/** End the current participant's turn and start the next active participant's turn */
export function endTurn(state: GameState, now = new Date()): GameState {
  const current = state.participants[state.seat]!
  crashAircraft(state, current.id)
  for (const u of state.units) if (u.ownerId === current.id) u.skipped = false
  current.lastTurnEndSeq = nextSeq(state)
  updateEliminations(state)
  updateKnowledge(state)
  current.seenAtTurnEnd = sightingSnapshot(state, current.id)
  updateDominance(state, current)
  if (checkVictory(state, now)) return state

  let seat = state.seat
  do {
    seat = (seat + 1) % state.participants.length
    if (seat === 0) {
      // Round limit: after the last round the participant with the most points wins
      if (
        state.rules.victoryCondition === 'roundLimit' &&
        state.rules.roundLimit != null &&
        state.round >= state.rules.roundLimit
      ) {
        finishMatch(state, leaderByScore(state)?.id ?? null, now, 'roundLimit')
        return state
      }
      state.round += 1
    }
    // An AI whose match is lost gives up instead of playing its turn
    const next = state.participants[seat]!
    if (shouldCapitulate(state, next)) {
      capitulate(state, next.id)
      updateEliminations(state)
      if (checkVictory(state, now)) return state
    }
  } while (state.participants[seat]!.status !== 'active')
  state.seat = seat
  startTurn(state, now)
  return state
}

/** Prepare the turn of the participant on `state.seat` */
/**
 * Drop log entries and events nobody can still be shown: every active participant's replay
 * starts at their `lastTurnEndSeq`, events are listed from there as well. Finished turns are
 * already copied to the match history by the server.
 */
export function pruneHistory(state: GameState) {
  const active = state.participants.filter((p) => p.status === 'active')
  const minSeq = Math.min(...active.map((p) => p.lastTurnEndSeq))
  if (!Number.isFinite(minSeq)) return
  state.log = state.log.filter((l) => l.seq > minSeq)
  state.events = state.events.filter((e) => e.seq > minSeq || e.round >= state.round - 1)
}

export function startTurn(state: GameState, now = new Date()) {
  const p = state.participants[state.seat]!
  const faction = factionOf(state, p.id)

  for (const u of state.units) {
    if (u.ownerId !== p.id) continue
    const type = unitType(u.unitTypeId)
    // A submarine that was run into submerges again when its owner's turn starts
    delete u.revealedTo
    u.movesLeft = withBonus(type, faction, 'movement') ?? type.movement
    u.skipped = false
    if (u.fuel != null && (u.carriedBy || inOwnCity(state, u)))
      u.fuel = withBonus(type, faction, 'range') ?? type.range ?? u.fuel
    // Repairs: one hit point per turn in an own city
    if (inOwnCity(state, u)) u.hp = Math.min(type.hitPoints, u.hp + 1)
  }

  for (const city of state.cities) {
    if (city.ownerId !== p.id) continue
    // A quiet round lets a city recover from attacks
    if (city.underFire) city.underFire = false
    else city.damage = Math.max(0, city.damage - 1)
    if (!city.production) continue
    const prod = city.production
    prod.progress += 1
    prod.turnsRemaining -= 1
    if (prod.turnsRemaining > 0) continue
    const type = unitType(prod.unitTypeId)
    state.units.push({
      id: newId(state, 'n'),
      unitTypeId: type.id,
      ownerId: p.id,
      col: city.col,
      row: city.row,
      hp: type.hitPoints,
      movesLeft: withBonus(type, faction, 'movement') ?? type.movement,
      fuel: type.range == null ? null : (withBonus(type, faction, 'range') ?? type.range),
      order: { type: 'none' },
      cargoUnitIds: [],
      carriedBy: null,
      needsOrders: true,
    })
    p.unitsBuilt += 1
    addEvent(
      state,
      p.id,
      'unitBuilt',
      city,
      msg('events.built', { city: city.name, unit: unitName(type.id) }),
    )
    city.production = {
      unitTypeId: type.id,
      progress: 0,
      turnsRemaining:
        (withBonus(type, faction, 'productionTurns') ?? type.productionTurns) + city.damage,
    }
  }

  updateKnowledge(state)
  executeStandingOrders(state, p.id)

  for (const u of state.units) {
    if (u.ownerId !== p.id) continue
    refreshNeedsOrders(u)
    const type = unitType(u.unitTypeId)
    if (u.fuel != null && !u.carriedBy && !inOwnCity(state, u) && u.fuel <= type.movement)
      addEvent(
        state,
        p.id,
        'fuelLow',
        u,
        msg('events.fuelLow', { unit: unitName(type.id), count: u.fuel }),
      )
  }

  updateKnowledge(state)
  reportSightings(state, p)
  state.turnDeadline = turnDeadline(state, now)
  const hasReplay = state.log.some(
    (l) => l.participantId !== p.id && l.seq > p.lastTurnEndSeq && l.seenBy[p.id]?.length,
  )
  state.phase = hasReplay ? 'replay' : 'yourTurn'
}

/**
 * Turn report: what changed in sight since the participant's last turn ended. Cities seen for the
 * first time or with a new owner, and foreign units that were not visible back then. Runs after
 * the standing orders, so units on goto or patrol report what they discover; enemies a sentry or
 * a blocked move already reported this round are not repeated.
 */
function reportSightings(state: GameState, p: ParticipantState) {
  const seen = p.seenAtTurnEnd
  if (!seen) return
  const ownerName = (id: string | null): ParamValue | null =>
    id ? (participant(state, id)?.name ?? { key: 'events.unknown' }) : null
  const reportedCities = new Set(
    state.events
      .filter(
        (e) => e.participantId === p.id && e.round === state.round && e.type === 'cityDiscovered',
      )
      .map(hexKey),
  )

  for (const city of state.cities) {
    if (!(p.id in city.knownBy) || reportedCities.has(hexKey(city))) continue
    const known = city.knownBy[p.id] ?? null
    if (known === p.id) continue
    const owner = ownerName(known)
    if (!(city.id in seen.cities)) {
      addEvent(
        state,
        p.id,
        'cityDiscovered',
        city,
        owner
          ? msg('events.discovered', { city: city.name, owner })
          : msg('events.discoveredFree', { city: city.name }),
      )
      continue
    }
    const before = seen.cities[city.id] ?? null
    if (before === known || before === p.id) continue
    addEvent(
      state,
      p.id,
      'cityDiscovered',
      city,
      owner
        ? msg('events.nowHeld', { city: city.name, owner })
        : msg('events.nowFree', { city: city.name }),
    )
  }

  const visible = visibleTiles(state, p.id)
  const known = new Set(seen.unitIds)
  const reported = new Set(
    state.events
      .filter(
        (e) => e.participantId === p.id && e.round === state.round && e.type === 'enemySighted',
      )
      .map(hexKey),
  )
  const byHex = new Map<string, UnitState[]>()
  for (const u of state.units) {
    if (known.has(u.id) || !seesUnit(state, p.id, u, (x) => visible.has(hexKey(x)))) continue
    if (reported.has(hexKey(u))) continue
    const k = hexKey(u)
    byHex.set(k, [...(byHex.get(k) ?? []), u])
  }
  for (const units of byHex.values()) {
    const at = units[0]!
    const where = `${at.col},${at.row}`
    const names = units.map((u) => unitName(u.unitTypeId))
    const text =
      units.length === 1
        ? msg('events.sighted', { unit: names[0]!, owner: ownerName(at.ownerId) ?? '', where })
        : msg('events.sightedMany', { where, units: names })
    addEvent(state, p.id, 'enemySighted', at, text)
  }
}

function executeStandingOrders(state: GameState, playerId: string) {
  const visible = visibleTiles(state, playerId)
  const enemies = state.units.filter((u) =>
    seesUnit(state, playerId, u, (x) => visible.has(hexKey(x))),
  )

  for (const unit of state.units.filter((u) => u.ownerId === playerId)) {
    const order = unit.order
    if (order.type === 'sentry') {
      const sight = unitSight(state, unit)
      const enemy = enemies.find((e) => hexDistance(e, unit) <= sight)
      if (enemy) {
        unit.order = { type: 'none' }
        addEvent(
          state,
          playerId,
          'enemySighted',
          enemy,
          msg('events.sentry', { unit: unitName(enemy.unitTypeId) }),
        )
      }
    } else if (order.type === 'goto') {
      const arrived = advance(state, unit, order.target)
      if (arrived === null || arrived) unit.order = { type: 'none' }
      else {
        const type = unitType(unit.unitTypeId)
        const { view, idx } = knowledge(state, playerId)
        const rest = findPath(
          view.units.find((u) => u.id === unit.id)!,
          order.target,
          idx,
        )
        const movement = withBonus(type, factionOf(state, playerId), 'movement') ?? type.movement
        unit.order = rest
          ? {
              type: 'goto',
              target: order.target,
              turnsRemaining: marchTurns(type, rest, idx, movement),
            }
          : { type: 'none' }
      }
    } else if (order.type === 'explore') {
      exploreTurn(state, unit)
    } else if (order.type === 'patrol') {
      const index = unit.patrolIndex ?? 1
      const target = order.waypoints[index % order.waypoints.length]!
      const arrived = advance(state, unit, target)
      if (arrived === null) {
        unit.order = { type: 'none' }
        delete unit.patrolIndex
      } else if (arrived) unit.patrolIndex = (index + 1) % order.waypoints.length
    }
  }
}

/** Move a unit towards a target with its full budget. Returns true when it arrived, null when blocked. */
function advance(state: GameState, unit: UnitState, target: HexCoord): boolean | null {
  if (sameHex(unit, target)) return true
  const { view, idx } = knowledge(state, unit.ownerId)
  const viewUnit = view.units.find((u) => u.id === unit.id)
  const path = viewUnit && findPath(viewUnit, target, idx)
  if (!path) return null
  const before = snapshotVisibility(state)
  const start = { col: unit.col, row: unit.row }
  const { walked, blocked } = walk(state, unit, path)
  logAction(state, unit, 'move', [start, ...walked], null, before)
  updateKnowledge(state)
  if (blocked) return null
  return sameHex(unit, target)
}
