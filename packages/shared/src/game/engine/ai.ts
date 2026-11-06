import { UNIT_TYPES } from '../catalog'
import { airBases, returnDistance } from '../fuel'
import {
  attackTargets,
  findPath,
  frontierNear,
  type PathBudget,
  hexDistance,
  hexKey,
  isWater,
  neighbors,
  reachableTiles,
  sameHex,
  tilesNear,
} from '../hex'
import { expandMap, tileIndex } from '../mapcodec'
import type { HexCoord, Unit, UnitType } from '../types'
import type { Command, PlayerView } from '../view'
import { chainOdds, type ChainStep } from '../rules'
import { combatOdds } from './combat'
import { applyCommand, CommandError, type CommandOutcome } from './commands'
import { knowledge } from './movement'
import {
  factionOf,
  type GameState,
  participant,
  random,
  type RememberedUnit,
  unitType,
} from './state'
import { dominanceShare } from './victory'
import { isCoastal } from './visibility'
import { aiPersonality } from '../../setup/data'
import { TUTORIAL_AI_ID } from './tutorial'

type Difficulty = 'easy' | 'normal' | 'hard'

const ATTACK_THRESHOLD: Record<Difficulty, number> = { easy: 0.6, normal: 0.55, hard: 0.55 }
const SKIP_SHARE: Record<Difficulty, number> = { easy: 0.2, normal: 0, hard: 0 }
/** A visible enemy within this many tiles makes a city a threatened one */
const THREAT_RANGE = 3
/** A known city of others or an enemy within this many tiles makes a city a border city */
const BORDER_RANGE = 5
/** Scouts are only built this early; later the fog that is left is not worth a plane */
const SCOUT_ROUNDS = 30
/** How far a damaged unit travels to an own city for repairs */
const REPAIR_RANGE = 4
/** Land specials (slow, expensive) are only built from this round on and with this many cities */
const SPECIAL_ROUNDS = 15
const SPECIAL_CITIES = 6
/** How far a unit is called back to defend a threatened city */
const RECALL_RANGE = 6
/** What a city is worth in points; taking an enemy city also costs the opponent that much */
const CITY_WORTH = { neutral: 3, enemy: 6 }
/** Within this many missing cities (or this share of the own count) the dominance is in reach */
const DOMINANCE_REACH = { cities: 3, share: 0.5 }
/** Extra worth of a city of the dominance holder: taking it breaks the countdown */
const BREAK_WORTH = 4
/** Remembered foreign units kept in the game state at most (oldest dropped first) */
const MAX_MEMORY = 200
/** Targets a turn's coordinated attacks go after at most, and attackers per target */
const MAX_STRIKES = 6
const MAX_STRIKERS = 4
/** A remembered defender in a city out of sight makes it count as this many tiles farther away */
const GHOST_DEFENDER = 2

/** Parameters of an AI participant: difficulty first, then lightly tweaked by the personality */
export interface AiProfile {
  difficulty: Difficulty
  /** Minimum win chance for an attack on a unit (and on a city without `cityValue`) */
  attackThreshold: number
  /** Share of units that sit out a turn */
  skipShare: number
  /** Chance that an armour build becomes the faction's land special (e.g. Dampfkoloss) */
  specialShare: number
  /** Chance to build a gunboat in a coastal city while the fleet is smaller than `maxShips` */
  shipShare: number
  maxShips: number
  /** Neutral cities count as this many tiles closer when choosing where to expand */
  neutralBias: number
  /** Keep one unit on sentry in every own city */
  garrison: boolean
  /** Attack defenders inside cities; easy leaves garrisoned cities alone */
  siege: boolean
  /** Besiege only with this many own units around the city per defender inside */
  siegeRatio: number
  /** Judge city attacks by expected value (city worth against the unit spent) instead of the threshold */
  cityValue: boolean
  /** Which standing orders are reconsidered every turn */
  replan: 'none' | 'goto' | 'all'
  /** Keep a land unit in cities with an enemy in sight and call one back when there is none */
  defend: boolean
  /** Keep a garrison in border cities (others' cities or enemies known close by), build armour there */
  fortify: boolean
  /** Share of armoured cars among the land units built (the rest are grenadiers) */
  armourShare: number
  /** Damaged multi-hit-point land units go home to repair instead of fighting on */
  repair: boolean
  /** A threatened city builds grenadiers until this many land units stand in it, then its usual mix */
  garrisonTarget: number
  /** Chance to build a submarine in a coastal city while enemy ships are in sight */
  subShare: number
  /** Ship land units to cities on other landmasses */
  transports: boolean
  maxTransports: number
  /** Land units aboard before a transport sails; two are enough against an undefended neutral city */
  departAt: number
  /** Gunboats built to scout the sea while fog remains */
  scoutShips: number
  /** Aim for the victory condition 'dominance': more transports, neutral cities first, hold the lead */
  dominanceDrive: boolean
  /** Chance to build a scout plane while fog remains and fewer than `maxScouts` are flying */
  scoutShare: number
  maxScouts: number
  /** Chance to build a bomber while enemies are in sight and fewer than `maxBombers` exist */
  bomberShare: number
  maxBombers: number
  /** Rounds a foreign unit out of sight is remembered where it was seen last (0: no memory) */
  memoryRounds: number
  /** Coordinated attacks: several units wear a defender down that none of them would take alone */
  strike: boolean
}

