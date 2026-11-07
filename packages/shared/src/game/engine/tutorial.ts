import type { MessageKey } from '../../i18n'
import { bitsFromKeys } from '../bits'
import { hexKey } from '../hex'
import type { HexCoord } from '../types'
import type { TutorialFocus, TutorialView } from '../view'
import {
  defaultRules,
  type GameState,
  type ParticipantState,
  unitType,
  type UnitState,
} from './state'
import { updateKnowledge } from './visibility'

/** AI personality of the passive tutorial opponent: it never moves, builds or gives up */
export const TUTORIAL_AI_ID = 'tutorial'
export const TUTORIAL_ENEMY_ID = 'manoever'
/** Match ids of tutorials start with this prefix (one tutorial per player) */
export const TUTORIAL_PREFIX = 'tutorial-'
export const tutorialMatchId = (playerId: string) => `${TUTORIAL_PREFIX}${playerId}`
export const isTutorialMatchId = (id: string) => id.startsWith(TUTORIAL_PREFIX)

// Hand-made map, pointy-top hexes in odd-r offset (odd rows shifted right).
// "." plains, "~" deep sea, "s" shallows, "f" forest, "h" hills, "m" mountains.
// West: home island with the capital Kesselhafen (9,5) and the neutral town Ruß (7,3);
// east across the strait: the island of the exercise command with Übungsfeste (13,5).
const MAP = [
  '~~~~~~~~~~~~~~~~~~',
  '~~~..f.~~~~~~~~~~~',
  '~~.....h.s~~~~~~~~',
  '~~.f......s~~~~~~~',
  '~~..m.....s~~..h~~',
  '~~...f....s~~..f~~',
  '~~.h.....s~~~..~~~',
  '~~~.f....s~~~~.~~~',
  '~~~~...~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~',
]
const WIDTH = MAP[0]!.length
const HEIGHT = MAP.length

export const TUTORIAL_CITIES = {
  capital: { id: 'tc1', col: 9, row: 5 },
  town: { id: 'tc2', col: 7, row: 3 },
  enemy: { id: 'tc3', col: 13, row: 5 },
} as const
/** Western edge of the enemy island: own land units east of it have landed */
const ENEMY_ISLAND_COL = 12
const GARRISON_ID = 'te1'

type Done = (state: GameState, me: ParticipantState) => boolean

interface TutorialStep {
  id: string
  title: MessageKey
  text: MessageKey
  /** What the panel points at */
  focus?: TutorialFocus
  /** Fulfilled by the player's actions; steps without it are confirmed with „Weiter“ */
  done?: Done
}

const own = (state: GameState, me: ParticipantState) =>
  state.units.filter((u) => u.ownerId === me.id)
