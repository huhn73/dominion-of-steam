import { LocalizedError, type Text } from '../locale'
import { translate, type Locale } from '@dos/shared/i18n'
import { isWorldShape, mapSize } from '@dos/shared/game'
import { randomBytes, randomUUID } from 'node:crypto'
import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm'
import {
  createMatch,
  type GameRules,
  type GameState,
  generateWorld,
  type MapSettings as EngineMapSettings,
  type NewParticipant,
} from '@dos/shared/engine'
import type { ParticipantColor } from '@dos/shared/game'
import {
  AI_PERSONALITIES,
  aiPersonality,
  type AiPersonality,
  DEFAULT_PRESET,
  defaultDraft,
  type DraftPreset,
  type MapSettings,
  type MatchDraft,
  SETUP_FACTIONS,
  SETUP_OPTIONS,
  type SetupData,
  validateDraft,
} from '@dos/shared/setup'
import type { AccountService } from '../auth/accounts'
import type { Db } from '../db/client'
import {
  invitations,
  matches,
  type MatchSetup,
  matchSeats,
  players,
  setupReservations,
} from '../db/schema'
import { columns, type Tx, writeRunningSeats } from '../matches/repository'
import type { Notifier } from '../notifications/service'
import { signal } from '../realtime/signals'

/** German message for the client, sent as 422 (or `status`) with `code` */
export class SetupError extends LocalizedError {
  constructor(code: string, text: Text, status = 422) {
    super(status, code, text)
  }
}

const COLORS: ParticipantColor[] = ['amber', 'rose', 'sky', 'lime', 'violet', 'orange']
/** Without ambiguous characters (0/O, 1/I/L) */
const TOKEN_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

/** Invite token like "K7Q-2XM-H9P" */
export function inviteToken() {
  const bytes = randomBytes(9)
  const chars = [...bytes].map((b) => TOKEN_ALPHABET[b % TOKEN_ALPHABET.length]!)
  return [0, 3, 6].map((i) => chars.slice(i, i + 3).join('')).join('-')
}

export const newMatchId = () => `m-${randomBytes(6).toString('hex')}`

export const inviteLink = (origin: string, token: string) => `${origin}/einladung/${token}`

export function rulesOf(draft: MatchDraft): GameRules {
  return {
    mode: draft.mode,
    asyncTurnLimitHours: draft.asyncTurnLimitHours,
    liveTurnLimitMinutes: draft.liveTurnLimitMinutes,
    victoryCondition: draft.victoryCondition,
    roundLimit: draft.roundLimit,
    allowDuplicateFactions: draft.allowDuplicateFactions,
  }
}

/** Map settings of the wizard → settings of the map generator */
export function engineMap(map: MapSettings): EngineMapSettings {
  const size = mapSize(map.size)!
  return {
    width: size.width,
    height: size.height,
    landShare: map.landShare,
    neutralCities: map.neutralCities,
    terrain: map.terrain,
    seed: map.seed,
    worldShape: map.worldShape ?? 'continent',
  }
}

type SeatRow = typeof matchSeats.$inferSelect

/**
 * Pick an AI personality for a free seat: not yet in the match and, without duplicate factions,
 * with a faction nobody has. Prefers factions not in the match yet, for variety.
 */
export function pickPersonality(
  usedPersonalities: Set<string>,
  usedFactions: Set<string>,
  allowDuplicateFactions: boolean,
  random = Math.random,
): AiPersonality | null {
  const free = AI_PERSONALITIES.filter((p) => !usedPersonalities.has(p.id))
  const fresh = free.filter((p) => !usedFactions.has(p.factionId))
  const pool = fresh.length ? fresh : allowDuplicateFactions ? free : []
  return pool[Math.floor(random() * pool.length)] ?? null
}

/**
 * Turn the seats of a match into the participants of a new game. Seats without a player or AI
 * (invited friends who have not joined, link, open and empty seats) become AI opponents of
 * difficulty "Normal" when `fill` is set; otherwise the start fails. Milestone 05 calls this when
 * the host starts a waiting match.
 */