/** Difficulty plus personality style tags (setup master data, e.g. "Aggressiv", "Seekrieg") */
export function aiProfile(difficulty: Difficulty, style: readonly string[] = []): AiProfile {
  const p: AiProfile = {
    difficulty,
    attackThreshold: ATTACK_THRESHOLD[difficulty],
    skipShare: SKIP_SHARE[difficulty],
    // Sweep: every tenth of Dampfkoloss share costs hard about 3 points; only a grown realm builds them
    specialShare: difficulty === 'hard' ? 0.15 : 0,
    shipShare: difficulty === 'normal' ? 0.35 : 0,
    maxShips: 2,
    neutralBias: 0,
    garrison: false,
    siege: difficulty !== 'easy',
    siegeRatio: difficulty === 'hard' ? 1.5 : 2,
    cityValue: difficulty !== 'easy',
    replan: difficulty === 'hard' ? 'all' : difficulty === 'normal' ? 'goto' : 'none',
    defend: difficulty === 'hard',
    fortify: false,
    // Armour cracks defended cities (0.82 against a grenadier in a city, grenadiers 0.4)
    armourShare: difficulty === 'hard' ? 0.8 : difficulty === 'easy' ? 0.1 : 0.4,
    repair: difficulty === 'hard',
    // Sweep: two defenders are enough, more grenadiers only sit in the city
    garrisonTarget: difficulty === 'hard' ? 2 : 99,
    subShare: difficulty === 'hard' ? 0.3 : 0,
    transports: difficulty !== 'easy',
    // Sweep on islands: a second transport wins 66 % against one, hard gains up to four
    maxTransports: difficulty === 'hard' ? 3 : 2,
    departAt: 3,
    scoutShips: difficulty === 'hard' ? 2 : difficulty === 'normal' ? 1 : 0,
    dominanceDrive: difficulty !== 'easy',
    // Scouts cost more than they find (sweep: −20 points for hard); only the scout personality flies them
    scoutShare: 0,
    maxScouts: 2,
    bomberShare: difficulty === 'hard' ? 0.15 : 0,
    maxBombers: 2,
    memoryRounds: difficulty === 'easy' ? 0 : 5,
    strike: difficulty !== 'easy',
  }
  for (const tag of style) {
    switch (tag) {
      case 'Aggressiv':
      case 'Offensiv':
        p.attackThreshold -= 0.1
        break
      // Defensive personalities guard threatened cities; a garrison everywhere only costs expansion
      case 'Defensiv':
        p.attackThreshold += 0.1
        p.defend = true
        break
      case 'Befestigung':
        p.defend = true
        p.fortify = true
        break
      case 'Expansiv':
      case 'Wirtschaft':
        p.neutralBias = 3
        break
      case 'Seekrieg':
        p.shipShare = Math.max(p.shipShare, 0.35) + 0.2
        p.maxShips = 4
        p.maxTransports += 1
        p.scoutShips += 1
        p.subShare = Math.max(p.subShare, 0.3)
        p.specialShare += 0.15
        break
      case 'Landkrieg':
        p.shipShare /= 2
        break
      case 'Luftkrieg':
        p.specialShare += 0.15
        p.bomberShare += 0.15
        p.maxBombers = 4
        break
      case 'Aufklärung':
        p.scoutShare = 0.15
        p.maxScouts = 1
        break
    }
  }
  // Above 0.65 grenadiers never take a city (2/(2+1) against a neutral one), the AI would freeze
  p.attackThreshold = Math.min(0.65, Math.max(0.3, p.attackThreshold))
  return p
}

/** Hooks for the headless simulation; the server never sets them */
export interface AiTurnOptions {
  /** Overrides fields of the profile derived from difficulty and personality */
  profile?: Partial<AiProfile>
  /** Called after every accepted command; must not mutate the outcome */
  onCommand?: (cmd: Command, outcome: CommandOutcome) => void
  /** Wall-clock limit (epoch ms): no further command once passed. Breaks seed reproducibility, so only the server sets it */
  deadline?: number
}

/**
 * Deterministic work budget per AI turn: a command costs WORK_COMMAND, every tile expanded by a
 * path search costs 1. Sized so an Imperium board (200×200) stays well under the server's
 * 10 s limit; the old budget was 300 commands with unbounded searches.
 */
const MAX_WORK = 60_000
const WORK_COMMAND = 20
/** Tiles one AI path search may expand before it gives up */
const MAX_PATH_NODES = 3_000
/** How many candidate targets are path-checked per unit */
const MAX_CANDIDATES = 4
/** Free tiles next to a target the approach tries before giving up */
const MAX_APPROACHES = 3
/** Commands one unit may get in a turn (move, attack, attack again …) */
const MAX_UNIT_COMMANDS = 6
/** Unexplored edges are looked for within this distance first, then across the whole map */
const FRONTIER_RADIUS = 15
/** Shore tiles for a landing are looked for this far around the target city */
const SHORE_RADIUS = 8

/** The own view plus the connected land areas of the known map (hexKey → landmass id) */
type Knowledge = ReturnType<typeof knowledge> & {
  masses: Map<string, number>
  /** Who holds the dominance share right now (public, every player sees the countdown) */
  holder: string | null
  /** Remembered foreign units on tiles out of sight right now */
  ghosts: RememberedUnit[]
}

/** Flood fill over the known land tiles; unexplored tiles separate landmasses */
function landmasses(view: Pick<PlayerView, 'map'>): Map<string, number> {
  const land = new Map<string, HexCoord>()
  for (const t of expandMap(view.map))
    if (t.visibility !== 'unexplored' && !isWater(t.terrain)) land.set(hexKey(t), t)
  const masses = new Map<string, number>()
  let id = 0
  for (const [key, start] of land) {
    if (masses.has(key)) continue
    id++
    const stack = [start]
    masses.set(key, id)
    while (stack.length) {
      const cur = stack.pop()!
      for (const n of neighbors(cur)) {
        const k = hexKey(n)
        if (land.has(k) && !masses.has(k)) {
          masses.set(k, id)
          stack.push(land.get(k)!)
        }
      }
    }
  }
  return masses
}

const isTransport = (type: UnitType) =>
  type.domain === 'sea' && type.cargoDomain === 'land' && type.capacity > 0

/**
 * Play the turn of an AI participant. The AI only knows what its own view shows and
 * acts through `applyCommand`, so it follows exactly the same rules as a human player.
 * Does not end the turn.
 */
