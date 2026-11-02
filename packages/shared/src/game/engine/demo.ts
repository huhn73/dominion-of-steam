import { bitsFromKeys, emptyBits } from '../bits'
import { encodeTerrain } from '../mapcodec'
import demoData from '../demo-data.json'
import type { City, GameEvent, Match, Participant, ReplayAction, Tile, Unit } from '../types'
import { defaultRules, type GameState } from './state'
import { updateKnowledge } from './visibility'

interface DemoData {
  match: Match
  participants: Participant[]
  map: { width: number; height: number; seed: string; tiles: Tile[] }
  cities: City[]
  units: Unit[]
  events: GameEvent[]
  replay: ReplayAction[]
}

/** Participant ids of the sample data (`p1`…`p4`) mapped to other ids, e.g. player ids */
export type ParticipantMapping = Partial<Record<string, string>>

/**
 * Demo match "Die Kohleinseln" from the design handoff's sample data, Björn (p1) to move.
 * `mapping` replaces participant ids everywhere in the state (default: unchanged).
 */
export function seedDemo(
  id = 'demo',
  now = new Date(),
  mapping: ParticipantMapping = {},
): GameState {
  const data = demoData as unknown as DemoData
  const exploredByP1 = data.map.tiles
    .filter((t) => t.visibility !== 'unexplored')
    .map((t) => `${t.col},${t.row}`)

  // Lena Hartmann's home city lies in the unexplored north-east, so her Wolkenkreuzer has a base
  const cities = [
    ...data.cities,
    {
      id: 'c8',
      name: 'Frostheim',
      ownerId: 'p3',
      isCapital: true,
      col: 15,
      row: 4,
      production: null,
    },
  ]

  let seq = 0
  const state: GameState = {
    id,
    name: data.match.name,
    mode: data.match.mode,
    rules: defaultRules(data.match.mode),
    seed: data.map.seed,
    winnerId: null,
    endedAt: null,
    endReason: null,
    dominance: null,
    round: data.match.round,
    status: 'running',
    seat: 0,
    phase: data.replay.length ? 'replay' : 'yourTurn',
    turnDeadline:
      data.match.mode === 'async' ? new Date(now.getTime() + 48 * 3600_000).toISOString() : null,
    participants: data.participants.map((p) => ({
      id: p.id,
      name: p.name,
      isAI: p.isAI,
      aiDifficulty: p.aiDifficulty,
      factionId: p.factionId,
      color: p.color,
      status: p.status,
      explored:
        p.id === 'p1'
          ? bitsFromKeys(exploredByP1, data.map)
          : emptyBits(data.map.width * data.map.height),
      lastTurnEndSeq: 0,
      aiPersonalityId: null,
      capitalCityId: cities.find((c) => c.isCapital && c.ownerId === p.id)?.id ?? null,
      citiesCaptured: 0,
      unitsBuilt: 0,
      eliminatedSeq: null,
      surrender: null,
      capitulatedRound: null,
      placement: null,
      seenAtTurnEnd: null,
    })),
    map: {
      width: data.map.width,
      height: data.map.height,
      seed: data.map.seed,
      terrain: encodeTerrain(
        data.map.tiles.map(({ col, row, terrain }) => ({
          col,
          row,
          terrain: col === 15 && row === 4 ? 'plains' : terrain,
        })),
        data.map.width,
        data.map.height,
      ),
    },
    cities: cities.map((c) => ({
      ...c,
      damage: 0,
      underFire: false,
      knownBy: (exploredByP1.includes(`${c.col},${c.row}`) ? { p1: c.ownerId } : {}) as Record<
        string,
        string | null
      >,
    })),
    units: data.units.map((u) => ({ ...u })),
    events: [
      ...data.events,
      // Discovered during the opponents' turns (turn report)
      {
        id: 'ev8',
        round: data.match.round,
        type: 'cityDiscovered' as const,
        message: 'Port Aurel ist jetzt in der Hand von Admiral Kessler.',
        col: 13,
        row: 5,
        isNew: true,
      },
    ].map((e) => ({ ...e, participantId: 'p1', seq: ++seq })),
    log: data.replay.map((r) => ({
      seq: ++seq,
      round: data.match.round,
      participantId: r.participantId,
      action: r.action,
      unitTypeId: r.unitTypeId,
      path: r.path,
      result: r.result,
      seenBy: { p1: r.path },
    })),
    seq: 0,
    rng: 0,
    nextId: 100,
  }
  state.seq = seq
  updateKnowledge(state)
  return remapParticipants(state, mapping)
}

/** Replace participant ids in all places of the state that refer to participants */
export function remapParticipants(state: GameState, mapping: ParticipantMapping): GameState {
  const map = <T extends string | null>(pid: T): T =>
    pid === null ? pid : ((mapping[pid] ?? pid) as T)
  const mapKeys = <V>(rec: Record<string, V>) =>
    Object.fromEntries(Object.entries(rec).map(([k, v]) => [map(k), v]))
  for (const p of state.participants) p.id = map(p.id)
  state.winnerId = map(state.winnerId)
  for (const u of state.units) u.ownerId = map(u.ownerId)
  for (const c of state.cities) {
    c.ownerId = map(c.ownerId)
    c.knownBy = Object.fromEntries(Object.entries(c.knownBy).map(([k, v]) => [map(k), map(v)]))
  }
  for (const e of state.events) e.participantId = map(e.participantId)
  for (const l of state.log) {
    l.participantId = map(l.participantId)
    l.seenBy = mapKeys(l.seenBy)
  }
  return state
}
