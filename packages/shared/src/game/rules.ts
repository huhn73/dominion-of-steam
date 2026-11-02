import type { CombatOdds, Terrain, UnitDomain, UnitType } from './types'
import type { WorldShape } from './worldShapes'

/**
 * Combat rules shared by the engine (authoritative), the AI, the server previews and the web
 * client (attack dialog, compendium). Pure data and functions, no game state.
 */

const WATER: readonly Terrain[] = ['deepSea', 'shallows']
const isWaterTerrain = (t: Terrain) => WATER.includes(t)

/** Additional defense of land units by the terrain they stand on */
export const TERRAIN_DEFENSE: Record<Terrain, number> = {
  deepSea: 0,
  shallows: 0,
  plains: 0,
  forest: 1,
  hills: 1,
  mountains: 2,
}

export const TERRAIN_LABEL: Record<Terrain, string> = {
  deepSea: 'Tiefsee',
  shallows: 'Flachwasser',
  plains: 'Ebene',
  forest: 'Wald',
  hills: 'Hügel',
  mountains: 'Gebirge',
}

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
export function attackTargetsDescription(type: Pick<UnitType, 'id' | 'domain' | 'strength'>) {
  if (type.strength <= 0) return 'Keine Angriffe'
  switch (type.domain) {
    case 'air':
      return 'Land, See und Luft'
    case 'land':
      return 'Land, Schiffe auf Nachbarfeldern (Küste, Hafen) und Flugzeuge über Land'
    case 'sea':
      return type.id === 'tauchboot' ? 'Nur Schiffe' : 'See, Landeinheiten an der Küste und Luft'
  }
}

/** Terrain bonus on defense: only land units dig in */
export function terrainDefense(defender: Pick<UnitType, 'domain'>, terrain: Terrain): number {
  return defender.domain === 'land' ? TERRAIN_DEFENSE[terrain] : 0
}

export interface DefenseModifier {
  label: string
  value: number
}

/** Visible defense modifiers of a defender (without faction fortification), for the attack dialog */
export function defenseModifiers(
  defender: Pick<UnitType, 'domain'>,
  terrain: Terrain,
  inCity: boolean,
): DefenseModifier[] {
  const mods: DefenseModifier[] = []
  const t = terrainDefense(defender, terrain)
  if (t > 0) mods.push({ label: TERRAIN_LABEL[terrain], value: t })
  if (inCity) mods.push({ label: 'Stadt', value: CITY_DEFENSE })
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
