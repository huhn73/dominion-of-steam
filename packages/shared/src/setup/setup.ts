import type { Message, MessageKey } from '../i18n'
import type {
  AiPersonality,
  FactionColor,
  MapSizeId,
  MatchDraft,
  MapSizeOption,
  Seat,
  SetupOptions,
  VictoryConditionId,
} from './types'
import type { WorldShape } from '../game/worldShapes'
import { DEFAULT_PRESET } from './data'

// Typography: Big Shoulders Display (headings), Barlow (body), IBM Plex Mono (codes, numbers)

export const STEPS = [
  'setup.step.rules',
  'setup.step.faction',
  'setup.step.players',
  'setup.step.map',
  'setup.step.summary',
] as const satisfies readonly MessageKey[]

/** Step indices, so the order lives in one place */
export const STEP = { rules: 0, faction: 1, players: 2, map: 3, summary: 4 } as const

export const FACTION_HEX: Record<FactionColor, { base: string; deep: string }> = {
  amber: { base: '#f59e0b', deep: '#78350f' },
  rose: { base: '#f43f5e', deep: '#881337' },
  sky: { base: '#0ea5e9', deep: '#0c4a6e' },
  lime: { base: '#84cc16', deep: '#365314' },
  violet: { base: '#8b5cf6', deep: '#4c1d95' },
  orange: { base: '#f97316', deep: '#7c2d12' },
}

export const DIFFICULTY_LABEL = {
  easy: 'common.difficulty.easy',
  normal: 'common.difficulty.normal',
  hard: 'common.difficulty.hard',
} as const satisfies Record<string, MessageKey>

export const MIN_SEATS = 2
export const MAX_SEATS = 6

export function resizeSeats(seats: Seat[], count: number): Seat[] {
  if (count < seats.length) return seats.slice(0, count)
  return [...seats, ...Array.from({ length: count - seats.length }, () => ({ kind: 'empty' }) as Seat)]
}

/** Factions taken by AI seats, keyed by faction id */
export function aiFactions(seats: Seat[], personalities: AiPersonality[]) {
  const taken = new Map<string, AiPersonality>()
  for (const s of seats) {
    if (s.kind !== 'ai') continue
    const p = personalities.find((x) => x.id === s.personalityId)
    if (p) taken.set(p.factionId, p)
  }
  return taken
}

/** Why the player can't leave a step yet, or null */
export function stepBlocker(step: number, draft: MatchDraft, personalities: AiPersonality[]): Message | null {
  if (step === STEP.rules && !draft.name.trim()) return { key: 'setup.block.name' }
  if (step === STEP.faction && !draft.factionId) return { key: 'setup.block.faction' }
  if (step === STEP.map && !draft.map.seed.trim()) return { key: 'setup.block.seed' }
  if (step === STEP.players) {
    if (!draft.fillEmptyWithAI && draft.seats.some((s) => s.kind === 'empty'))
      return { key: 'setup.block.seats' }
    if (!draft.allowDuplicateFactions) {
      const factions = draft.seats.flatMap((s) =>
        s.kind === 'ai' ? [personalities.find((p) => p.id === s.personalityId)?.factionId] : [],
      )
      if (new Set(factions).size !== factions.length) return { key: 'setup.block.aiSameFaction' }
      if (draft.factionId && factions.includes(draft.factionId))
        return { key: 'setup.block.aiYourFaction' }
    }
  }
  return null
}

export function summaryWarnings(draft: MatchDraft, size: MapSizeOption | undefined): Message[] {
  const warnings: Message[] = []
  const [, maxPlayers] = size?.recommendedPlayers ?? [2, 6]
  if (size && draft.seats.length > maxPlayers)
    warnings.push({
      key: 'setup.warn.tooMany',
      params: { count: draft.seats.length, size: { key: size.label }, max: maxPlayers },
    })
  const pending = draft.seats.filter((s) => s.kind === 'invite' || s.kind === 'open' || s.kind === 'friend').length
  if (pending > 0 && !draft.fillEmptyWithAI)
    warnings.push({ key: 'setup.warn.waits' })
  if (draft.mode === 'live' && pending > 0)
    warnings.push({ key: 'setup.warn.live' })
  if (draft.seats.every((s) => s.kind === 'you' || s.kind === 'ai' || (s.kind === 'empty' && draft.fillEmptyWithAI)) && draft.seats.length > 1)
    warnings.push({ key: 'setup.warn.solo' })
  return warnings
}

export function randomSeed() {
  const words = ['KOHLE', 'NIETE', 'KESSEL', 'DAMPF', 'ZECHE', 'HAFEN', 'SCHLOT', 'MESSING']
  return `${words[Math.floor(Math.random() * words.length)]}-${Math.floor(1000 + Math.random() * 9000)}`
}

/** Round limit the setup suggests for a map size */
export function roundLimitForSize(options: SetupOptions, sizeId: MapSizeId): number {
  return options.mapSizes.find((s) => s.id === sizeId)?.defaultRoundLimit ?? 100
}

/**
 * Round limit after the player picks another map size: the new size's suggestion, unless the
 * player had changed the limit away from the old size's suggestion.
 */
export function roundLimitAfterSizeChange(
  draft: Pick<MatchDraft, 'roundLimit' | 'map'>,
  options: SetupOptions,
  nextSizeId: MapSizeId,
): number | null {
  const untouched = draft.roundLimit === roundLimitForSize(options, draft.map.size)
  return untouched ? roundLimitForSize(options, nextSizeId) : draft.roundLimit
}

/** Island worlds rarely end by elimination: the wizard suggests „Vorherrschaft“ for them */
const SUGGESTED_FOR_ISLANDS: VictoryConditionId = 'dominance'
const isIslandWorld = (shape: WorldShape | undefined) =>
  shape === 'islands' || shape === 'archipelago'

/**
 * Victory condition after the player picks another world shape: switching to an island world
 * suggests „Vorherrschaft“ while the condition is still the default; back to the continent, a
 * suggested „Vorherrschaft“ returns to the default. A condition the player chose stays.
 */
export function victoryConditionAfterShapeChange(
  draft: Pick<MatchDraft, 'victoryCondition' | 'map'>,
  nextShape: WorldShape,
): VictoryConditionId {
  const fallback = DEFAULT_PRESET.victoryCondition
  const wasIslands = isIslandWorld(draft.map.worldShape)
  const toIslands = isIslandWorld(nextShape)
  if (toIslands && !wasIslands && draft.victoryCondition === fallback) return SUGGESTED_FOR_ISLANDS
  if (!toIslands && wasIslands && draft.victoryCondition === SUGGESTED_FOR_ISLANDS) return fallback
  return draft.victoryCondition
}