export function playAITurn(
  input: GameState,
  playerId: string,
  now = new Date(),
  options: AiTurnOptions = {},
): GameState {
  let state = input
  const me = participant(state, playerId)
  // The tutorial's opponent only defends with its garrison: no moves, no production
  if (!me || me.aiPersonalityId === TUTORIAL_AI_ID) return state
  const profile: AiProfile = {
    ...aiProfile(me.aiDifficulty ?? 'normal', aiPersonality(me.aiPersonalityId)?.style),
    ...options.profile,
  }
  dominanceFocus(state, playerId, profile)
  state = remember(state, playerId, profile.memoryRounds)
  // Work left this turn; path searches draw from it through the index's shared budget
  const work: PathBudget = { maxNodes: MAX_WORK, used: 0 }
  let budget = MAX_WORK
  const spend = (units: number) => {
    budget -= units
    work.maxNodes = Math.max(0, budget)
  }
  const outOfTime = () => options.deadline !== undefined && Date.now() > options.deadline
  // The own view is rebuilt only after a command changed the state
  let cache: Knowledge | null = null
  let masses: Map<string, number> | null = null
  const know = () => {
    if (!cache) {
      const k = knowledge(state, playerId)
      masses ??= landmasses(k.view)
      const memory = participant(state, playerId)?.aiMemory ?? []
      const seen = new Set(k.view.units.map((u) => u.id))
      const ghosts = memory.filter(
        (m) => !seen.has(m.id) && !isVisible(k.view.map.visibility, k.view.map, m),
      )
      cache = { ...k, masses, holder: state.dominance?.participantId ?? null, ghosts }
      // Every search on this index counts against the turn's work, capped per search
      cache.idx.pathBudget = {
        get maxNodes() {
          return Math.min(MAX_PATH_NODES + work.used, work.maxNodes)
        },
        set maxNodes(_v: number) {
          /* fixed by the turn */
        },
        get used() {
          return work.used
        },
        set used(v: number) {
          spend(v - work.used)
          work.used = v
        },
      }
    }
    return cache
  }

  const run = (cmd: Command) => {
    if (budget <= 0 || outOfTime()) return false
    spend(WORK_COMMAND)
    try {
      const outcome = applyCommand(state, playerId, cmd, now)
      state = outcome.state
      cache = null
      options.onCommand?.(cmd, outcome)
      return true
    } catch (e) {
      if (e instanceof CommandError) return false
      throw e
    }
  }

  if (state.phase === 'replay') run({ type: 'skipReplay' })

  // Own cities with a visible enemy close by, and border cities with others' cities or enemies known nearby
  const threatened = new Set<string>()
  const border = new Set<string>()
  if (profile.defend || profile.fortify) {
    const { view, ghosts } = know()
    const foes: HexCoord[] = [...view.units.filter((u) => u.ownerId !== playerId), ...ghosts]
    const others = view.cities.filter((c) => c.ownerId !== null && c.ownerId !== playerId)
    for (const city of view.cities) {
      if (city.ownerId !== playerId) continue
      if (foes.some((u) => hexDistance(u, city) <= THREAT_RANGE)) threatened.add(city.id)
      if (
        profile.fortify &&
        (foes.some((u) => hexDistance(u, city) <= BORDER_RANGE) ||
          others.some((c) => hexDistance(c, city) <= BORDER_RANGE))
      )
        border.add(city.id)
    }
  }

  // Production for idle cities and for cities that just started a build (changing it costs nothing)
  for (const city of state.cities) {
    if (city.ownerId !== playerId || (city.production && city.production.progress > 0)) continue
    const unitTypeId = chooseProduction(
      know(),
      state,
      playerId,
      city,
      profile,
      threatened.has(city.id),
      border.has(city.id),
    )
    if (city.production?.unitTypeId !== unitTypeId)
      run({ type: 'setProduction', cityId: city.id, unitTypeId })
  }

  const isLand = (u: Unit) => unitType(u.unitTypeId).domain === 'land'
  const own = () => state.units.filter((u) => u.ownerId === playerId && !u.carriedBy)
  // Cargo is planned too: it attacks or lands from aboard once the transport is across
  const unitIds = state.units.filter((u) => u.ownerId === playerId).map((u) => u.id)

  // Garrisons: the first land unit in every own city (garrison) or in every threatened city (defend)
  const garrison = new Set<string>()
  const guarded = state.cities.filter(
    (c) => c.ownerId === playerId && (profile.garrison || threatened.has(c.id) || border.has(c.id)),
  )
  for (const city of guarded) {
    const guard = own().find((u) => sameHex(u, city) && isLand(u))
    if (guard) garrison.add(guard.id)
  }
  // Threatened cities without a guard call the nearest free land unit back
  const recalled = new Set<string>()
  if (profile.defend) {
    for (const city of guarded) {
      if (own().some((u) => garrison.has(u.id) && sameHex(u, city))) continue
      const candidates = own()
        .filter(
          (u) =>
            isLand(u) &&
            !garrison.has(u.id) &&
            !recalled.has(u.id) &&
            u.movesLeft > 0 &&
            hexDistance(u, city) <= RECALL_RANGE,
        )
        .sort((a, b) => hexDistance(a, city) - hexDistance(b, city))
      for (const u of candidates) {
        if (u.order.type !== 'none' && !run({ type: 'cancelOrder', unitId: u.id })) continue
        if (run({ type: 'goto', unitId: u.id, target: { col: city.col, row: city.row } })) {
          recalled.add(u.id)
          break
        }
      }
    }
  }

  // Coordinated attacks first; whoever is left over plans on its own below
  if (profile.strike) {
    const busy = new Set([...garrison, ...recalled])
    for (let n = 0; n < MAX_STRIKES && budget > 0 && !outOfTime(); n++) {
      const plan = planStrike(know(), state, playerId, profile, busy)
      if (!plan) break
      for (let i = 0; i < plan.strikers.length; i++) {
        const id = plan.strikers[i]!
        busy.add(id)
        const k = know()
        if (!k.view.units.some((u) => u.id === plan.defenderId)) break
        // Dice decide each fight: go on only while the rest of the chain still pays off
        const rest = chainFor(k, state, playerId, plan.strikers.slice(i), plan.defenderId)
        if (!rest || !strikePaysOff(rest, profile)) break
        const u = state.units.find((x) => x.id === id)
        if (!u || u.movesLeft <= 0) continue
        if (u.order.type !== 'none' && !run({ type: 'cancelOrder', unitId: id })) continue
        run({ type: 'attack', unitId: id, target: { unitId: plan.defenderId } })
      }
    }
  }

  for (const id of unitIds) {
    if (budget <= 0) break
    const current = state.units.find((u) => u.id === id)
    if (!current || current.movesLeft <= 0 || recalled.has(id)) continue
    if (garrison.has(id)) {
      if (current.order.type !== 'sentry') run({ type: 'sentry', unitId: id })
      continue
    }
    const order = current.order.type
    // Transports and their cargo are always reconsidered, they follow the state of the voyage
    const voyage = unitType(current.unitTypeId).domain === 'sea' || !!current.carriedBy
    if (!voyage) {
      if (order === 'goto' && profile.replan === 'none') continue
      if (order === 'sentry' && profile.replan !== 'all') continue
    }
    if (order === 'patrol' || order === 'explore') continue
    if (random(state) < profile.skipShare) continue
    // A unit acts while it has moves left: move then attack, attack twice, advance and go on
    let last: string | null = null
    for (let i = 0; i < MAX_UNIT_COMMANDS && budget > 0; i++) {
      const u = state.units.find((x) => x.id === id)
      if (!u || u.movesLeft <= 0) break
      if (u.order.type === 'patrol' || u.order.type === 'explore') break
      const cmd = planUnit(know(), state, playerId, id, profile)
      if (!cmd) break
      const key = JSON.stringify(cmd)
      if (key === last) break // a blocked move would repeat forever
      last = key
      // The same destination as the standing order: let the order run on
      if (u.order.type === 'goto' && cmd.type === 'goto' && sameHex(cmd.target, u.order.target))
        break
      if (u.order.type !== 'none' && !run({ type: 'cancelOrder', unitId: id })) break
      if (!run(cmd)) break
    }
    const after = state.units.find((u) => u.id === id)
    if (after && after.order.type === 'none' && after.movesLeft > 0)
      run({ type: 'sentry', unitId: id })
  }
  return remember(state, playerId, profile.memoryRounds)
}

