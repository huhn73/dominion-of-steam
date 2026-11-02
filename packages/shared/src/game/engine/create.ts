import { emptyBits } from '../bits'
import { withBonus } from '../bonus'
import type { Participant } from '../types'
import { generateWorld, type MapSettings } from './mapgen'
import {
  type CityState,
  factionOf,
  type GameRules,
  type GameState,
  turnDeadline,
  unitType,
  type UnitState,
} from './state'
import { updateKnowledge } from './visibility'

const CAPITAL_NAMES: Record<string, string> = {
  eisenbund: 'Eisenhafen',
  aurelia: 'Port Aurel',
  nordmark: 'Frostheim',
  salzkueste: 'Salzwacht',
}

export interface NewParticipant {
  id: string
  name: string
  factionId: string
  color: Participant['color']
  isAI: boolean
  aiDifficulty: Participant['aiDifficulty']
  /** AI personality from the setup master data (style tweaks the AI) */
  aiPersonalityId?: string | null
}

export interface NewMatch {
  id: string
  name: string
  rules: GameRules
  map: MapSettings
  participants: NewParticipant[]
}

/** Create a match on a generated world; every participant starts with a capital and one unit */
export function createMatch(config: NewMatch, now = new Date()): GameState {
  const world = generateWorld(config.map, config.participants.length)
  if (world.capitals.length < config.participants.length)
    throw new Error('Auf dieser Karte ist nicht genug Platz für alle Hauptstädte.')

  const state: GameState = {
    id: config.id,
    name: config.name,
    mode: config.rules.mode,
    rules: { ...config.rules },
    seed: config.map.seed,
    round: 1,
    status: 'running',
    winnerId: null,
    endedAt: null,
    seat: 0,
    phase: 'yourTurn',
    turnDeadline: turnDeadline(config, now),
    participants: config.participants.map((p, i) => ({
      ...p,
      aiPersonalityId: p.aiPersonalityId ?? null,
      status: 'active',
      explored: emptyBits(config.map.width * config.map.height),
      lastTurnEndSeq: 0,
      capitalCityId: `c${i + 1}`,
      citiesCaptured: 0,
      unitsBuilt: 0,
      eliminatedSeq: null,
      surrender: null,
      placement: null,
      seenAtTurnEnd: null,
    })),
    map: {
      width: config.map.width,
      height: config.map.height,
      seed: config.map.seed,
      terrain: world.terrain,
    },
    cities: [],
    units: [],
    events: [],
    log: [],
    seq: 0,
    rng: 0,
    nextId: 0,
  }

  const usedNames = new Set<string>()
  const grenadiere = unitType('grenadiere')
  config.participants.forEach((p, i) => {
    const at = world.capitals[i]!
    const faction = factionOf(state, p.id)
    let name = CAPITAL_NAMES[p.factionId] ?? `Hauptstadt ${i + 1}`
    if (usedNames.has(name)) name = `${name} ${i + 1}`
    usedNames.add(name)
    const city: CityState = {
      id: `c${i + 1}`,
      name,
      ownerId: p.id,
      isCapital: true,
      col: at.col,
      row: at.row,
      production: {
        unitTypeId: grenadiere.id,
        progress: 0,
        turnsRemaining:
          withBonus(grenadiere, faction, 'productionTurns') ?? grenadiere.productionTurns,
      },
      damage: 0,
      knownBy: {},
      underFire: false,
    }
    state.cities.push(city)
    const unit: UnitState = {
      id: `u${i + 1}`,
      unitTypeId: grenadiere.id,
      ownerId: p.id,
      col: at.col,
      row: at.row,
      hp: grenadiere.hitPoints,
      movesLeft: withBonus(grenadiere, faction, 'movement') ?? grenadiere.movement,
      fuel: null,
      order: { type: 'none' },
      cargoUnitIds: [],
      carriedBy: null,
      needsOrders: true,
    }
    state.units.push(unit)
  })
  world.neutralCities.forEach((c, i) => {
    state.cities.push({
      id: `c${config.participants.length + i + 1}`,
      name: usedNames.has(c.name) ? `${c.name} ${i + 1}` : c.name,
      ownerId: null,
      isCapital: false,
      col: c.col,
      row: c.row,
      production: null,
      damage: 0,
      knownBy: {},
      underFire: false,
    })
  })
  state.nextId = state.cities.length + state.units.length + 100
  updateKnowledge(state)
  return state
}