const isLand = (u: UnitState) => unitType(u.unitTypeId).domain === 'land'
const ownsCity = (state: GameState, me: ParticipantState, id: string) =>
  state.cities.some((c) => c.id === id && c.ownerId === me.id)

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'tutorial.welcome.title',
    text: 'tutorial.welcome.text',
  },
  {
    id: 'camera',
    title: 'tutorial.camera.title',
    text: 'tutorial.camera.text',
    focus: { ui: 'minimap' },
  },
  {
    id: 'move',
    title: 'tutorial.move.title',
    text: 'tutorial.move.text',
    focus: { hex: TUTORIAL_CITIES.capital },
    done: (state, me) => state.log.some((l) => l.participantId === me.id && l.action === 'move'),
  },
  {
    id: 'town',
    title: 'tutorial.town.title',
    text: 'tutorial.town.text',
    focus: { hex: TUTORIAL_CITIES.town },
    done: (state, me) => ownsCity(state, me, TUTORIAL_CITIES.town.id),
  },
  {
    id: 'production',
    title: 'tutorial.production.title',
    text: 'tutorial.production.text',
    focus: { hex: TUTORIAL_CITIES.town },
    done: (state) =>
      state.cities.some((c) => c.id === TUTORIAL_CITIES.town.id && c.production !== null),
  },
  {
    id: 'endTurn',
    title: 'tutorial.endTurn.title',
    text: 'tutorial.endTurn.text',
    focus: { ui: 'endTurn' },
    done: (_state, me) => me.lastTurnEndSeq > 0,
  },
  {
    id: 'report',
    title: 'tutorial.report.title',
    text: 'tutorial.report.text',
  },
  {
    id: 'scout',
    title: 'tutorial.scout.title',
    text: 'tutorial.scout.text',
    done: (state, me) =>
      state.cities.some((c) => c.id === TUTORIAL_CITIES.enemy.id && me.id in c.knownBy),
  },
  {
    id: 'board',
    title: 'tutorial.board.title',
    text: 'tutorial.board.text',
    focus: { hex: { col: 10, row: 5 } },
    done: (state, me) => own(state, me).some((u) => isLand(u) && u.carriedBy !== null),
  },
  {
    id: 'land',
    title: 'tutorial.land.title',
    text: 'tutorial.land.text',
    focus: { hex: { col: 12, row: 5 } },
    done: (state, me) =>
      own(state, me).some((u) => isLand(u) && !u.carriedBy && u.col >= ENEMY_ISLAND_COL + 1),
  },
  {
    id: 'attack',
    title: 'tutorial.attack.title',
    text: 'tutorial.attack.text',
    focus: { hex: TUTORIAL_CITIES.enemy },
    done: (state) => !state.units.some((u) => u.id === GARRISON_ID),
  },
  {
    id: 'capture',
    title: 'tutorial.capture.title',
    text: 'tutorial.capture.text',
    focus: { hex: TUTORIAL_CITIES.enemy },
    done: (state, me) => state.winnerId === me.id,
  },
]

/** Move the tutorial on while the current step is fulfilled (steps only go forward) */
export function advanceTutorial(state: GameState, playerId: string) {
  const t = state.tutorial
  const me = state.participants.find((p) => p.id === playerId)
  if (!t || !me || me.isAI) return
  while (t.step < TUTORIAL_STEPS.length) {
    const done = TUTORIAL_STEPS[t.step]!.done
    if (!done || !done(state, me)) break
    t.step += 1
  }
}

/** Confirm a text step („Weiter“) or skip any step („Überspringen“) */
export function nextTutorialStep(state: GameState, playerId: string, skip: boolean) {
  const t = state.tutorial
  if (!t || t.step >= TUTORIAL_STEPS.length) return false
  if (!skip && TUTORIAL_STEPS[t.step]!.done) return false
  t.step += 1
  advanceTutorial(state, playerId)
  return true
}

export function tutorialView(state: GameState): TutorialView | null {
  const t = state.tutorial
  if (!t) return null
  const step = TUTORIAL_STEPS[t.step]
  return {
    step: t.step,
    total: TUTORIAL_STEPS.length,
    current: step
      ? {
          id: step.id,
          title: step.title,
          text: step.text,
          focus: step.focus ?? null,
          manual: !step.done,
        }
      : null,
  }
}