interface Chain {
  killChance: number
  expectedLoss: number
  /** Value of the defender, plus its share of the city it stands in */
  gain: number
}

const strikePaysOff = (c: Chain, profile: AiProfile) =>
  c.killChance >= profile.attackThreshold && c.killChance * c.gain >= c.expectedLoss

/** The chain of these attackers, in this order, against one defender in sight */
function chainFor(
  k: Knowledge,
  state: GameState,
  playerId: string,
  strikers: readonly string[],
  defenderId: string,
): Chain | null {
  const defender = k.view.units.find((u) => u.id === defenderId)
  if (!defender) return null
  const dType = unitType(defender.unitTypeId)
  const steps: ChainStep[] = []
  for (const id of strikers) {
    const u = state.units.find((x) => x.id === id)
    if (!u || u.movesLeft <= 0) continue
    const type = unitType(u.unitTypeId)
    steps.push({
      hitChance: combatOdds(state, id, { unitId: defenderId }).hitChance,
      attackerHp: u.hp,
      attackerDamage: type.damage,
      defenderDamage: dType.damage,
      cost: unitCost(type),
    })
  }
  if (!steps.length) return null
  const city = k.view.cities.find((c) => sameHex(c, defender) && c.ownerId !== playerId)
  const inside = city
    ? k.view.units.filter((u) => u.ownerId !== playerId && sameHex(u, city)).length
    : 0
  return {
    ...chainOdds(defender.hp, steps),
    gain: unitCost(dType) + (city ? CITY_WORTH.enemy / Math.max(1, inside) : 0),
  }
}

/**
 * The most rewarding coordinated attack this turn: a defender in sight that two or more free
 * units reach, but none of them would attack alone. Attackers go strongest first; in a city the
 * units that can capture it go last, so one is left to move in. The chain is cut to the fewest
 * attackers that make it pay off.
 */
function planStrike(
  k: Knowledge,
  state: GameState,
  playerId: string,
  profile: AiProfile,
  busy: ReadonlySet<string>,
): { defenderId: string; strikers: string[] } | null {
  const { view, idx } = k
  const foes = view.units.filter((u) => u.ownerId !== playerId && !u.carriedBy)
  if (!foes.length) return null
  const bases = airBases(view.cities, view.units, UNIT_TYPES, playerId)
  const byTarget = new Map<string, { id: string; kill: number; capture: boolean }[]>()
  for (const u of view.units) {
    if (u.ownerId !== playerId || u.carriedBy || busy.has(u.id) || u.movesLeft <= 0) continue
    if (u.order.type === 'patrol' || u.order.type === 'explore') continue
    const type = unitType(u.unitTypeId)
    // Scout planes (strength 1) keep exploring
    if (type.strength <= 0 || (type.domain === 'air' && type.strength <= 1)) continue
    // Only units with an enemy within a move and a strike can reach one at all
    if (!foes.some((f) => hexDistance(f, u) <= type.movement + 1)) continue
    for (const t of attackTargets(u, idx, view.units, view.cities, [])) {
      if (!t.unitId) continue
      const inCity = view.cities.some((c) => sameHex(c, t.coord) && c.ownerId !== playerId)
      if (inCity && !profile.siege) continue
      if (type.domain === 'air' && u.fuel != null) {
        const left = u.fuel - Math.max(0, hexDistance(u, t.coord) - 1) - 2
        if (left < returnDistance(t.coord, bases)) continue
      }
      const list = byTarget.get(t.unitId) ?? []
      list.push({
        id: u.id,
        kill: combatOdds(state, u.id, { unitId: t.unitId }).killChance,
        capture: type.canCaptureCities && inCity,
      })
      byTarget.set(t.unitId, list)
    }
  }
  let best: { defenderId: string; strikers: string[]; net: number } | null = null
  const candidates = [...byTarget.entries()]
    .filter(([, list]) => list.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, MAX_STRIKES)
  for (const [defenderId, list] of candidates) {
    // A unit that takes it alone is left to the single-unit planning
    if (list.some((s) => s.kill >= profile.attackThreshold)) continue
    const order = [...list]
      .sort((a, b) => Number(a.capture) - Number(b.capture) || b.kill - a.kill)
      .slice(0, MAX_STRIKERS)
      .map((s) => s.id)
    for (let n = 2; n <= order.length; n++) {
      const strikers = order.slice(0, n)
      const chain = chainFor(k, state, playerId, strikers, defenderId)
      if (!chain || !strikePaysOff(chain, profile)) continue
      const net = chain.killChance * chain.gain - chain.expectedLoss
      if (!best || net > best.net) best = { defenderId, strikers, net }
      break
    }
  }
  return best && { defenderId: best.defenderId, strikers: best.strikers }
}

const isVisible = (visibility: string, map: { width: number; height: number }, c: HexCoord) =>
  visibility.charCodeAt(tileIndex(map, c)) === 118 /* 'v' */

/**
 * Update what the AI remembers of foreign units: everything in sight now, plus earlier sightings
 * that are not older than `rounds`, whose tile is out of sight and whose owner is still in the
 * game. Only what the AI has seen itself goes in, so it knows no more than a human would.
 */
function remember(state: GameState, playerId: string, rounds: number): GameState {
  const me = participant(state, playerId)
  if (!me) return state
  let memory: RememberedUnit[] | null = null
  if (rounds > 0) {
    const { view } = knowledge(state, playerId)
    const playing = new Set(
      state.participants
        .filter((p) => p.status === 'active' && p.capitulatedRound == null)
        .map((p) => p.id),
    )
    const seen = view.units.filter(
      (u) => u.ownerId !== playerId && !u.carriedBy && playing.has(u.ownerId),
    )
    const seenIds = new Set(view.units.map((u) => u.id))
    const fresh = seen.map((u) => ({
      id: u.id,
      unitTypeId: u.unitTypeId,
      ownerId: u.ownerId,
      col: u.col,
      row: u.row,
      hp: u.hp,
      round: state.round,
    }))
    const kept = (me.aiMemory ?? []).filter(
      (m) =>
        !seenIds.has(m.id) &&
        m.ownerId !== playerId &&
        playing.has(m.ownerId) &&
        state.round - m.round < rounds &&
        !isVisible(view.map.visibility, view.map, m),
    )
    memory = [...fresh, ...kept].slice(0, MAX_MEMORY)
  }
  if (memory === null && me.aiMemory === null) return state
  return {
    ...state,
    participants: state.participants.map((p) =>
      p.id === playerId ? { ...p, aiMemory: memory } : p,
    ),
  }
}

