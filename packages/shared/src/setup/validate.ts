// Prüfung eines MatchDraft auf dem Server: dieselben Regeln wie stepBlocker im Assistenten,
// dazu Form, erlaubte Werte, Freunde und Fraktionsregel
import { SEED_PATTERN } from '../game/seed'
import { AI_PERSONALITIES, SETUP_FACTIONS, SETUP_OPTIONS } from './data'
import { MAX_SEATS, MIN_SEATS, STEPS, stepBlocker } from './setup'
import type { Difficulty, MatchDraft, Seat } from './types'
import { DEFAULT_WORLD_SHAPE, isWorldShape } from '../game/worldShapes'

export const MATCH_NAME_MAX = 40

export type DraftValidation = { ok: true; draft: MatchDraft } | { ok: false; message: string }

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

const fail = (message: string): DraftValidation => ({ ok: false, message })

/**
 * Validate a draft sent by a client. `friendIds` are the friends of the creating player.
 * Returns the normalised draft (trimmed name and seed) or a German message.
 */
export function validateDraft(input: unknown, friendIds: Set<string>): DraftValidation {
  if (!isObject(input) || !isObject(input.map) || !Array.isArray(input.seats))
    return fail('Die Angaben zur Partie sind unvollständig.')
  const m = input.map
  const o = SETUP_OPTIONS

  if (typeof input.name !== 'string') return fail('Gib der Partie einen Namen.')
  const name = input.name.trim()
  if (name.length > MATCH_NAME_MAX)
    return fail(`Der Name darf höchstens ${MATCH_NAME_MAX} Zeichen lang sein.`)

  if (input.mode !== 'live' && input.mode !== 'async') return fail('Wähle einen Modus.')
  if (!o.asyncTurnLimits.some((l) => l.hours === input.asyncTurnLimitHours))
    return fail('Diese Frist pro Zug gibt es nicht.')
  if (!o.liveTurnLimits.some((l) => l.minutes === input.liveTurnLimitMinutes))
    return fail('Dieses Zeitlimit pro Zug gibt es nicht.')
  if (!o.victoryConditions.some((v) => v.id === input.victoryCondition))
    return fail('Diese Siegbedingung gibt es nicht.')
  if (!o.roundLimits.includes(input.roundLimit as number | null))
    return fail('Diese Rundenzahl gibt es nicht.')
  if (input.victoryCondition === 'roundLimit' && input.roundLimit === null)
    return fail('Mit der Siegbedingung Rundenlimit brauchst du eine Rundenzahl.')
  if (
    typeof input.allowDuplicateFactions !== 'boolean' ||
    typeof input.fillEmptyWithAI !== 'boolean'
  )
    return fail('Die Angaben zur Partie sind unvollständig.')

  if (!o.mapSizes.some((s) => s.id === m.size)) return fail('Diese Kartengröße gibt es nicht.')
  const share = m.landShare
  if (
    typeof share !== 'number' ||
    share < o.landShare.min ||
    share > o.landShare.max ||
    (share - o.landShare.min) % o.landShare.step !== 0
  )
    return fail(`Der Landanteil muss zwischen ${o.landShare.min} und ${o.landShare.max} % liegen.`)
  if (!LEVELS.includes(m.neutralCities as never) || !LEVELS.includes(m.terrain as never))
    return fail('Diese Karteneinstellung gibt es nicht.')
  // Older drafts have no world shape yet: they are continents
  const worldShape = m.worldShape ?? DEFAULT_WORLD_SHAPE
  if (!isWorldShape(worldShape)) return fail('Diese Karteneinstellung gibt es nicht.')
  if (typeof m.seed !== 'string') return fail('Gib einen Kartencode ein oder würfle einen neuen.')
  const seed = m.seed.trim()
  if (seed && !SEED_PATTERN.test(seed))
    return fail('Der Kartencode darf nur A–Z, 0–9 und „-“ enthalten (höchstens 16 Zeichen).')

  const seats = input.seats.map(parseSeat)
  if (seats.some((s) => s === null)) return fail('Ein Platz ist ungültig.')
  if (seats.length < MIN_SEATS || seats.length > MAX_SEATS)
    return fail(`Eine Partie hat ${MIN_SEATS} bis ${MAX_SEATS} Plätze.`)
  if (seats[0]!.kind !== 'you' || seats.slice(1).some((s) => s!.kind === 'you'))
    return fail('Platz 1 gehört dir.')

  const factionId = input.factionId
  if (factionId !== null && !SETUP_FACTIONS.some((f) => f.id === factionId))
    return fail('Diese Fraktion gibt es nicht.')

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
    if (blocker) return fail(blocker)
  }

  const friendSeats = draft.seats.flatMap((s) => (s.kind === 'friend' ? [s.friendId] : []))
  if (friendSeats.some((id) => !friendIds.has(id)))
    return fail('Du kannst nur Spieler aus deiner Freundesliste einladen.')
  if (new Set(friendSeats).size !== friendSeats.length)
    return fail('Jeden Freund kannst du nur einmal einladen.')

  const aiIds = draft.seats.flatMap((s) => (s.kind === 'ai' ? [s.personalityId] : []))
  if (aiIds.some((id) => !AI_PERSONALITIES.some((p) => p.id === id)))
    return fail('Diese KI-Persönlichkeit gibt es nicht.')
  if (new Set(aiIds).size !== aiIds.length)
    return fail('Jede KI-Persönlichkeit kann nur einen Platz besetzen.')

  if (!draft.allowDuplicateFactions && draft.seats.length > SETUP_FACTIONS.length)
    return fail(
      `Ohne doppelte Fraktionen sind höchstens ${SETUP_FACTIONS.length} Plätze möglich. Entferne Plätze oder erlaube doppelte Fraktionen.`,
    )

  return { ok: true, draft }
}
