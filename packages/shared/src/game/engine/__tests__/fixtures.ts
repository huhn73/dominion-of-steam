import { bitsFromKeys } from '../../bits'
import type { Terrain, Unit } from '../../types'
import { hexKey } from '../../hex'
import {
  type CityState,
  defaultRules,
  type GameRules,
  type GameState,
  type ParticipantState,
  unitType,
} from '../state'
import { updateKnowledge } from '../visibility'

const TERRAIN: Record<string, Terrain> = {
  '.': 'plains',
  '~': 'deepSea',
  s: 'shallows',
  f: 'forest',
  h: 'hills',
  m: 'mountains',
}

export function participantState(
  id: string,
  factionId: string,
  extra: Partial<ParticipantState> = {},
): ParticipantState {
  return {
    id,
    name: id === 'p1' ? 'Björn' : `Gegner ${id}`,
    isAI: id !== 'p1',
    aiDifficulty: id !== 'p1' ? 'normal' : null,
    factionId,
    color: id === 'p1' ? 'amber' : 'rose',
    status: 'active',
    explored: '',
    lastTurnEndSeq: 0,
    aiPersonalityId: null,
    capitalCityId: null,
    citiesCaptured: 0,
    unitsBuilt: 0,
    eliminatedSeq: null,
    surrender: null,
    capitulatedRound: null,
    placement: null,
    seenAtTurnEnd: null,
    aiMemory: null,
    ...extra,
  }
}

export function unit(
  id: string,
  unitTypeId: string,
  ownerId: string,
  col: number,
  row: number,
  extra: Partial<Unit> = {},
): Unit {
  const type = unitType(unitTypeId)
  return {
    id,
    unitTypeId,
    ownerId,
    col,
    row,
    hp: type.hitPoints,
    movesLeft: type.movement,
    fuel: type.range,
    order: { type: 'none' },
    cargoUnitIds: [],
    carriedBy: null,
    needsOrders: true,
    ...extra,
  }
}

export function city(
  id: string,
  ownerId: string | null,
  col: number,
  row: number,
  extra: Partial<CityState> = {},
): CityState {
  return {
    id,
    name: `Stadt ${id}`,
    ownerId,
    isCapital: false,
    col,
    row,
    production: null,
    damage: 0,
    knownBy: {},
    underFire: false,
    ...extra,
  }
}

/**
 * Build a small match. Rows of the map are strings: "." plains, "~" deep sea, "s" shallows, "f" forest.
 * All tiles are explored by everybody unless `unexplored` lists hexKeys.
 */
export function makeState(opts: {
  map: string[]
  units?: Unit[]
  cities?: CityState[]
  participants?: ParticipantState[]
  unexplored?: string[]
  mode?: 'live' | 'async'
  rules?: Partial<GameRules>
}): GameState {
  const rows = opts.map.map((line) => line.replace(/\s/g, ''))
  const width = rows[0]!.length
  const height = rows.length
  const terrain = rows.join('')
  for (const ch of terrain) if (!(ch in TERRAIN)) throw new Error(`Unbekanntes Gelände: ${ch}`)
  const hidden = new Set(opts.unexplored ?? [])
  const participants = opts.participants ?? [
    participantState('p1', 'eisenbund'),
    participantState('p2', 'aurelia'),
  ]
  const known: string[] = []
  for (let row = 0; row < height; row++)
    for (let col = 0; col < width; col++) {
      const k = hexKey({ col, row })
      if (!hidden.has(k)) known.push(k)
    }
  for (const p of participants) p.explored = bitsFromKeys(known, { width, height })
  const state: GameState = {
    id: 'test',
    name: 'Testpartie',
    mode: opts.mode ?? 'live',
    rules: { ...defaultRules(opts.mode ?? 'live'), ...opts.rules },
    winnerId: null,
    endedAt: null,
    endReason: null,
    dominance: null,
    seed: 'TEST-1',
    round: 1,
    status: 'running',
    seat: 0,
    phase: 'yourTurn',
    turnDeadline: null,
    participants,
    map: { width, height, seed: 'TEST-1', terrain },
    cities: (opts.cities ?? []).map((c) => ({
      ...c,
      knownBy: hidden.has(hexKey(c))
        ? {}
        : Object.fromEntries(participants.map((p) => [p.id, c.ownerId])),
    })),
    units: opts.units ?? [],
    events: [],
    log: [],
    seq: 0,
    rng: 0,
    nextId: 1000,
  }
  updateKnowledge(state)
  return state
}

export const PLAINS = ['........', '........', '........', '........', '........', '........']