/**
 * Adjust the turn's profile to the victory condition 'dominance'. With the share in reach the AI
 * ships more units, sails with fewer aboard and prefers neutral cities; holding it, it guards
 * every city with an enemy in sight. Only the number of cities is used, which the dominance
 * reports reveal to every player anyway; where they lie the AI still has to find out.
 */
function dominanceFocus(state: GameState, playerId: string, profile: AiProfile) {
  if (!profile.dominanceDrive || state.rules.victoryCondition !== 'dominance') return
  const total = state.cities.length
  const mine = state.cities.filter((c) => c.ownerId === playerId).length
  const gap = Math.ceil(dominanceShare(state) * total) - mine
  if (state.dominance?.participantId === playerId) {
    profile.defend = true
    profile.garrisonTarget = Math.min(profile.garrisonTarget, 2)
  }
  if (gap <= Math.max(DOMINANCE_REACH.cities, Math.ceil(mine * DOMINANCE_REACH.share))) {
    profile.maxTransports += 1
    profile.departAt = Math.min(profile.departAt, 2)
    profile.neutralBias = Math.max(profile.neutralBias, 3)
  }
}

function chooseProduction(
  k: Knowledge,
  state: GameState,
  playerId: string,
  city: HexCoord,
  profile: AiProfile,
  threatened: boolean,
  border = false,
): string {
  const { view } = k
  const own = (pred: (t: UnitType) => boolean, at?: HexCoord) =>
    state.units.filter(
      (u) =>
        u.ownerId === playerId &&
        !u.carriedBy &&
        pred(unitType(u.unitTypeId)) &&
        (!at || sameHex(u, at)),
    ).length
  // Units other cities already build count as present, so several ports do not all start one
  const building = (pred: (t: UnitType) => boolean) =>
    state.cities.filter(
      (c) =>
        c.ownerId === playerId &&
        !sameHex(c, city) &&
        c.production &&
        pred(unitType(c.production.unitTypeId)),
    ).length
  // A threatened city builds the quickest defender until its garrison is big enough
  if (threatened && own((t) => t.domain === 'land', city) < profile.garrisonTarget)
    return 'grenadiere'
  const faction = factionOf(state, playerId)
  const coastal = isCoastal(state, city)
  const roll = random(state)
  const special = UNIT_TYPES.find((t) => t.id === faction?.specialUnitTypeId)
  if (profile.transports && coastal) {
    // Ships scout the sea while fog remains: islands and their cities have to be found before
    // any transport makes sense (without it, a seat without gunboats never leaves its home island)
    const fogLeft = view.map.visibility.includes('u')
    const landUnits = own((t) => t.domain === 'land')
    const scouts = (t: UnitType) => t.domain === 'sea' && !isTransport(t)
    if (
      fogLeft &&
      landUnits >= 3 &&
      own(scouts) + building(scouts) < Math.max(1, profile.scoutShips)
    )
      return 'kanonenboot'
    const transports = own(isTransport) + building(isTransport)
    if (
      transports < profile.maxTransports &&
      landUnits >= 4 &&
      overseasCities(k, playerId, city).length > 0
    )
      return 'frachter'
    // Every transport gets a gunboat as its escort; a sea special (Aurelia's Blitzkorvette) only
    // with the special share, it decided island duels 80–88 % as the standard escort
    const isWarship = (t: UnitType) =>
      t.domain === 'sea' && t.strength > 0 && t.cargoDomain !== 'air'
    const warships = own(isWarship) + building(isWarship)
    if (transports > 0 && warships < transports)
      return special?.domain === 'sea' && random(state) < profile.specialShare
        ? special.id
        : 'kanonenboot'
    // A full bomber force overseas gets a carrier as its forward base (a lone bomber does not
    // justify 16 rounds of production; carriers that are sunk and rebuilt cost the expansion)
    const bombers = own((t) => t.domain === 'air' && t.strength > 1)
    const carriers = own((t) => t.cargoDomain === 'air') + building((t) => t.cargoDomain === 'air')
    if (
      profile.bomberShare > 0 &&
      transports > 0 &&
      bombers >= profile.maxBombers &&
      carriers === 0
    )
      return 'flugzeugtraeger'
  }
  // Submarines hunt the enemy ships in sight
  if (coastal && profile.subShare > 0 && own((t) => t.id === 'tauchboot') < 2) {
    const enemyShips = view.units.some(
      (u) => u.ownerId !== playerId && unitType(u.unitTypeId).domain === 'sea',
    )
    if (enemyShips && random(state) < profile.subShare) return 'tauchboot'
  }
  const ownAir = (id: string) =>
    state.units.filter((u) => u.ownerId === playerId && u.unitTypeId === id).length
  if (
    profile.scoutShare > 0 &&
    state.round <= SCOUT_ROUNDS &&
    ownAir('doppeldecker') < profile.maxScouts
  ) {
    const fog = view.map.visibility.includes('u')
    if (fog && random(state) < profile.scoutShare) return 'doppeldecker'
  }
  // Bombers; Nordmark flies its Wolkenkreuzer instead
  const bomber = special?.domain === 'air' ? special.id : 'schwerbomber'
  if (profile.bomberShare > 0 && ownAir(bomber) < profile.maxBombers) {
    const enemies = view.units.some((u) => u.ownerId !== playerId)
    if (enemies && random(state) < profile.bomberShare) return bomber
  }
  if (coastal && profile.shipShare > 0) {
    const ships = state.units.filter(
      (u) => u.ownerId === playerId && unitType(u.unitTypeId).domain === 'sea',
    ).length
    if (ships < profile.maxShips && roll < profile.shipShare) return 'kanonenboot'
  }
  // Border cities of fortifiers get more armour
  const armour = border ? Math.max(profile.armourShare, 0.6) : profile.armourShare
  if (roll < 1 - armour) return 'grenadiere'
  // Part of the armour is the faction's land special (Eisenbund: Dampfkoloss), once the opening is over
  if (
    special?.domain === 'land' &&
    state.round >= SPECIAL_ROUNDS &&
    state.cities.filter((c) => c.ownerId === playerId).length >= SPECIAL_CITIES &&
    random(state) < profile.specialShare
  )
    return special.id
  return 'panzerwagen'
}

