// Stammdaten des Partie-Setups (product-plan/sections/partie-setup-and-ki-gegner/sample-data.json)
import { MAP_SIZE_OPTIONS } from '../game/mapSizes'
import { WORLD_SHAPES } from '../game/worldShapes'
import { COMPENDIUM_FACTIONS } from '../compendium'
import { randomSeed } from '../game/seed'
import type { AiPersonality, Faction, MatchDraft, SetupOptions } from './types'

/** KI-Persönlichkeiten; jede führt immer dieselbe Fraktion. Porträts laut art-brief.md */
export const AI_PERSONALITIES: AiPersonality[] = [
  {
    id: 'kessler',
    name: 'Admiral Kessler',
    title: 'Großadmiral der Republik',
    factionId: 'aurelia',
    portraitUrl: '/art/portraits/kessler.webp',
    style: ['Aggressiv', 'Seekrieg'],
    description: 'Sucht früh die Entscheidungsschlacht auf See und blockiert gegnerische Küsten.',
  },
  {
    id: 'varenne',
    name: 'Senatorin Varenne',
    title: 'Handelsministerin',
    factionId: 'aurelia',
    portraitUrl: '/art/portraits/varenne.webp',
    style: ['Expansiv', 'Wirtschaft'],
    description:
      'Besetzt neutrale Inseln schneller als alle anderen und meidet offene Kriege, solange sie wächst.',
  },
  {
    id: 'brandt',
    name: 'Zechenmeister Brandt',
    title: 'Vorsitzender des Hammerhauses',
    factionId: 'eisenbund',
    portraitUrl: '/art/portraits/brandt.webp',
    style: ['Defensiv', 'Landkrieg'],
    description:
      'Baut seine Städte zu Festungen aus und rückt erst vor, wenn genug Dampfkolosse bereitstehen. Wer ihn zu früh angreift, beißt sich an seinen Mauern die Zähne aus; wer ihn zu lange gewähren lässt, sieht sich einer Walze aus Stahl gegenüber, die Stadt um Stadt einnimmt.',
  },
  {
    id: 'eisenhart',
    name: 'Generalin Eisenhart',
    title: 'Oberbefehlshaberin der Zechengarde',
    factionId: 'eisenbund',
    portraitUrl: '/art/portraits/eisenhart.webp',
    style: ['Offensiv', 'Landkrieg'],
    description:
      'Setzt auf schnelle Panzerwagen-Vorstöße und greift schwach verteidigte Städte sofort an.',
  },
  {
    id: 'halvorsen',
    name: 'Kapitänin Halvorsen',
    title: 'Flottenkapitänin der Wolkenflotte',
    factionId: 'nordmark',
    portraitUrl: '/art/portraits/halvorsen.webp',
    style: ['Aufklärung', 'Luftkrieg'],
    description:
      'Kennt die Karte früher als alle anderen und schlägt dort zu, wo die Verteidigung dünn ist.',
  },
  {
    id: 'lindqvist',
    name: 'Ingenieur Lindqvist',
    title: 'Werftmeister von Nordhavn',
    factionId: 'nordmark',
    portraitUrl: '/art/portraits/lindqvist.webp',
    style: [],
    description: 'Spielt abwartend und reagiert auf Bedrohungen.',
  },
  {
    id: 'ostrow',
    name: 'Graf Ostrow',
    title: 'Festungskommandant von Salzwacht',
    factionId: 'salzkueste',
    portraitUrl: '/art/portraits/ostrow.webp',
    style: ['Defensiv', 'Befestigung'],
    description: 'Hält, was er hat, und verteidigt seine Küsten bis zum letzten Mann.',
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
  landShare: { min: 20, max: 70, step: 5, minLabel: 'Wenig Land', maxLabel: 'Viel Land' },
  worldShapes: WORLD_SHAPES,
  levels: [
    { id: 'low', label: 'Wenig' },
    { id: 'normal', label: 'Normal' },
    { id: 'high', label: 'Viel' },
  ],
  asyncTurnLimits: [
    { hours: 12, label: '12 Stunden' },
    { hours: 24, label: '24 Stunden' },
    { hours: 48, label: '48 Stunden' },
  ],
  liveTurnLimits: [
    { minutes: null, label: 'Aus' },
    { minutes: 2, label: '2 Minuten' },
    { minutes: 5, label: '5 Minuten' },
  ],
  victoryConditions: [
    {
      id: 'elimination',
      label: 'Alle Gegner besiegen',
      description: 'Gewonnen hat, wer als Letzter noch Städte besitzt.',
    },
    {
      id: 'capitals',
      label: 'Hauptstädte erobern',
      description: 'Gewonnen hat, wer alle gegnerischen Hauptstädte hält.',
    },
    {
      id: 'dominance',
      label: 'Vorherrschaft',
      description:
        'Gewonnen hat, wer fünf eigene Runden in Folge die Mehrheit aller Städte hält: 60 % auf dem Kontinent, 50 % auf Inseln und Archipel. Passt zu Inselwelten, wo kaum jemand ganz ausgeschaltet wird.',
    },
    {
      id: 'roundLimit',
      label: 'Rundenlimit',
      description:
        'Nach der letzten Runde gewinnt, wer die meisten Punkte für Städte und Einheiten hat.',
    },
  ],
  roundLimits: [50, 100, 150, 250, 500, null],
}

export const roundLimitLabel = (n: number | null) => (n === null ? 'Ohne Limit' : `${n} Runden`)

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
}) =>
  rules.mode === 'async'
    ? `${rules.asyncTurnLimitHours} Stunden`
    : rules.liveTurnLimitMinutes
      ? `${rules.liveTurnLimitMinutes} Minuten`
      : 'Ohne Zeitlimit'

export const victoryConditionLabel = (rules: {
  victoryCondition: MatchDraft['victoryCondition']
  roundLimit: number | null
}) => {
  const label =
    SETUP_OPTIONS.victoryConditions.find((v) => v.id === rules.victoryCondition)?.label ?? ''
  return rules.victoryCondition === 'roundLimit' ? `${label} · ${rules.roundLimit} Runden` : label
}