export function participantsFor(
  seats: SeatRow[],
  names: Map<string, string>,
  rules: GameRules,
  fill: boolean,
): { participants: NewParticipant[]; seats: SeatRow[] } {
  const usedPersonalities = new Set(
    seats.flatMap((s) => (s.aiPersonalityId ? [s.aiPersonalityId] : [])),
  )
  const usedFactions = new Set(
    seats.flatMap((s) =>
      (s.kind === 'player' || s.kind === 'ai') && s.factionId ? [s.factionId] : [],
    ),
  )
  const usedColors = new Set<ParticipantColor>()
  let aiCount = 0
  const colorFor = (factionId: string) => {
    const own = SETUP_FACTIONS.find((f) => f.id === factionId)?.color
    const color = own && !usedColors.has(own) ? own : COLORS.find((c) => !usedColors.has(c))!
    usedColors.add(color)
    return color
  }

  const result: NewParticipant[] = []
  const finalSeats: SeatRow[] = []
  for (const seat of [...seats].sort((a, b) => a.seat - b.seat)) {
    if (seat.kind === 'player' && seat.playerId) {
      // A player who has not chosen a faction yet gets a free one
      const factionId =
        seat.factionId ??
        SETUP_FACTIONS.find((f) => !usedFactions.has(f.id))?.id ??
        SETUP_FACTIONS[0]!.id
      usedFactions.add(factionId)
      result.push({
        id: seat.playerId,
        name: names.get(seat.playerId) ?? 'Unbekannt',
        factionId,
        color: colorFor(factionId),
        isAI: false,
        aiDifficulty: null,
        aiPersonalityId: null,
      })
      finalSeats.push({ ...seat, factionId, participantId: seat.playerId, ready: true })
      continue
    }
    let personality = seat.kind === 'ai' ? aiPersonality(seat.aiPersonalityId) : undefined
    let difficulty = seat.kind === 'ai' ? (seat.aiDifficulty ?? 'normal') : 'normal'
    if (!personality) {
      if (!fill) throw new SetupError('SEATS_OPEN', { key: 'errors.seatsOpen' }, 409)
      personality =
        pickPersonality(usedPersonalities, usedFactions, rules.allowDuplicateFactions) ?? undefined
      if (!personality)
        throw new SetupError('NO_AI_AVAILABLE', {
          key: 'errors.noAiForSeat',
          params: { seat: seat.seat + 1 },
        })
      difficulty = 'normal'
    }
    usedPersonalities.add(personality.id)
    usedFactions.add(personality.factionId)
    aiCount += 1
    const id = `ai${aiCount}`
    result.push({
      id,
      name: personality.name,
      factionId: personality.factionId,
      color: colorFor(personality.factionId),
      isAI: true,
      aiDifficulty: difficulty,
      aiPersonalityId: personality.id,
    })
    finalSeats.push({
      ...seat,
      kind: 'ai',
      playerId: null,
      participantId: id,
      factionId: personality.factionId,
      aiPersonalityId: personality.id,
      aiDifficulty: difficulty,
      ready: true,
    })
  }
  return { participants: result, seats: finalSeats }
}

/** Start a match row inside `tx`: build the game from its seats and store state and seats */
export async function launchMatch(tx: Tx, matchId: string, now = new Date()): Promise<GameState> {
  const [row] = await tx.select().from(matches).where(eq(matches.id, matchId)).for('update')
  if (!row?.setup) throw new SetupError('MATCH_NOT_FOUND', { key: 'errors.matchNotFound' }, 404)
  if (row.status !== 'waiting')
    throw new SetupError('ALREADY_STARTED', { key: 'errors.alreadyStarted' }, 409)
  const seats = await tx.select().from(matchSeats).where(eq(matchSeats.matchId, matchId))
  const playerIds = seats.flatMap((s) => (s.kind === 'player' && s.playerId ? [s.playerId] : []))
  const names = new Map(
    playerIds.length
      ? (
          await tx
            .select({ id: players.id, name: players.displayName })
            .from(players)
            .where(inArray(players.id, playerIds))
        ).map((p) => [p.id, p.name])
      : [],
  )
  const { participants } = participantsFor(seats, names, row.setup.rules, row.setup.fillEmptyWithAI)
  let state: GameState
  try {
    state = createMatch(
      {
        id: row.id,
        name: row.name,
        rules: row.setup.rules,
        map: engineMap(row.setup.map),
        participants,
      },
      now,
    )
  } catch (err) {
    if (err instanceof Error && err.message.includes('Hauptstädte'))
      throw new SetupError('MAP_TOO_SMALL', { key: 'errors.mapTooSmall' })
    throw err
  }
  await tx
    .update(matches)
    .set({ ...columns(state), updatedAt: now })
    .where(eq(matches.id, matchId))
  await writeRunningSeats(tx, state)
  // Invitations that were not accepted are void once the match runs
  await tx
    .delete(invitations)
    .where(and(eq(invitations.matchId, matchId), eq(invitations.status, 'pending')))
  return state
}