/** What a unit is worth, measured in grenadier builds */
const unitCost = (type: UnitType) => type.productionTurns / unitType('grenadiere').productionTurns

/**
 * Whether a city attack pays off: the capture chance times the city's worth against the unit
 * that is spent, measured in grenadier builds. A healthy multi-hit-point unit leaves grenadiers
 * behind when it takes the city, which refunds one build.
 */
function cityAttackPaysOff(
  unit: Unit,
  type: UnitType,
  cityOwnerId: string | null,
  killChance: number,
): boolean {
  const worth = cityOwnerId === null ? CITY_WORTH.neutral : CITY_WORTH.enemy
  const refund = type.hitPoints > 1 && unit.hp === type.hitPoints ? 1 : 0
  const cost = Math.max(0.5, unitCost(type) - refund)
  return killChance * worth >= cost
}

/**
 * Whether attacking a defender inside an enemy city pays off: the kill chance times the defender
 * plus its share of the city against the chance to lose the attacker. Only with more attackers
 * around the city than defenders in it, so a siege does not feed units in one by one.
 */
function siegePaysOff(
  { view, ghosts }: Knowledge,
  playerId: string,
  type: UnitType,
  defenderId: string,
  city: HexCoord,
  odds: { killChance: number; deathChance: number },
  ratio: number,
): boolean {
  // Remembered defenders count while the city tile is out of sight
  const defenders = [...view.units, ...ghosts].filter(
    (u) => u.ownerId !== playerId && sameHex(u, city),
  )
  const besiegers = view.units.filter(
    (u) =>
      u.ownerId === playerId &&
      !u.carriedBy &&
      unitType(u.unitTypeId).strength > 0 &&
      hexDistance(u, city) <= 2,
  )
  if (besiegers.length <= defenders.length * ratio) return false
  const defender = view.units.find((u) => u.id === defenderId)
  if (!defender) return false
  const gain =
    odds.killChance *
    (unitCost(unitType(defender.unitTypeId)) + CITY_WORTH.enemy / defenders.length)
  return gain >= odds.deathChance * unitCost(type)
}

const massOf = (k: Knowledge, c: HexCoord) => k.masses.get(hexKey(c))

/** Known cities of others on a different landmass than `from` (or on an unknown one) */
function overseasCities(k: Knowledge, playerId: string, from: HexCoord) {
  const home = massOf(k, from)
  return k.view.cities.filter((c) => c.ownerId !== playerId && massOf(k, c) !== home)
}

/** Water tiles next to a landmass, nearest to `near` first */
function shoreTiles(k: Knowledge, mass: number, near: HexCoord) {
  return tilesNear(k.view.map, near, SHORE_RADIUS).filter(
    (t) =>
      k.idx.visibilityAt(t) !== 'unexplored' &&
      isWater(k.idx.terrainAt(t) ?? 'plains') &&
      neighbors(t).some((n) => massOf(k, n) === mass),
  )
}

/**
 * Cities across the water a loaded transport may sail for, best first: the city's worth plus the
 * other cities to take on its landmass, less its visible defenders, against the distance. Cities
 * on a landmass where the transport lies at an own pier are left out, the cargo would not land.
 * `easy` marks a neutral city without a defender in sight.
 */
