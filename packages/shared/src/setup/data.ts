// Stammdaten des Partie-Setups (product-plan/sections/partie-setup-and-ki-gegner/sample-data.json)
import { MAP_SIZE_OPTIONS } from '../game/mapSizes'
import { WORLD_SHAPES } from '../game/worldShapes'
import { COMPENDIUM_FACTIONS } from '../compendium'
import { randomSeed } from '../game/seed'
import type { AiPersonality, Faction, MatchDraft, SetupOptions } from './types'
import type { Message } from '../i18n'

/** KI-Persönlichkeiten; jede führt immer dieselbe Fraktion. Porträts laut art-brief.md */
export const AI_PERSONALITIES: AiPersonality[] = [
  {
    id: 'kessler',
    name: 'Admiral Kessler',
    title: 'setup.ai.kessler.title',
    factionId: 'aurelia',
    portraitUrl: '/art/portraits/kessler.webp',
    style: ['Aggressiv', 'Seekrieg'],
    description: 'setup.ai.kessler.description',
  },
  {
    id: 'varenne',
    name: 'Senatorin Varenne',
    title: 'setup.ai.varenne.title',
    factionId: 'aurelia',
    portraitUrl: '/art/portraits/varenne.webp',
    style: ['Expansiv', 'Wirtschaft'],
    description: 'setup.ai.varenne.description',
  },
  {
    id: 'brandt',
    name: 'Zechenmeister Brandt',
    title: 'setup.ai.brandt.title',
    factionId: 'eisenbund',
    portraitUrl: '/art/portraits/brandt.webp',
    style: ['Defensiv', 'Landkrieg'],
    description: 'setup.ai.brandt.description',
  },
  {
    id: 'eisenhart',
    name: 'Generalin Eisenhart',
    title: 'setup.ai.eisenhart.title',
    factionId: 'eisenbund',
    portraitUrl: '/art/portraits/eisenhart.webp',
    style: ['Offensiv', 'Landkrieg'],
    description: 'setup.ai.eisenhart.description',
  },
  {
    id: 'halvorsen',
    name: 'Kapitänin Halvorsen',
    title: 'setup.ai.halvorsen.title',
    factionId: 'nordmark',
    portraitUrl: '/art/portraits/halvorsen.webp',
    style: ['Aufklärung', 'Luftkrieg'],
    description: 'setup.ai.halvorsen.description',
  },
  {
    id: 'lindqvist',
    name: 'Ingenieur Lindqvist',
    title: 'setup.ai.lindqvist.title',
    factionId: 'nordmark',
    portraitUrl: '/art/portraits/lindqvist.webp',
    style: [],
    description: 'setup.ai.lindqvist.description',
  },
  {
    id: 'ostrow',
    name: 'Graf Ostrow',
    title: 'setup.ai.ostrow.title',
    factionId: 'salzkueste',
    portraitUrl: '/art/portraits/ostrow.webp',
    style: ['Defensiv', 'Befestigung'],
    description: 'setup.ai.ostrow.description',
  },
]

export const aiPersonality = (id: string | null | undefined) =>
  AI_PERSONALITIES.find((p) => p.id === id)

/** Spielbare Fraktionen in der Form des Assistenten, aus den Stammdaten des Kompendiums */
export const SETUP_FACTIONS: Faction[] = COMPENDIUM_FACTIONS.map((f) => ({
  id: f.id,
  name: f.name,
  shortName: f.shortName,
  color: f.color,
  motto: f.motto,
  trait: f.trait,
  emblemUrl: f.emblemUrl,
  heroImageUrl: f.heroImageUrl,
}))

/** Wählbare Werte des Assistenten */
export const SETUP_OPTIONS: SetupOptions = {
  mapSizes: MAP_SIZE_OPTIONS,
  landShare: { min: 20, max: 70, step: 5, minLabel: 'setup.land.min', maxLabel: 'setup.land.max' },
  worldShapes: WORLD_SHAPES,
  levels: [
    { id: 'low', label: 'setup.level.low' },
    { id: 'normal', label: 'setup.level.normal' },
    { id: 'high', label: 'setup.level.high' },
  ],
  asyncTurnLimits: [12, 24, 48].map((hours) => ({
    hours,
    label: { key: 'setup.hours', params: { count: hours } },
  })),
  liveTurnLimits: [
    { minutes: null, label: { key: 'setup.off' } },
    { minutes: 2, label: { key: 'setup.minutes', params: { count: 2 } } },
    { minutes: 5, label: { key: 'setup.minutes', params: { count: 5 } } },
  ],
  victoryConditions: (['elimination', 'capitals', 'dominance', 'roundLimit'] as const).map(
    (id) => ({
      id,
      label: `setup.victory.${id}.label` as const,
      description: `setup.victory.${id}.description` as const,
    }),
  ),
  roundLimits: [50, 100, 150, 250, 500, null],
}

export const roundLimitLabel = (n: number | null): Message =>
  n === null ? { key: 'setup.noRoundLimit' } : { key: 'setup.rounds', params: { count: n } }

/** Vorschläge für den Namen einer neuen Partie */
export const MATCH_NAME_SUGGESTIONS = [
  'Die Kohleinseln',
  'Sturm auf Nordhavn',
  'Salz und Schwefel',
  'Nordwind',
  'Inselhüpfen',
  'Messingküste',
  'Rauch über Valdrin',
  'Die Nietenbucht',
]

/** Regeln und Karte des Startentwurfs, die aus einer früheren Partie übernommen werden können */
export type DraftPreset = Omit<MatchDraft, 'name' | 'seats' | 'factionId' | 'map'> & {
  map: Omit<MatchDraft['map'], 'seed'>
}

export const DEFAULT_PRESET: DraftPreset = {
  mode: 'async',
  asyncTurnLimitHours: 24,
  liveTurnLimitMinutes: null,
  victoryCondition: 'capitals',
  roundLimit: 150,
  allowDuplicateFactions: false,
  fillEmptyWithAI: true,
  map: {
    size: 'medium',
    worldShape: 'continent',
    landShare: 35,
    neutralCities: 'normal',
    terrain: 'normal',
  },
}

/** Startentwurf: noch keine Fraktion, neben dem eigenen ein freier Platz, neuer Kartencode */
export function defaultDraft(
  preset: DraftPreset = DEFAULT_PRESET,
  { name, seed }: { name?: string; seed?: string } = {},
): MatchDraft {
  return {
    ...preset,
    name:
      name ?? MATCH_NAME_SUGGESTIONS[Math.floor(Math.random() * MATCH_NAME_SUGGESTIONS.length)]!,
    seats: [{ kind: 'you' }, { kind: 'empty' }],
    map: { ...preset.map, seed: seed ?? randomSeed() },
    factionId: null,
  }
}

export const turnLimitLabel = (rules: {
  mode: 'live' | 'async'
  asyncTurnLimitHours: number
  liveTurnLimitMinutes: number | null
}): Message =>
  rules.mode === 'async'
    ? { key: 'setup.hours', params: { count: rules.asyncTurnLimitHours } }
    : rules.liveTurnLimitMinutes
      ? { key: 'setup.minutes', params: { count: rules.liveTurnLimitMinutes } }
      : { key: 'setup.noTimeLimit' }

export const victoryConditionLabel = (rules: {
  victoryCondition: MatchDraft['victoryCondition']
  roundLimit: number | null
}): Message =>
  rules.victoryCondition === 'roundLimit'
    ? { key: 'setup.victoryWithRounds', params: { count: rules.roundLimit ?? 0 } }
    : { key: `setup.victory.${rules.victoryCondition}.label` }
