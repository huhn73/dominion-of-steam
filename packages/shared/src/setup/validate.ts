import type { Message, MessageKey } from '../i18n'
// Prüfung eines MatchDraft auf dem Server: dieselben Regeln wie stepBlocker im Assistenten,
// dazu Form, erlaubte Werte, Freunde und Fraktionsregel
import { SEED_PATTERN } from '../game/seed'
import { AI_PERSONALITIES, SETUP_FACTIONS, SETUP_OPTIONS } from './data'
import { MAX_SEATS, MIN_SEATS, STEPS, stepBlocker } from './setup'
import type { Difficulty, MatchDraft, Seat } from './types'
import { DEFAULT_WORLD_SHAPE, isWorldShape } from '../game/worldShapes'

export const MATCH_NAME_MAX = 40

export type DraftValidation = { ok: true; draft: MatchDraft } | { ok: false; message: Message }

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard']
const LEVELS = SETUP_OPTIONS.levels.map((l) => l.id)

function parseSeat(raw: unknown): Seat | null {
  if (!isObject(raw)) return null
  switch (raw.kind) {
    case 'you':
    case 'invite':
    case 'open':
    case 'empty':
      return { kind: raw.kind }
    case 'friend':
      return typeof raw.friendId === 'string' ? { kind: 'friend', friendId: raw.friendId } : null
    case 'ai':
      return typeof raw.personalityId === 'string' &&
        DIFFICULTIES.includes(raw.difficulty as Difficulty)
        ? {
            kind: 'ai',
            personalityId: raw.personalityId,
            difficulty: raw.difficulty as Difficulty,
          }
        : null
    default:
      return null
  }
}

const fail = (key: MessageKey, params?: Message['params']): DraftValidation => ({
  ok: false,
  message: { key, params },
})

/**
 * Validate a draft sent by a client. `friendIds` are the friends of the creating player.
 * Returns the normalised draft (trimmed name and seed) or a German message.
 */
export function validateDraft(input: unknown, friendIds: Set<string>): DraftValidation {
  if (!isObject(input) || !isObject(input.map) || !Array.isArray(input.seats))
    return fail('setup.invalid.incomplete')
  const m = input.map
  const o = SETUP_OPTIONS

  if (typeof input.name !== 'string') return fail('setup.block.name')
  const name = input.name.trim()
  if (name.length > MATCH_NAME_MAX)
    return fail('setup.invalid.nameLong', { max: MATCH_NAME_MAX })

  if (input.mode !== 'live' && input.mode !== 'async') return fail('setup.invalid.mode')
  if (!o.asyncTurnLimits.some((l) => l.hours === input.asyncTurnLimitHours))
    return fail('setup.invalid.asyncLimit')
  if (!o.liveTurnLimits.some((l) => l.minutes === input.liveTurnLimitMinutes))
    return fail('setup.invalid.liveLimit')
  if (!o.victoryConditions.some((v) => v.id === input.victoryCondition))
    return fail('setup.invalid.victory')
  if (!o.roundLimits.includes(input.roundLimit as number | null))
    return fail('setup.invalid.rounds')
  if (input.victoryCondition === 'roundLimit' && input.roundLimit === null)
    return fail('setup.invalid.roundsNeeded')
  if (
    typeof input.allowDuplicateFactions !== 'boolean' ||
    typeof input.fillEmptyWithAI !== 'boolean'
  )
    return fail('setup.invalid.incomplete')

  if (!o.mapSizes.some((s) => s.id === m.size)) return fail('setup.invalid.size')
  const share = m.landShare
  if (
    typeof share !== 'number' ||
    share < o.landShare.min ||
    share > o.landShare.max ||
    (share - o.landShare.min) % o.landShare.step !== 0
  )
    return fail('setup.invalid.landShare', { min: o.landShare.min, max: o.landShare.max })
  if (!LEVELS.includes(m.neutralCities as never) || !LEVELS.includes(m.terrain as never))
    return fail('setup.invalid.mapSetting')
  // Older drafts have no world shape yet: they are continents
  const worldShape = m.worldShape ?? DEFAULT_WORLD_SHAPE
  if (!isWorldShape(worldShape)) return fail('setup.invalid.mapSetting')
  if (typeof m.seed !== 'string') return fail('setup.block.seed')
  const seed = m.seed.trim()
  if (seed && !SEED_PATTERN.test(seed))
    return fail('setup.invalid.seedChars')

  const seats = input.seats.map(parseSeat)
  if (seats.some((s) => s === null)) return fail('setup.invalid.seat')
  if (seats.length < MIN_SEATS || seats.length > MAX_SEATS)
    return fail('setup.invalid.seatCount', { min: MIN_SEATS, max: MAX_SEATS })
  if (seats[0]!.kind !== 'you' || seats.slice(1).some((s) => s!.kind === 'you'))
    return fail('setup.invalid.firstSeat')

  const factionId = input.factionId
  if (factionId !== null && !SETUP_FACTIONS.some((f) => f.id === factionId))
    return fail('setup.invalid.faction')

  const draft: MatchDraft = {
    name,
    mode: input.mode,
    asyncTurnLimitHours: input.asyncTurnLimitHours as number,
    liveTurnLimitMinutes: input.liveTurnLimitMinutes as number | null,
    victoryCondition: input.victoryCondition as MatchDraft['victoryCondition'],
    roundLimit: input.roundLimit as number,
    allowDuplicateFactions: input.allowDuplicateFactions,
    seats: seats as Seat[],
    fillEmptyWithAI: input.fillEmptyWithAI,
    map: {
      size: m.size as MatchDraft['map']['size'],
      worldShape,
      landShare: share,
      neutralCities: m.neutralCities as MatchDraft['map']['neutralCities'],
      terrain: m.terrain as MatchDraft['map']['terrain'],
      seed,
    },
    factionId: factionId as string | null,
  }

  // Dieselben Blocker wie im Assistenten, Schritt für Schritt
  for (let step = 0; step < STEPS.length; step++) {
    const blocker = stepBlocker(step, draft, AI_PERSONALITIES)
    if (blocker) return fail(blocker.key, blocker.params)
  }

  const friendSeats = draft.seats.flatMap((s) => (s.kind === 'friend' ? [s.friendId] : []))
  if (friendSeats.some((id) => !friendIds.has(id)))
    return fail('setup.invalid.friendsOnly')
  if (new Set(friendSeats).size !== friendSeats.length)
    return fail('setup.invalid.friendTwice')

  const aiIds = draft.seats.flatMap((s) => (s.kind === 'ai' ? [s.personalityId] : []))
  if (aiIds.some((id) => !AI_PERSONALITIES.some((p) => p.id === id)))
    return fail('setup.invalid.ai')
  if (new Set(aiIds).size !== aiIds.length)
    return fail('setup.invalid.aiTwice')

  if (!draft.allowDuplicateFactions && draft.seats.length > SETUP_FACTIONS.length)
    return fail('setup.invalid.tooManyNoDuplicates', { max: SETUP_FACTIONS.length })

  return { ok: true, draft }
}