function transportTargets(k: Knowledge, playerId: string, unit: Unit, profile: AiProfile) {
  const { view } = k
  const { holder } = k
  const piers = new Set(
    neighbors(unit)
      .filter((n) => view.cities.some((c) => c.ownerId === playerId && sameHex(c, n)))
      .map((n) => massOf(k, n)),
  )
  const foreign = view.cities.filter((c) => c.ownerId !== playerId && massOf(k, c) !== undefined)
  const perMass = new Map<number, number>()
  for (const c of foreign) perMass.set(massOf(k, c)!, (perMass.get(massOf(k, c)!) ?? 0) + 1)
  return foreign
    .filter((c) => !piers.has(massOf(k, c)))
    .map((city) => {
      const defenders = [...view.units, ...k.ghosts].filter(
        (u) =>
          u.ownerId !== playerId &&
          !('carriedBy' in u && u.carriedBy) &&
          unitType(u.unitTypeId).domain === 'land' &&
          hexDistance(u, city) <= 1,
      ).length
      const worth =
        (city.ownerId === null ? CITY_WORTH.neutral + profile.neutralBias : CITY_WORTH.enemy) +
        (holder && city.ownerId === holder && holder !== playerId ? BREAK_WORTH : 0) +
        Math.min(3, perMass.get(massOf(k, city)!)! - 1) -
        3 * defenders
      return {
        city,
        easy: city.ownerId === null && defenders === 0,
        value: Math.max(0.5, worth) / (6 + hexDistance(city, unit)),
      }
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, MAX_CANDIDATES)
}

/** Where a transport goes: a pier to load at, the shore of the target, or nowhere (wait) */
function planTransport(
  k: Knowledge,
  playerId: string,
  unit: Unit,
  type: UnitType,
  profile: AiProfile,
): Command | null {
  const { view, idx } = k
  const unitId = unit.id
  const goto = (target: HexCoord): Command => ({
    type: 'goto',
    unitId,
    target: { col: target.col, row: target.row },
  })
  const cargo = unit.cargoUnitIds.length
  if (cargo >= Math.min(2, type.capacity)) {
    const targets = transportTargets(k, playerId, unit, profile)
    const need = Math.min(type.capacity, targets[0]?.easy ? 2 : profile.departAt)
    if (cargo >= need) {
      for (const { city } of targets) {
        const mass = massOf(k, city)!
        if (neighbors(unit).some((n) => massOf(k, n) === mass)) return null // across, cargo acts
        for (const shore of shoreTiles(k, mass, city).slice(0, MAX_CANDIDATES)) {
          if (sameHex(shore, unit)) return null
          if (findPath(unit, shore, idx)) return goto(shore)
        }
      }
      return null
    }
  }
  // Load at the own coastal city with the most land units close by
  const piers = view.cities
    .filter((c) => c.ownerId === playerId)
    .map((c) => ({
      city: c,
      nearby: view.units.filter(
        (u) =>
          u.ownerId === playerId &&
          !u.carriedBy &&
          unitType(u.unitTypeId).domain === 'land' &&
          hexDistance(u, c) <= 2,
      ).length,
    }))
    .sort((a, b) => b.nearby - a.nearby || hexDistance(a.city, unit) - hexDistance(b.city, unit))
  for (const { city } of piers.slice(0, 3)) {
    const water = neighbors(city)
      .filter((n) => {
        const t = idx.tileAt(n)
        return !!t && isWater(t.terrain)
      })
      .sort((a, b) => hexDistance(a, unit) - hexDistance(b, unit))
    for (const w of water) {
      if (sameHex(w, unit)) return null
      if (findPath(unit, w, idx)) return goto(w)
    }
  }
  return null
}

/** A warship: escort the nearest loaded transport, else hunt enemy ships in sight */
function planWarship(k: Knowledge, playerId: string, unit: Unit): Command | null {
  const { view, idx } = k
  const transports = view.units
    .filter(
      (u) =>
        u.ownerId === playerId &&
        isTransport(unitType(u.unitTypeId)) &&
        isWater(idx.tileAt(u)?.terrain ?? 'plains'),
    )
    .sort(
      (a, b) =>
        b.cargoUnitIds.length - a.cargoUnitIds.length ||
        hexDistance(a, unit) - hexDistance(b, unit),
    )
  // Each transport keeps its nearest warship as escort, loaded ones first; the others hunt or scout
  const warships = view.units.filter((u) => {
    const t = unitType(u.unitTypeId)
    return (
      u.ownerId === playerId &&
      !u.carriedBy &&
      t.domain === 'sea' &&
      t.strength > 0 &&
      !isTransport(t)
    )
  })
  const taken = new Set<string>()
  let convoy: Unit | undefined
  for (const t of transports) {
    const escort = warships
      .filter((w) => !taken.has(w.id))
      .sort((a, b) => hexDistance(a, t) - hexDistance(b, t))[0]
    if (!escort) break
    taken.add(escort.id)
    if (escort.id === unit.id) {
      convoy = t
      break
    }
  }
  if (convoy) {
    if (hexDistance(convoy, unit) <= 1) return null
    const goal = approach(unit, convoy, idx)
    if (goal) return { type: 'goto', unitId: unit.id, target: goal }
  }
  const prey = view.units
    .filter(
      (u) =>
        u.ownerId !== playerId &&
        !u.carriedBy &&
        unitType(u.unitTypeId).domain === 'sea' &&
        isWater(idx.tileAt(u)?.terrain ?? 'plains'),
    )
    .sort((a, b) => hexDistance(a, unit) - hexDistance(b, unit))
    .slice(0, MAX_CANDIDATES)
  for (const enemy of prey) {
    const goal = approach(unit, enemy, idx)
    if (goal) return { type: 'goto', unitId: unit.id, target: goal }
  }
  return null
}

/** A carried land unit: fight from aboard or step ashore on a foreign landmass */
function planCargo(k: Knowledge, playerId: string, unit: Unit): Command | null {
  const { view, idx } = k
  const transport = view.units.find((u) => u.id === unit.carriedBy)
  if (!transport) return null
  // On a landmass with own cities the cargo lands only where a foreign city is closer than an own
  // one: a transport at an own pier is loading, one off the coast of a foreign city has arrived
  const ownCities = view.cities.filter((c) => c.ownerId === playerId)
  const foreign = view.cities.filter((c) => c.ownerId !== playerId)
  const nearest = (cities: typeof foreign, mass: number) =>
    Math.min(
      ...cities.filter((c) => massOf(k, c) === mass).map((c) => hexDistance(c, transport)),
      Infinity,
    )
  const landing = neighbors(transport)
    .filter((n) => {
      const t = idx.tileAt(n)
      const mass = massOf(k, n)
      return (
        !!t &&
        !isWater(t.terrain) &&
        mass !== undefined &&
        nearest(foreign, mass) < nearest(ownCities, mass) &&
        !idx.cityAt(n) &&
        idx.unitsAt(n).every((u) => u.ownerId === playerId)
      )
    })
    .map((n) => ({
      n,
      dist: Math.min(
        ...foreign.filter((c) => massOf(k, c) === massOf(k, n)).map((c) => hexDistance(c, n)),
        Infinity,
      ),
    }))
    .filter((x) => x.dist < Infinity)
    .sort((a, b) => a.dist - b.dist)[0]
  return landing
    ? { type: 'move', unitId: unit.id, target: { col: landing.n.col, row: landing.n.row } }
    : null
}

function planUnit(
  k: Knowledge,
  state: GameState,
  playerId: string,
  unitId: string,
  profile: AiProfile,
): Command | null {
  const { view, idx } = k
  const unit = view.units.find((u) => u.id === unitId)
  if (!unit) return null
  const type = unitType(unit.unitTypeId)
  const cityAt = (c: HexCoord) => view.cities.find((x) => sameHex(x, c))

  if (isTransport(type)) return planTransport(k, playerId, unit, type, profile)

  // Aircraft: get back to a base before the fuel runs out
  const bases = type.domain === 'air' ? airBases(view.cities, view.units, UNIT_TYPES, playerId) : []
  if (type.domain === 'air' && unit.fuel != null) {
    const nearest = [...bases].sort((a, b) => hexDistance(a, unit) - hexDistance(b, unit))[0]
    if (
      nearest &&
      !sameHex(nearest, unit) &&
      unit.fuel <= hexDistance(nearest, unit) + type.movement
    ) {
      return { type: 'goto', unitId, target: { col: nearest.col, row: nearest.row } }
    }
    // Scouts explore the fog with the engine's explore order; it brings them home to refuel
    if (type.strength <= 1) {
      if (view.map.visibility.includes('u')) return { type: 'explore', unitId }
      return nearest && !sameHex(nearest, unit)
        ? { type: 'goto', unitId, target: { col: nearest.col, row: nearest.row } }
        : null
    }
  }
  /** Fuel left after flying next to the target and attacking (one move, one advance) */
  const fuelAfterAttack = (target: HexCoord) =>
    unit.fuel == null ? Infinity : unit.fuel - Math.max(0, hexDistance(unit, target) - 1) - 2

  // 0. Repairs: a land unit at half its hit points or less heads for the nearest own city
  if (
    profile.repair &&
    type.domain === 'land' &&
    type.hitPoints > 1 &&
    unit.hp * 2 <= type.hitPoints &&
    !cityAt(unit)
  ) {
    const home = view.cities
      .filter((c) => c.ownerId === playerId && hexDistance(c, unit) <= REPAIR_RANGE)
      .sort((a, b) => hexDistance(a, unit) - hexDistance(b, unit))
      .find((c) => findPath(unit, c, idx))
    if (home) return { type: 'goto', unitId, target: { col: home.col, row: home.row } }
  }

  // 1. Attack the most promising target: the chance to win the fight, cities preferred.
  // A damaged multi-hit-point unit is spent in a city attack without leaving a garrison, so it
  // does not try.
  if (type.strength > 0) {
    const spentForNothing = type.hitPoints > 1 && unit.hp < type.hitPoints
    const worthIt = (t: {
      cityId?: string
      unitId?: string
      coord: HexCoord
      odds: { killChance: number; deathChance: number }
    }) => {
      if (t.cityId) {
        if (spentForNothing) return false
        if (!profile.cityValue) return t.odds.killChance >= profile.attackThreshold
        return cityAttackPaysOff(unit, type, cityAt(t.coord)?.ownerId ?? null, t.odds.killChance)
      }
      const city = cityAt(t.coord)
      if (city && t.unitId) {
        if (!profile.siege) return false
        if (t.odds.killChance >= profile.attackThreshold) return true
        return siegePaysOff(k, playerId, type, t.unitId, city, t.odds, profile.siegeRatio)
      }
      return t.odds.killChance >= profile.attackThreshold
    }
    const targets = attackTargets(unit, idx, view.units, view.cities, [])
      .filter(
        (t) => type.domain !== 'air' || fuelAfterAttack(t.coord) >= returnDistance(t.coord, bases),
      )
      .map((t) => ({ ...t, odds: combatOdds(state, unitId, t) }))
      .filter(worthIt)
      .sort(
        (a, b) =>
          (b.cityId ? 0.25 : 0) + b.odds.killChance - ((a.cityId ? 0.25 : 0) + a.odds.killChance) ||
          a.odds.expectedDamageTaken - b.odds.expectedDamageTaken,
      )
    const best = targets[0]
    if (best)
      return {
        type: 'attack',
        unitId,
        target: best.unitId ? { unitId: best.unitId } : { cityId: best.cityId! },
      }
  }

  // Cargo without a target in reach steps ashore on the foreign landmass
  if (unit.carriedBy) return planCargo(k, playerId, unit)

  // Warships escort transports or hunt ships before they go exploring
  if (type.domain === 'sea' && type.strength > 0) {
    const cmd = planWarship(k, playerId, unit)
    if (cmd) return cmd
  }

  // Bombers wait at a base for targets in sight instead of roaming into the fog
  if (type.domain === 'air') {
    const nearest = [...bases].sort((a, b) => hexDistance(a, unit) - hexDistance(b, unit))[0]
    return nearest && !sameHex(nearest, unit)
      ? { type: 'goto', unitId, target: { col: nearest.col, row: nearest.row } }
      : null
  }

  // 2. Expand: march towards the nearest city that is not ours
  if (type.canCaptureCities) {
    const { holder, ghosts } = k
    const guarded = new Map<string, number>()
    for (const g of ghosts) guarded.set(hexKey(g), (guarded.get(hexKey(g)) ?? 0) + 1)
    const distance = (c: (typeof view.cities)[number]) =>
      hexDistance(c, unit) -
      (c.ownerId === null ? profile.neutralBias : 0) -
      (holder && holder !== playerId && c.ownerId === holder ? BREAK_WORTH : 0) +
      GHOST_DEFENDER * (guarded.get(hexKey(c)) ?? 0)
    const cities = view.cities
      .filter((c) => c.ownerId !== playerId)
      .sort((a, b) => distance(a) - distance(b))
      .slice(0, MAX_CANDIDATES)
    for (const city of cities) {
      const goal = approach(unit, city, idx)
      if (goal) return { type: 'goto', unitId, target: goal }
    }
  }

  // 2a. Overseas: board a transport with room when the cities left to take lie across the water
  if (profile.transports && type.canCaptureCities && overseasCities(k, playerId, unit).length) {
    const transport = view.units
      .filter(
        (u) =>
          u.ownerId === playerId &&
          !u.carriedBy &&
          isTransport(unitType(u.unitTypeId)) &&
          u.cargoUnitIds.length < unitType(u.unitTypeId).capacity &&
          isWater(idx.tileAt(u)?.terrain ?? 'plains'),
      )
      .sort((a, b) => hexDistance(a, unit) - hexDistance(b, unit))[0]
    if (transport) {
      if (reachableTiles(unit, idx).has(hexKey(transport)))
        return { type: 'move', unitId, target: { col: transport.col, row: transport.row } }
      const goal = approach(unit, transport, idx)
      if (goal) return { type: 'goto', unitId, target: goal }
    }
  }

  // 2b. Hunt: without a city to take, close in on the nearest enemy unit in sight
  // Without one in sight, head for where an enemy was seen last
  if (type.strength > 0 && type.domain === 'land') {
    const onLand = (c: HexCoord) => !isWater(idx.tileAt(c)?.terrain ?? 'deepSea')
    const visible = view.units.filter((u) => u.ownerId !== playerId && !u.carriedBy && onLand(u))
    const enemies = (visible.length ? visible : k.ghosts.filter(onLand))
      .sort((a, b) => hexDistance(a, unit) - hexDistance(b, unit))
      .slice(0, MAX_CANDIDATES)
    for (const enemy of enemies) {
      const goal = approach(unit, enemy, idx)
      if (goal) return { type: 'goto', unitId, target: goal }
    }
  }

  // 3. Explore: the nearest known tile at the edge of the unknown (near first, then anywhere)
  const frontier = frontierNear(idx, unit, FRONTIER_RADIUS, MAX_CANDIDATES, (t) =>
    fitsDomain(type, idx.terrainAt(t) ?? 'deepSea', idx.cityAt(t)?.ownerId === playerId),
  )
  for (const tile of frontier) {
    if (sameHex(tile, unit)) continue
    if (findPath(unit, tile, idx))
      return { type: 'goto', unitId, target: { col: tile.col, row: tile.row } }
  }
  return null
}

function fitsDomain(type: UnitType, terrain: Parameters<typeof isWater>[0], ownCity: boolean) {
  if (type.domain === 'air') return true
  if (type.domain === 'sea') return isWater(terrain) || ownCity
  return !isWater(terrain)
}

/** A free tile next to the target that the unit can reach, closest first */
function approach(
  unit: Unit,
  target: HexCoord,
  idx: ReturnType<typeof knowledge>['idx'],
): HexCoord | null {
  if (hexDistance(unit, target) === 1) return null
  const options = neighbors(target)
    .filter((n) => idx.tileAt(n))
    .sort((a, b) => hexDistance(a, unit) - hexDistance(b, unit))
  for (const n of options.slice(0, MAX_APPROACHES)) {
    if (sameHex(n, unit)) return null
    if (findPath(unit, n, idx)) return n
  }
  return null
}