/** A friend seat, link seat or open seat still waits for a human player */
const waitsForHuman = (draft: MatchDraft) =>
  draft.seats.some((s) => s.kind === 'friend' || s.kind === 'invite' || s.kind === 'open')

export function createSetupService(db: Db, accounts: AccountService, notifier?: Notifier) {
  /** The player's reservation (match id + invite token), created on first use */
  async function reservation(playerId: string): Promise<typeof setupReservations.$inferSelect> {
    const [existing] = await db
      .select()
      .from(setupReservations)
      .where(eq(setupReservations.playerId, playerId))
    if (existing) return existing
    const [created] = await db
      .insert(setupReservations)
      .values({ id: newMatchId(), playerId, inviteToken: inviteToken() })
      .onConflictDoNothing()
      .returning()
    // Two requests at once: the other one won
    return created ?? (await reservation(playerId))
  }

  /** Rules and map of the player's last created match, as defaults for the next one */
  async function lastPreset(playerId: string): Promise<DraftPreset> {
    const [last] = await db
      .select({ setup: matches.setup })
      .from(matches)
      .where(and(eq(matches.hostId, playerId), isNotNull(matches.setup)))
      .orderBy(desc(matches.createdAt))
      .limit(1)
    if (!last?.setup) return DEFAULT_PRESET
    const { rules, map, fillEmptyWithAI } = last.setup
    const { seed: _seed, ...mapRest } = map
    // Matches created before world shapes existed are continents
    const presetMap = { ...mapRest, worldShape: mapRest.worldShape ?? ('continent' as const) }
    return {
      mode: rules.mode,
      asyncTurnLimitHours: rules.asyncTurnLimitHours,
      liveTurnLimitMinutes: rules.liveTurnLimitMinutes,
      victoryCondition: rules.victoryCondition,
      roundLimit: rules.roundLimit,
      allowDuplicateFactions: rules.allowDuplicateFactions,
      fillEmptyWithAI,
      map: presetMap,
    }
  }

  async function getSetup(
    player: { id: string; displayName: string; avatarUrl: string | null },
    origin: string,
  ): Promise<SetupData> {
    const [res, friends, preset] = await Promise.all([
      reservation(player.id),
      accounts.listFriends(player.id),
      lastPreset(player.id),
    ])
    return {
      you: { id: player.id, name: player.displayName, avatarUrl: player.avatarUrl },
      factions: SETUP_FACTIONS,
      aiPersonalities: AI_PERSONALITIES,
      friends,
      options: SETUP_OPTIONS,
      draft: defaultDraft(preset),
      inviteLink: inviteLink(origin, res.inviteToken),
      reservationId: res.id,
    }
  }

  /**
   * Create a match from the wizard's draft. Starts at once when no seat waits for a human
   * (only AI and empty seats that are filled with AI); otherwise the match waits for players and
   * invited friends get an invitation.
   */
  async function createFromDraft(
    host: { id: string; displayName: string },
    input: unknown,
    opts: { reservationId?: string; matchId?: string } = {},
    now = new Date(),
  ) {
    const friends = await accounts.listFriends(host.id)
    const check = validateDraft(input, new Set(friends.map((f) => f.id)))
    if (!check.ok) throw new SetupError('INVALID_SETUP', check.message)
    const draft = check.draft
    const setup: MatchSetup = {
      rules: rulesOf(draft),
      map: draft.map,
      fillEmptyWithAI: draft.fillEmptyWithAI,
    }
    // Same seed and settings give the same world; check early that all capitals fit
    const world = generateWorld(engineMap(draft.map), draft.seats.length)
    if (world.capitals.length < draft.seats.length)
      throw new SetupError('MAP_TOO_SMALL', { key: 'errors.mapTooSmall' })
    const start = !waitsForHuman(draft)

    return db
      .transaction(async (tx) => {
        let id = opts.matchId ?? newMatchId()
        let token = inviteToken()
        if (opts.reservationId) {
          const [res] = await tx
            .select()
            .from(setupReservations)
            .where(
              and(
                eq(setupReservations.id, opts.reservationId),
                eq(setupReservations.playerId, host.id),
              ),
            )
            .for('update')
          if (!res)
            throw new SetupError('RESERVATION_EXPIRED', { key: 'errors.reservationUsed' }, 409)
          id = res.id
          token = res.inviteToken
          await tx.delete(setupReservations).where(eq(setupReservations.id, res.id))
        }

        await tx.insert(matches).values({
          id,
          name: draft.name,
          mode: draft.mode,
          status: 'waiting',
          round: 0,
          seed: draft.map.seed,
          hostId: host.id,
          setup,
          inviteToken: token,
          createdAt: now,
          updatedAt: now,
        })
        await tx.insert(matchSeats).values(
          draft.seats.map((s, seat) => {
            const base = { matchId: id, seat }
            switch (s.kind) {
              case 'you':
                return {
                  ...base,
                  kind: 'player' as const,
                  playerId: host.id,
                  factionId: draft.factionId,
                  // The host created the match and counts as ready
                  ready: true,
                  joinedAt: now,
                }
              case 'friend':
                return { ...base, kind: 'friend' as const, playerId: s.friendId }
              case 'ai':
                return {
                  ...base,
                  kind: 'ai' as const,
                  aiPersonalityId: s.personalityId,
                  aiDifficulty: s.difficulty,
                  factionId: aiPersonality(s.personalityId)!.factionId,
                  ready: true,
                }
              default:
                return { ...base, kind: s.kind }
            }
          }),
        )
        const invited = draft.seats.flatMap((s) => (s.kind === 'friend' ? [s.friendId] : []))
        if (invited.length) {
          await tx.insert(invitations).values(
            invited.map((playerId) => ({
              id: randomUUID(),
              matchId: id,
              playerId,
              fromId: host.id,
              createdAt: now,
            })),
          )
          await notifier?.enqueue(
            tx,
            invited.map((playerId) => ({
              playerId,
              kind: 'invitation' as const,
              matchId: id,
              title: (locale: Locale) =>
                translate(locale, 'notify.invitation.title', { name: draft.name }),
              body: (locale: Locale) =>
                translate(locale, `notify.invitation.${draft.mode}`, {
                  host: host.displayName,
                  name: draft.name,
                  seats: draft.seats.length,
                }),
              url: '/',
              dedupeKey: `invitation:${id}:${playerId}`,
            })),
            now,
          )
        }
        if (start) await launchMatch(tx, id, now)
        await signal(tx, invited, ['lobby'])
        return { matchId: id, started: start }
      })
      .finally(() => notifier?.kick())
  }

  /** Dev helper: solo match against AI personalities, created through the wizard's code */
  async function createSolo(
    host: { id: string; displayName: string },
    opts: {
      size?: string
      opponents?: number
      difficulty?: 'easy' | 'normal' | 'hard'
      seed?: string
      shape?: string
    } = {},
  ) {
    const size = mapSize(opts.size) ? opts.size! : 'medium'
    const worldShape = isWorldShape(opts.shape) ? opts.shape : 'continent'
    const opponents = Math.min(3, Math.max(1, opts.opponents ?? 2))
    const difficulty = (['easy', 'normal', 'hard'] as const).includes(opts.difficulty as never)
      ? opts.difficulty!
      : 'normal'
    const draft = defaultDraft(
      {
        ...DEFAULT_PRESET,
        mode: 'live',
        map: {
          ...DEFAULT_PRESET.map,
          landShare: 35,
          size: size as MapSettings['size'],
          worldShape,
        },
        victoryCondition: 'elimination',
      },
      { seed: opts.seed?.trim().toUpperCase() || undefined },
    )
    draft.name = `Solo ${draft.map.seed}`
    draft.factionId = 'eisenbund'
    draft.seats = [
      { kind: 'you' },
      ...['kessler', 'halvorsen', 'ostrow']
        .slice(0, opponents)
        .map((personalityId) => ({ kind: 'ai' as const, personalityId, difficulty })),
    ]
    const id = `solo-${randomUUID().slice(0, 8)}`
    const { matchId } = await createFromDraft(host, draft, { matchId: id })
    return { matchId, seed: draft.map.seed }
  }

  return { getSetup, createFromDraft, createSolo, reservation }
}

export type SetupService = ReturnType<typeof createSetupService>
