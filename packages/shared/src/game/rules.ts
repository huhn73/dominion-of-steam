import type { MessageKey } from '../i18n'
import type { CombatOdds, Terrain, UnitDomain, UnitType } from './types'
import type { WorldShape } from './worldShapes'

/**
 * Combat rules shared by the engine (authoritative), the AI, the server previews and the web
 * client (attack dialog, compendium). Pure data and functions, no game state.
 */

const WATER: readonly Terrain[] = ['deepSea', 'shallows']
const isWaterTerrain = (t: Terrain) => WATER.includes(t)

/** Additional defense of infantry by the terrain it stands on */
export const TERRAIN_DEFENSE: Record<Terrain, number> = {
  deepSea: 0,
  shallows: 0,
  plains: 0,
  forest: 1,
  hills: 1,
  mountains: 2,
}

/** Additional defense of vehicles: they cannot dig in among trees or rocks, only on hills */
export const VEHICLE_TERRAIN_DEFENSE: Record<Terrain, number> = {
  deepSea: 0,
  shallows: 0,
  plains: 0,
  forest: 0,
  hills: 1,
  mountains: 0,
}

/** Land vehicles: rough terrain ends their move and gives them less cover */
export const VEHICLE_UNIT_TYPES: ReadonlySet<string> = new Set(['panzerwagen', 'dampfkoloss'])

/** Forest, hills and mountains */
export const ROUGH_TERRAIN: readonly Terrain[] = ['forest', 'hills', 'mountains']

export const isVehicle = (type: Pick<UnitType, 'id'>) => VEHICLE_UNIT_TYPES.has(type.id)

/**
 * Whether entering the terrain uses up the unit's remaining moves: vehicles in rough terrain.
 * A tile with a city never does (streets). Any unit with a move left may still enter one tile.
 */
export function endsMovement(
  type: Pick<UnitType, 'id'>,
  terrain: Terrain,
  hasCity = false,
): boolean {
  return !hasCity && isVehicle(type) && ROUGH_TERRAIN.includes(terrain)
}

/** Sight radius of a unit: 1 for land units, 2 on hills and mountains; 2 for sea and air */
export function sightRadius(type: Pick<UnitType, 'domain'>, terrain: Terrain | undefined): number {
  if (type.domain !== 'land') return 2
  return terrain === 'hills' || terrain === 'mountains' ? 2 : 1
}

export const TERRAIN_LABEL = {
  deepSea: 'game.terrain.deepSea',
  shallows: 'game.terrain.shallows',
  plains: 'game.terrain.plains',
  forest: 'game.terrain.forest',
  hills: 'game.terrain.hills',
  mountains: 'game.terrain.mountains',
} as const satisfies Record<Terrain, MessageKey>

/** Additional defense of every unit inside a city (factions may add a fortification bonus) */
export const CITY_DEFENSE = 1

/** Highest damage level of a city under fire; each level adds one turn to new builds */
export const MAX_CITY_DAMAGE = 3

/**
 * Whether an attacker may attack a target of the given domain standing on `targetTerrain`.
 * `coastal` says whether the target tile touches water (sea units bombard only the coast).
 * The attack range is always 1, so a land unit attacking a ship is always next to the shore
 * or next to a harbour.
 */
export function canAttack(
  attacker: Pick<UnitType, 'id' | 'domain' | 'strength'>,
  targetDomain: UnitDomain,
  targetTerrain: Terrain,
  coastal: boolean,
): boolean {
  if (attacker.strength <= 0) return false
  switch (attacker.domain) {
    case 'air':
      return true
    case 'land':
      return targetDomain !== 'air' || !isWaterTerrain(targetTerrain)
    case 'sea':
      if (attacker.id === 'tauchboot') return targetDomain === 'sea'
      return targetDomain !== 'land' || coastal
  }
}

/** Short description of the targets a unit type may attack, for the compendium */
export function attackTargetsDescription(
  type: Pick<UnitType, 'id' | 'domain' | 'strength'>,
): MessageKey {
  if (type.strength <= 0) return 'game.targets.none'
  switch (type.domain) {
    case 'air':
      return 'game.targets.air'
    case 'land':
      return 'game.targets.land'
    case 'sea':
      return type.id === 'tauchboot' ? 'game.targets.submarine' : 'game.targets.sea'
  }
}

/** Terrain bonus on defense: only land units dig in, vehicles only on hills */
export function terrainDefense(
  defender: Pick<UnitType, 'id' | 'domain'>,
  terrain: Terrain,
): number {
  if (defender.domain !== 'land') return 0
  return (isVehicle(defender) ? VEHICLE_TERRAIN_DEFENSE : TERRAIN_DEFENSE)[terrain]
}

/** Terrains that give the unit type a defense bonus, with the bonus (compendium) */
export function terrainDefenseTable(
  type: Pick<UnitType, 'id' | 'domain'>,
): { terrain: Terrain; value: number }[] {
  return (Object.keys(TERRAIN_DEFENSE) as Terrain[])
    .map((terrain) => ({ terrain, value: terrainDefense(type, terrain) }))
    .filter((t) => t.value > 0)
}

export interface DefenseModifier {
  label: MessageKey
  value: number
}

/** Visible defense modifiers of a defender (without faction fortification), for the attack dialog */
export function defenseModifiers(
  defender: Pick<UnitType, 'id' | 'domain'>,
  terrain: Terrain,
  inCity: boolean,
): DefenseModifier[] {
  const mods: DefenseModifier[] = []
  const t = terrainDefense(defender, terrain)
  if (t > 0) mods.push({ label: TERRAIN_LABEL[terrain], value: t })
  if (inCity) mods.push({ label: 'game.city', value: CITY_DEFENSE })
  return mods
}