/** The tutorial match for one player: fixed map, passive opponent, step 0 */
export function seedTutorial(playerId: string, playerName: string): GameState {
  const terrain = MAP.join('')
  const keys = (pred: (c: HexCoord) => boolean) => {
    const out: string[] = []
    for (let row = 0; row < HEIGHT; row++)
      for (let col = 0; col < WIDTH; col++) if (pred({ col, row })) out.push(hexKey({ col, row }))
    return out
  }
  const dims = { width: WIDTH, height: HEIGHT }
  const participant = (
    id: string,
    extra: Partial<ParticipantState> & Pick<ParticipantState, 'name' | 'factionId' | 'color'>,
  ): ParticipantState => ({
    id,
    isAI: false,
    aiDifficulty: null,
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
  })
  const participants = [
    participant(playerId, {
      name: playerName,
      factionId: 'eisenbund',
      color: 'amber',
      capitalCityId: TUTORIAL_CITIES.capital.id,
      explored: bitsFromKeys(
        keys((c) => c.col <= 10),
        dims,
      ),
    }),
    participant(TUTORIAL_ENEMY_ID, {
      name: 'Manöverleitung',
      isAI: true,
      aiDifficulty: 'easy',
      aiPersonalityId: TUTORIAL_AI_ID,
      factionId: 'nordmark',
      color: 'rose',
      capitalCityId: TUTORIAL_CITIES.enemy.id,
      explored: bitsFromKeys(
        keys((c) => c.col >= ENEMY_ISLAND_COL),
        dims,
      ),
    }),
  ]

  let nextUnit = 0
  const unit = (
    unitTypeId: string,
    ownerId: string,
    at: HexCoord,
    id = `tu${++nextUnit}`,
  ): UnitState => {
    const type = unitType(unitTypeId)
    return {
      id,
      unitTypeId,
      ownerId,
      col: at.col,
      row: at.row,
      hp: type.hitPoints,
      movesLeft: type.movement,
      fuel: type.range,
      order: { type: 'none' },
      cargoUnitIds: [],
      carriedBy: null,
      needsOrders: true,
    }
  }
  const capital = TUTORIAL_CITIES.capital
  const units: UnitState[] = [
    unit('grenadiere', playerId, capital),
    unit('grenadiere', playerId, capital),
    unit('grenadiere', playerId, { col: 8, row: 4 }),
    unit('panzerwagen', playerId, { col: 8, row: 5 }),
    unit('panzerwagen', playerId, capital),
    unit('doppeldecker', playerId, capital),
    unit('frachter', playerId, { col: 10, row: 5 }),
    unit('grenadiere', TUTORIAL_ENEMY_ID, TUTORIAL_CITIES.enemy, GARRISON_ID),
  ]

  const state: GameState = {
    id: tutorialMatchId(playerId),
    // Shown in the player's language via `isTutorialMatchId` (match.tutorialName)
    name: 'Tutorial: Erste Schritte',
    mode: 'live',
    // 'capitals': taking the Übungsfeste decides the match at once, not only at the turn's end
    rules: { ...defaultRules('live'), victoryCondition: 'capitals', roundLimit: null },
    seed: 'TUTORIAL',
    winnerId: null,
    endedAt: null,
    endReason: null,
    dominance: null,
    round: 1,
    status: 'running',
    seat: 0,
    phase: 'yourTurn',
    turnDeadline: null,
    participants,
    map: { width: WIDTH, height: HEIGHT, seed: 'TUTORIAL', terrain, worldShape: 'islands' },
    cities: [
      {
        ...TUTORIAL_CITIES.capital,
        name: 'Kesselhafen',
        ownerId: playerId,
        isCapital: true,
        production: { unitTypeId: 'grenadiere', progress: 0, turnsRemaining: 4 },
        damage: 0,
        underFire: false,
        knownBy: { [playerId]: playerId },
      },
      {
        ...TUTORIAL_CITIES.town,
        name: 'Ruß',
        ownerId: null,
        isCapital: false,
        production: null,
        damage: 0,
        underFire: false,
        knownBy: { [playerId]: null },
      },
      {
        ...TUTORIAL_CITIES.enemy,
        name: 'Übungsfeste',
        ownerId: TUTORIAL_ENEMY_ID,
        isCapital: true,
        production: null,
        damage: 0,
        underFire: false,
        knownBy: { [TUTORIAL_ENEMY_ID]: TUTORIAL_ENEMY_ID },
      },
    ],
    units,
    events: [],
    log: [],
    seq: 0,
    rng: 0,
    nextId: 100,
    tutorial: { step: 0 },
  }
  updateKnowledge(state)
  return state
}