const hitsNeeded = (hp: number, damage: number) => Math.max(1, Math.ceil(hp / Math.max(1, damage)))

/** Exact odds of a fight to the end, by the number of hits each side still needs to land */
export function exchangeOdds(
  attack: number,
  defense: number,
  attackerHp: number,
  attackerDamage: number,
  defenderHp: number,
  defenderDamage: number,
): CombatOdds {
  const p = attack + defense > 0 ? attack / (attack + defense) : 0
  const k = hitsNeeded(defenderHp, attackerDamage)
  const m = hitsNeeded(attackerHp, defenderDamage)
  // The attacker wins when the k-th own hit comes before the m-th enemy hit: negative binomial
  let killChance = 0
  let expectedDamageTaken = 0
  let binom = 1 // C(k - 1 + j, j)
  const pk = p ** k
  for (let j = 0; j < m; j++) {
    if (j > 0) binom = (binom * (k - 1 + j)) / j
    const prob = binom * pk * (1 - p) ** j
    killChance += prob
    expectedDamageTaken += prob * Math.min(attackerHp, j * defenderDamage)
  }
  killChance = Math.min(1, killChance)
  const deathChance = Math.max(0, 1 - killChance)
  expectedDamageTaken += deathChance * attackerHp
  return { hitChance: p, killChance, deathChance, expectedDamageTaken }
}

/**
 * The same fight as `exchangeOdds`, from the hit chance per round, with the defender's hit
 * points left over: `survivors` maps hit points to the chance that the attacker falls and the
 * defender keeps exactly that many.
 */
export function exchangeOutcomes(
  hitChance: number,
  attackerHp: number,
  attackerDamage: number,
  defenderHp: number,
  defenderDamage: number,
): { killChance: number; survivors: Map<number, number> } {
  const p = hitChance
  const k = hitsNeeded(defenderHp, attackerDamage)
  const m = hitsNeeded(attackerHp, defenderDamage)
  let killChance = 0
  let binom = 1 // C(k - 1 + j, j)
  const pk = p ** k
  for (let j = 0; j < m; j++) {
    if (j > 0) binom = (binom * (k - 1 + j)) / j
    killChance += binom * pk * (1 - p) ** j
  }
  killChance = Math.min(1, killChance)
  // The attacker falls with its m-th loss after i < k own hits: C(m - 1 + i, i) (1-p)^m p^i
  const survivors = new Map<number, number>()
  const qm = (1 - p) ** m
  binom = 1 // C(m - 1 + i, i)
  for (let i = 0; i < k; i++) {
    if (i > 0) binom = (binom * (m - 1 + i)) / i
    const prob = binom * qm * p ** i
    if (prob > 0) survivors.set(defenderHp - i * attackerDamage, prob)
  }
  return { killChance, survivors }
}

/** One attacker of a chain: hit chance per round against the target and what it is worth */
export interface ChainStep {
  hitChance: number
  attackerHp: number
  attackerDamage: number
  defenderDamage: number
  /** Value lost when this attacker falls */
  cost: number
}

/**
 * Several attackers one after the other against the same defender: each one fights until it or
 * the defender falls, the next one meets the defender with the hit points left. Returns the
 * chance that the chain destroys the defender and the expected value of the attackers lost.
 * Attackers after a win do not fight, so they cost nothing.
 */
export function chainOdds(
  defenderHp: number,
  steps: readonly ChainStep[],
): { killChance: number; expectedLoss: number } {
  let alive = new Map<number, number>([[defenderHp, 1]])
  let killChance = 0
  let expectedLoss = 0
  for (const step of steps) {
    const next = new Map<number, number>()
    for (const [hp, prob] of alive) {
      const o = exchangeOutcomes(
        step.hitChance,
        step.attackerHp,
        step.attackerDamage,
        hp,
        step.defenderDamage,
      )
      killChance += prob * o.killChance
      expectedLoss += prob * (1 - o.killChance) * step.cost
      for (const [left, q] of o.survivors) next.set(left, (next.get(left) ?? 0) + prob * q)
    }
    alive = next
  }
  return { killChance: Math.min(1, killChance), expectedLoss }
}

/** A city without defenders: one roll, the attacker is spent either way */
export function cityAttackOdds(hitChance: number, attackerHp: number): CombatOdds {
  return { hitChance, killChance: hitChance, deathChance: 1, expectedDamageTaken: attackerHp }
}

/** Whether a unit of this domain may stand on the terrain (used when advancing after a win) */
export function canEnter(type: Pick<UnitType, 'domain'>, terrain: Terrain): boolean {
  switch (type.domain) {
    case 'air':
      return true
    case 'land':
      return !isWaterTerrain(terrain)
    case 'sea':
      return isWaterTerrain(terrain)
  }
}

/**
 * Victory condition 'dominance': share of all cities (neutral ones count) a participant must
 * hold. Island worlds ask for less: neutral islands are slow to take, and at 60 % most island
 * matches still ran into the round limit (`agent-os/product/ki-balance.md`, „Nachmessung Enden“).
 */
export const DOMINANCE_SHARE: Record<WorldShape, number> = {
  continent: 0.6,
  islands: 0.5,
  archipelago: 0.5,
}
/** … at the end of this many own turns in a row */
export const DOMINANCE_TURNS = 5

/**
 * An AI capitulates when the match is lost for it: its starting capital is in enemy hands, it
 * holds less than this share of the leader's cities, the leader has at least `…_LEADER_CITIES`
 * and the match is at least `…_MIN_ROUND` rounds old.
 */
export const CAPITULATION_CITY_SHARE = 0.25
export const CAPITULATION_LEADER_CITIES = 6
export const CAPITULATION_MIN_ROUND = 20
