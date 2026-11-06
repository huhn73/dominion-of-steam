import { isWaterCode, mapSize, mapSizeLabel } from '@dos/shared/game'
import { and, desc, eq, inArray } from 'drizzle-orm'
import {
  currentParticipant,
  type GameRules,
  type GameState,
  miniMap,
  normalizeState,
  surrender as surrenderInEngine,
} from '@dos/shared/engine'
import {
  DEADLINE_WARNING_HOURS,
  type Faction,
  type FinishedMatch,
  type Invitation,
  type JoinResponse,
  type LobbyData,
  type Match,
  type MatchMapInfo,
  type MatchRules,
  MINI_MAP_COLS,
  MINI_MAP_ROWS,
  type OpenMatch,
  type Participant,
  REMIND_COOLDOWN_HOURS,
  remindLocked,
  type RemindResponse,
  startBlockers,
  type WaitingRoomData,
  type WaitingSeat,
} from '@dos/shared/lobby'
import {
  aiPersonality,
  type SeatKind,
  SETUP_FACTIONS,
  turnLimitLabel,
  victoryConditionLabel,
} from '@dos/shared/setup'
import type { Db } from '../db/client'
import { invitations, matches, matchSeats, players, reminders } from '../db/schema'
import { createTutorialService, isTutorialMatchId } from '../tutorial/service'
import { LOBBY_PATH, remindNotification, turnNotifications } from '../notifications/events'
import type { Notifier } from '../notifications/service'
import { lockMatch, MatchWaitingError, saveMatch, type Tx } from '../matches/repository'
import { runAITurns } from '../matches/service'
import { inviteLink, launchMatch } from '../setup/service'
import { signal, signalMatch, signalRoom } from '../realtime/signals'

/** German message for the client with HTTP status and code */
export class LobbyError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

const notFound = () => new LobbyError(404, 'MATCH_NOT_FOUND', 'Partie nicht gefunden.')
const matchFull = () =>
  new LobbyError(409, 'MATCH_FULL', 'Partie voll: Alle freien Plätze sind schon besetzt.')
const alreadyStarted = () =>
  new LobbyError(409, 'ALREADY_STARTED', 'Die Partie hat bereits begonnen.')
const invitationInvalid = (why = 'Diese Einladung ist nicht mehr gültig.') =>
  new LobbyError(410, 'INVITATION_INVALID', why)

type MatchRow = typeof matches.$inferSelect
type SeatRow = typeof matchSeats.$inferSelect

/** Faction data of the lobby components */
export const LOBBY_FACTIONS: Faction[] = SETUP_FACTIONS.map((f) => ({
  id: f.id,
  name: f.name,
  shortName: f.shortName,
  color: f.color,
  emblemUrl: f.emblemUrl,
}))

/** Seats that still wait for a human; filled with AI (or dropped) at the start */
const FREE_KINDS: SeatKind[] = ['friend', 'invite', 'open', 'empty']
/** Seats someone with the invite link may take, in this order */
const LINK_KINDS: SeatKind[] = ['invite', 'open', 'empty']

export function rulesOf(rules: GameRules): MatchRules {
  return {
    mode: rules.mode,
    turnLimitLabel: turnLimitLabel(rules),
    victoryCondition: victoryConditionLabel(rules),
    allowDuplicateFactions: rules.allowDuplicateFactions,
  }
}

function mapInfo(row: MatchRow, state: GameState | null): MatchMapInfo {
  if (row.setup) {
    const size = mapSize(row.setup.map.size)
    // A running match keeps the dimensions it was created with, even if the tier changed since
    const width = state?.map.width ?? size?.width ?? 0
    const height = state?.map.height ?? size?.height ?? 0
    return {
      sizeLabel: mapSizeLabel(width, height),
      width,
      height,
      landShare: row.setup.map.landShare,
      seed: row.setup.map.seed,
      worldShape: row.setup.map.worldShape ?? 'continent',
    }
  }
  // Demo match: no wizard settings, everything from the state
  const terrain = state?.map.terrain ?? ''
  let land = 0
  for (let i = 0; i < terrain.length; i++) if (!isWaterCode(terrain[i])) land++
  return {
    sizeLabel: mapSizeLabel(state?.map.width ?? 0, state?.map.height ?? 0),
    width: state?.map.width ?? 0,
    height: state?.map.height ?? 0,
    landShare: terrain.length ? Math.round((land / terrain.length) * 100) : 0,
    seed: row.seed,
  }
}

const rulesOfRow = (row: MatchRow, state: GameState | null) =>
  rulesOf(state?.rules ?? row.setup!.rules)

/**
 * Participants as the lobby shows them. A surrendered player appears twice, like in the design:
 * the player (status `surrendered`, no cities) and "KI für …" (id `ai-<id>`) who plays on.
 * `controllerIndex` maps a participant id of the game state to the entry that plays it.
 */
export function lobbyParticipants(
  state: GameState,
  viewerId: string,
  avatars: Map<string, string | null>,
) {
  const list: Participant[] = []
  const controller = new Map<string, number>()
  for (const p of state.participants) {
    const cityCount = state.cities.filter((c) => c.ownerId === p.id).length
    if (p.surrender) {
      list.push({
        id: p.id,
        name: p.surrender.name,
        avatarUrl: avatars.get(p.id) ?? null,
        isYou: p.id === viewerId,
        isAI: false,
        aiDifficulty: null,
        factionId: p.factionId,
        status: 'surrendered',
        cityCount: 0,
      })
      controller.set(p.id, list.length)
      list.push({
        id: `ai-${p.id}`,
        name: p.name,
        avatarUrl: null,
        isYou: false,
        isAI: true,
        aiDifficulty: 'normal',
        factionId: p.factionId,
        status: p.status,
        cityCount,
      })
      continue
    }
    controller.set(p.id, list.length)
    list.push({
      id: p.id,
      name: p.name,
      avatarUrl: p.isAI
        ? (aiPersonality(p.aiPersonalityId)?.portraitUrl ?? null)
        : (avatars.get(p.id) ?? null),
      isYou: p.id === viewerId,
      isAI: p.isAI,
      aiDifficulty: p.aiDifficulty,
      factionId: p.factionId,
      status: p.status,
      cityCount,
    })
  }
  return { list, controllerIndex: (id: string) => controller.get(id) ?? -1 }
}

/** Faction for a player who joins: the first free one, else (duplicates allowed) the least used */
export function freeFaction(seats: SeatRow[]): string {
  const used = seats.flatMap((s) =>
    (s.kind === 'player' || s.kind === 'ai') && s.factionId ? [s.factionId] : [],
  )
  const count = (id: string) => used.filter((u) => u === id).length
  return [...SETUP_FACTIONS].sort((a, b) => count(a.id) - count(b.id))[0]!.id
}

export interface LobbyServiceOptions {
  notifier?: Notifier
}

export function createLobbyService(db: Db, { notifier }: LobbyServiceOptions = {}) {
  const tutorial = createTutorialService(db)
  const enqueue: Notifier['enqueue'] = async (tx, items, now) => {
    await notifier?.enqueue(tx, items, now)
  }
  /** Run a transaction and deliver its notifications afterwards */
  const transaction = <T>(fn: (tx: Tx) => Promise<T>) =>
    db.transaction(fn).finally(() => notifier?.kick())

  async function namesAndAvatars(ids: string[]) {
    const unique = [...new Set(ids)]
    const rows = unique.length
      ? await db
          .select({ id: players.id, name: players.displayName, avatarUrl: players.avatarUrl })
          .from(players)
          .where(inArray(players.id, unique))
      : []
    return new Map(rows.map((r) => [r.id, r]))
  }

  // ===========================================================================
  // Lobby
  // ===========================================================================

  async function getLobby(
    you: { id: string; displayName: string; avatarUrl: string | null },
    now = new Date(),
  ): Promise<LobbyData> {
    const me = you.id
    // Matches with a seat of the player (joined, AI-replaced after surrender, or invited)
    const ownSeats = await db.select().from(matchSeats).where(eq(matchSeats.playerId, me))
    // The tutorial has its own card (`tutorial`) and is no match of the lists
    const ids = [...new Set(ownSeats.map((s) => s.matchId))].filter((id) => !isTutorialMatchId(id))
    const rows = ids.length ? await db.select().from(matches).where(inArray(matches.id, ids)) : []
    const seats = ids.length
      ? await db.select().from(matchSeats).where(inArray(matchSeats.matchId, ids))
      : []
    const reminded = ids.length
      ? await db
          .select()
          .from(reminders)
          .where(and(eq(reminders.playerId, me), inArray(reminders.matchId, ids)))
      : []
    const states = new Map(
      rows.flatMap((r) => (r.state ? [[r.id, normalizeState(r.state)] as const] : [])),
    )
    const people = await namesAndAvatars([
      ...seats.flatMap((s) => (s.playerId ? [s.playerId] : [])),
      ...rows.flatMap((r) => (r.hostId ? [r.hostId] : [])),
      ...[...states.values()].flatMap((s) =>
        s.participants.filter((p) => !p.isAI || p.surrender).map((p) => p.id),
      ),
    ])
    const avatars = new Map([...people].map(([id, p]) => [id, p.avatarUrl]))
    const seatsOf = (id: string) =>
      seats.filter((s) => s.matchId === id).sort((a, b) => a.seat - b.seat)

    const running: Match[] = []
    const waiting: Match[] = []
    const finished: FinishedMatch[] = []
    for (const row of rows) {
      const mine = ownSeats.find((s) => s.matchId === row.id)!
      if (row.status === 'waiting') {
        if (mine.kind !== 'player') continue // invited only: listed under invitations
        waiting.push(waitingMatch(row, seatsOf(row.id), me, people))
        continue
      }
      const state = states.get(row.id)
      const p = state?.participants.find((x) => x.id === me)
      if (!state || !p) continue
      if (p.surrender || state.status === 'finished') {
        finished.push(finishedMatch(state, me))
        continue
      }
      const { list, controllerIndex } = lobbyParticipants(state, me, avatars)
      const current = currentParticipant(state)
      const currentEntry = list[controllerIndex(current.id)]
      running.push({
        id: row.id,
        name: row.name,
        status: current.id === me ? 'yourTurn' : 'othersTurn',
        round: state.round,
        // Only async matches have a deadline in the lobby (live time limits run in the match)
        turnDeadline: state.mode === 'async' ? state.turnDeadline : null,
        currentParticipantId: currentEntry?.id ?? null,
        remindedAt: reminded.find((r) => r.matchId === row.id)?.remindedAt.toISOString() ?? null,
        isHost: row.hostId === me,
        participants: list,
        rules: rulesOf(state.rules),
        map: mapInfo(row, state),
        miniMap: miniMap(state, me, controllerIndex, MINI_MAP_COLS, MINI_MAP_ROWS),
      })
    }
    const deadline = (m: Match) => (m.turnDeadline ? Date.parse(m.turnDeadline) : Infinity)
    running.sort((a, b) => deadline(a) - deadline(b))
    finished.sort((a, b) => Date.parse(b.endedAt) - Date.parse(a.endedAt))

    return {
      now: now.toISOString(),
      you: { id: me, name: you.displayName, avatarUrl: you.avatarUrl },
      deadlineWarningHours: DEADLINE_WARNING_HOURS,
      factions: LOBBY_FACTIONS,
      matches: [...running, ...waiting],
      invitations: await pendingInvitations(me),
      openMatches: await openMatches(me),
      finishedMatches: finished.slice(0, 20),
      tutorial: await tutorial.status(me),
    }
  }

  function waitingMatch(
    row: MatchRow,
    seats: SeatRow[],
    me: string,
    people: Map<string, { name: string; avatarUrl: string | null }>,
  ): Match {
    const participants: Participant[] = seats.flatMap((s): Participant[] => {
      if (s.kind === 'player' && s.playerId)
        return [
          {
            id: s.playerId,
            name: people.get(s.playerId)?.name ?? 'Unbekannt',
            avatarUrl: people.get(s.playerId)?.avatarUrl ?? null,
            isYou: s.playerId === me,
            isAI: false,
            aiDifficulty: null,
            factionId: s.factionId ?? '',
            status: 'active',
            cityCount: 0,
          },
        ]
      if (s.kind === 'ai') {
        const personality = aiPersonality(s.aiPersonalityId)
        return [
          {
            id: `seat-${s.seat}`,
            name: personality?.name ?? 'KI',
            avatarUrl: personality?.portraitUrl ?? null,
            isYou: false,
            isAI: true,
            aiDifficulty: s.aiDifficulty,
            factionId: s.factionId ?? '',
            status: 'active',
            cityCount: 0,
          },
        ]
      }
      return []
    })
    return {
      id: row.id,
      name: row.name,
      status: 'waitingForPlayers',
      round: 0,
      turnDeadline: null,
      currentParticipantId: null,
      remindedAt: null,
      isHost: row.hostId === me,
      participants,
      rules: rulesOfRow(row, null),
      map: mapInfo(row, null),
      miniMap: [],
      waitingFor: seats.filter((s) => FREE_KINDS.includes(s.kind)).length,
    }
  }

  function finishedMatch(state: GameState, me: string): FinishedMatch {
    const p = state.participants.find((x) => x.id === me)!
    const winner = state.participants.find((x) => x.id === state.winnerId)
    const winnerName = !winner
      ? state.status === 'finished'
        ? 'niemand'
        : 'Partie läuft noch'
      : winner.isAI && !winner.surrender
        ? `${winner.name} (KI)`
        : winner.name
    if (p.surrender)
      return {
        id: state.id,
        name: state.name,
        endedAt: p.surrender.at,
        result: 'surrendered',
        placement: p.surrender.placement,
        playerCount: state.participants.length,
        rounds: p.surrender.round,
        winner: winnerName,
        factionId: p.factionId,
      }
    return {
      id: state.id,
      name: state.name,
      endedAt: state.endedAt ?? new Date().toISOString(),
      result: state.winnerId === me ? 'victory' : 'defeat',
      placement: p.placement ?? state.participants.length,
      playerCount: state.participants.length,
      rounds: state.round,
      winner: winnerName,
      factionId: p.factionId,
    }
  }

  /** Seat counts of waiting matches: taken = joined players and AI */
  async function seatCounts(matchIds: string[]) {
    const rows = matchIds.length
      ? await db.select().from(matchSeats).where(inArray(matchSeats.matchId, matchIds))
      : []
    return (id: string) => {
      const s = rows.filter((r) => r.matchId === id)
      return {
        seats: s,
        taken: s.filter((r) => r.kind === 'player' || r.kind === 'ai').length,
        total: s.length,
      }
    }
  }

  async function pendingInvitations(me: string): Promise<Invitation[]> {
    const rows = await db
      .select({ inv: invitations, match: matches })
      .from(invitations)
      .innerJoin(matches, eq(matches.id, invitations.matchId))
      .where(
        and(
          eq(invitations.playerId, me),
          eq(invitations.status, 'pending'),
          eq(matches.status, 'waiting'),
        ),
      )
      .orderBy(desc(invitations.createdAt))
    const counts = await seatCounts(rows.map((r) => r.match.id))
    const from = await namesAndAvatars(rows.flatMap((r) => (r.inv.fromId ? [r.inv.fromId] : [])))
    return rows.map(({ inv, match }) => {
      const c = counts(match.id)
      const sender = inv.fromId ? from.get(inv.fromId) : undefined
      const sizeLabel = mapSize(match.setup?.map.size)?.label ?? ''
      return {
        id: inv.id,
        matchName: match.name,
        from: {
          id: inv.fromId ?? '',
          name: sender?.name ?? 'Unbekannt',
          avatarUrl: sender?.avatarUrl ?? null,
        },
        mode: match.mode,
        turnLimitLabel: match.setup ? turnLimitLabel(match.setup.rules) : '',
        mapSizeLabel: sizeLabel,
        seatsTaken: c.taken,
        seatsTotal: c.total,
        sentAt: inv.createdAt.toISOString(),
        message: inv.message,
      }
    })
  }

  /** Waiting matches of other players with at least one open seat (newest first) */
  async function openMatches(me: string): Promise<OpenMatch[]> {
    const withOpen = db
      .selectDistinct({ id: matchSeats.matchId })
      .from(matchSeats)
      .where(eq(matchSeats.kind, 'open'))
    const mine = db
      .selectDistinct({ id: matchSeats.matchId })
      .from(matchSeats)
      .where(eq(matchSeats.playerId, me))
    const rows = await db
      .select()
      .from(matches)
      .where(and(eq(matches.status, 'waiting'), inArray(matches.id, withOpen)))
      .orderBy(desc(matches.createdAt))
      .limit(30)
    const own = new Set((await mine).map((r) => r.id))
    const list = rows.filter((r) => !own.has(r.id))
    const counts = await seatCounts(list.map((r) => r.id))
    const hosts = await namesAndAvatars(list.flatMap((r) => (r.hostId ? [r.hostId] : [])))
    return list.map((row) => {
      const c = counts(row.id)
      const used = new Set(
        c.seats.flatMap((s) =>
          (s.kind === 'player' || s.kind === 'ai') && s.factionId ? [s.factionId] : [],
        ),
      )
      const rules = row.setup!.rules
      return {
        id: row.id,
        name: row.name,
        host: (row.hostId && hosts.get(row.hostId)?.name) || 'Unbekannt',
        mode: row.mode,
        turnLimitLabel: turnLimitLabel(rules),
        mapSizeLabel: mapInfo(row, null).sizeLabel,
        victoryCondition: victoryConditionLabel(rules),
        seatsTaken: c.taken,
        seatsTotal: c.total,
        availableFactionIds: SETUP_FACTIONS.filter((f) => !used.has(f.id)).map((f) => f.id),
      }
    })
  }

  // ===========================================================================
  // Running matches: remind, surrender
  // ===========================================================================

  async function remind(
    matchId: string,
    me: { id: string; displayName: string },
    participantId: unknown,
    now = new Date(),
  ): Promise<RemindResponse> {
    return transaction(async (tx) => {
      const state = await lockRunning(tx, matchId)
      const self = state.participants.find((p) => p.id === me.id)
      if (!self || self.surrender)
        throw new LobbyError(403, 'NOT_PARTICIPANT', 'Du nimmst an dieser Partie nicht teil.')
      if (state.mode !== 'async')
        throw new LobbyError(
          422,
          'REMIND_NOT_AVAILABLE',
          'Erinnern gibt es nur in asynchronen Partien.',
        )
      const current = currentParticipant(state)
      if (current.isAI || current.id === me.id)
        throw new LobbyError(
          422,
          'REMIND_NOT_AVAILABLE',
          'Gerade ist kein Mitspieler am Zug, den du erinnern kannst.',
        )
      if (participantId !== current.id)
        throw new LobbyError(
          409,
          'TURN_CHANGED',
          'Inzwischen ist jemand anderes am Zug. Lade die Lobby neu.',
        )
      const [last] = await tx
        .select()
        .from(reminders)
        .where(and(eq(reminders.matchId, matchId), eq(reminders.playerId, me.id)))
        .for('update')
      if (last && remindLocked(last.remindedAt, now)) {
        const hours = Math.ceil(
          REMIND_COOLDOWN_HOURS - (now.getTime() - last.remindedAt.getTime()) / 3600_000,
        )
        throw new LobbyError(
          429,
          'REMIND_COOLDOWN',
          `Du hast in dieser Partie schon erinnert. Erneut erinnern kannst du in ${hours} Std.`,
        )
      }
      await tx
        .insert(reminders)
        .values({ matchId, playerId: me.id, targetId: current.id, remindedAt: now })
        .onConflictDoUpdate({
          target: [reminders.matchId, reminders.playerId],
          set: { targetId: current.id, remindedAt: now },
        })
      await enqueue(tx, [remindNotification(state, current.id, me.displayName)], now)
      return { remindedAt: now.toISOString() }
    })
  }

  async function lockRunning(tx: Tx, matchId: string) {
    let state: GameState | null
    try {
      state = await lockMatch(tx, matchId)
    } catch (err) {
      if (err instanceof MatchWaitingError)
        throw new LobbyError(409, 'MATCH_WAITING', 'Die Partie wartet noch auf Mitspieler.')
      throw err
    }
    if (!state) throw notFound()
    if (state.status !== 'running')
      throw new LobbyError(409, 'MATCH_FINISHED', 'Die Partie ist bereits beendet.')
    return state
  }

  /** The player surrenders: an AI (Normal) takes over the faction, the match counts as defeat */
  async function surrender(matchId: string, me: string, now = new Date()) {
    return transaction(async (tx) => {
      const before = await lockRunning(tx, matchId)
      const self = before.participants.find((p) => p.id === me)
      if (!self)
        throw new LobbyError(403, 'NOT_PARTICIPANT', 'Du nimmst an dieser Partie nicht teil.')
      if (self.surrender)
        throw new LobbyError(409, 'SURRENDERED', 'Du hast diese Partie bereits aufgegeben.')
      if (self.status !== 'active')
        throw new LobbyError(409, 'ELIMINATED', 'Du bist in dieser Partie bereits ausgeschieden.')
      const state = surrenderInEngine(structuredClone(before), me, now)
      // If it was the player's turn, the AI plays it now
      const next = await runAITurns(tx, state, now)
      await saveMatch(tx, next)
      await tx
        .update(matchSeats)
        .set({ kind: 'ai', aiDifficulty: 'normal' })
        .where(and(eq(matchSeats.matchId, matchId), eq(matchSeats.participantId, me)))
      await enqueue(tx, turnNotifications(before, next, { actorId: me }), now)
      await signalMatch(tx, next)
      return { ok: true as const }
    })
  }

  /**
   * Account deletion: an AI (Normal) takes over the player's faction like after surrendering.
   * Matches the player can no longer influence (finished, already surrendered or eliminated)
   * stay as they are. Returns true when an AI took over.
   */
  async function takeOver(matchId: string, me: string, now = new Date()) {
    try {
      await surrender(matchId, me, now)
      return true
    } catch (err) {
      if (err instanceof LobbyError && [403, 404, 409].includes(err.status)) return false
      throw err
    }
  }

  // ===========================================================================
  // Waiting matches: invitations, joining, ready, start, leave
  // ===========================================================================

  async function lockWaiting(tx: Tx, matchId: string) {
    const [row] = await tx.select().from(matches).where(eq(matches.id, matchId)).for('update')
    if (!row) throw notFound()
    const seats = (await tx.select().from(matchSeats).where(eq(matchSeats.matchId, matchId))).sort(
      (a, b) => a.seat - b.seat,
    )
    return { row, seats }
  }

  /** Put the player on a free seat; the seat remembers its kind for when the player leaves */
  async function takeSeat(tx: Tx, seats: SeatRow[], seat: SeatRow, playerId: string, now: Date) {
    await tx
      .update(matchSeats)
      .set({
        kind: 'player',
        playerId,
        factionId: freeFaction(seats),
        ready: false,
        joinedAt: now,
        freeKind: seat.kind === 'friend' ? 'invite' : seat.kind,
      })
      .where(and(eq(matchSeats.matchId, seat.matchId), eq(matchSeats.seat, seat.seat)))
  }

  /** Accept the friend seat of `playerId` (inside a transaction that locked the match) */
  async function acceptSeat(tx: Tx, seats: SeatRow[], playerId: string, now: Date) {
    const seat = seats.find((s) => s.kind === 'friend' && s.playerId === playerId)
    if (!seat) return false
    await takeSeat(tx, seats, seat, playerId, now)
    await tx
      .update(invitations)
      .set({ status: 'accepted', respondedAt: now })
      .where(and(eq(invitations.matchId, seat.matchId), eq(invitations.playerId, playerId)))
    return true
  }

  async function lockInvitation(tx: Tx, invitationId: string, me: string) {
    const [inv] = await tx
      .select()
      .from(invitations)
      .where(and(eq(invitations.id, invitationId), eq(invitations.playerId, me)))
      .for('update')
    if (!inv) throw invitationInvalid('Diese Einladung gibt es nicht mehr.')
    const { row, seats } = await lockWaiting(tx, inv.matchId)
    if (inv.status !== 'pending' || row.status !== 'waiting')
      throw invitationInvalid(
        row.status !== 'waiting'
          ? 'Die Partie hat bereits begonnen. Die Einladung gilt nicht mehr.'
          : 'Diese Einladung ist nicht mehr gültig.',
      )
    return { inv, row, seats }
  }

  async function acceptInvitation(
    invitationId: string,
    me: string,
    now = new Date(),
  ): Promise<JoinResponse> {
    return transaction(async (tx) => {
      const { row, seats } = await lockInvitation(tx, invitationId, me)
      if (!(await acceptSeat(tx, seats, me, now))) throw invitationInvalid()
      await signalRoom(tx, row.id)
      return { matchId: row.id }
    })
  }

  /** Decline: the friend seat becomes a free seat (`empty`, AI at the start or via the link) */
  async function declineInvitation(invitationId: string, me: string, now = new Date()) {
    return transaction(async (tx) => {
      const { row, seats } = await lockInvitation(tx, invitationId, me)
      await tx
        .update(invitations)
        .set({ status: 'declined', respondedAt: now })
        .where(eq(invitations.id, invitationId))
      const seat = seats.find((s) => s.kind === 'friend' && s.playerId === me)
      if (seat)
        await tx
          .update(matchSeats)
          .set({ kind: 'empty', playerId: null })
          .where(and(eq(matchSeats.matchId, row.id), eq(matchSeats.seat, seat.seat)))
      await signalRoom(tx, row.id)
      return { ok: true as const }
    })
  }

  /** Join an open match from the lobby; only `open` seats, the row lock settles races */
  async function joinOpen(matchId: string, me: string, now = new Date()): Promise<JoinResponse> {
    return transaction(async (tx) => {
      const { row, seats } = await lockWaiting(tx, matchId)
      if (row.status !== 'waiting') throw alreadyStarted()
      if (seats.some((s) => s.kind === 'player' && s.playerId === me)) return { matchId }
      if (!(await acceptSeat(tx, seats, me, now))) {
        const seat = seats.find((s) => s.kind === 'open')
        if (!seat) throw matchFull()
        await takeSeat(tx, seats, seat, me, now)
      }
      await signalRoom(tx, matchId)
      return { matchId }
    })
  }

  /** Open the invite link: take a link, open or empty seat (an invited friend accepts) */
  async function claimInvite(token: string, me: string, now = new Date()): Promise<JoinResponse> {
    return transaction(async (tx) => {
      const [found] = await tx
        .select({ id: matches.id })
        .from(matches)
        .where(eq(matches.inviteToken, token.trim().toUpperCase()))
      if (!found)
        throw new LobbyError(
          404,
          'INVITE_INVALID',
          'Dieser Einladungslink ist ungültig oder abgelaufen.',
        )
      const { row, seats } = await lockWaiting(tx, found.id)
      const joined = seats.some((s) => s.kind === 'player' && s.playerId === me)
      if (joined) return { matchId: row.id }
      if (row.status !== 'waiting')
        throw new LobbyError(
          410,
          'INVITE_EXPIRED',
          'Die Partie hat bereits begonnen. Der Einladungslink gilt nicht mehr.',
        )
      if (!(await acceptSeat(tx, seats, me, now))) {
        const seat = LINK_KINDS.map((k) => seats.find((s) => s.kind === k)).find(Boolean)
        if (!seat) throw matchFull()
        await takeSeat(tx, seats, seat, me, now)
      }
      await signalRoom(tx, row.id)
      return { matchId: row.id }
    })
  }

  async function ownSeat(tx: Tx, matchId: string, me: string) {
    const { row, seats } = await lockWaiting(tx, matchId)
    if (row.status !== 'waiting') throw alreadyStarted()
    const seat = seats.find(
      (s) => s.playerId === me && (s.kind === 'player' || s.kind === 'friend'),
    )
    if (!seat && row.hostId !== me)
      throw new LobbyError(403, 'NOT_PARTICIPANT', 'Du nimmst an dieser Partie nicht teil.')
    return { row, seats, seat }
  }

  async function setReady(matchId: string, me: string, ready: boolean) {
    return transaction(async (tx) => {
      const { seat } = await ownSeat(tx, matchId, me)
      if (seat?.kind !== 'player')
        throw new LobbyError(403, 'NOT_PARTICIPANT', 'Du hast in dieser Partie keinen Platz.')
      await tx
        .update(matchSeats)
        .set({ ready })
        .where(and(eq(matchSeats.matchId, matchId), eq(matchSeats.seat, seat.seat)))
      await signalRoom(tx, matchId)
      return { ok: true as const }
    })
  }

  /**
   * Host starts the match: all joined players must be ready. With `fill` free seats become AI
   * (Normal), otherwise they are dropped and at least two participants must remain.
   */
  async function start(matchId: string, me: string, fill: boolean, now = new Date()) {
    return transaction(async (tx) => {
      const { row, seats } = await lockWaiting(tx, matchId)
      if (row.status !== 'waiting') throw alreadyStarted()
      if (row.hostId !== me)
        throw new LobbyError(403, 'NOT_HOST', 'Nur der Ersteller kann die Partie starten.')
      const people = await namesAndAvatars(seats.flatMap((s) => (s.playerId ? [s.playerId] : [])))
      const blockers = startBlockers(
        seats.map((s) => ({
          kind: s.kind === 'player' ? ('player' as const) : ('ai' as const),
          status: s.ready ? ('ready' as const) : ('joined' as const),
          name: s.playerId ? (people.get(s.playerId)?.name ?? null) : null,
        })),
      )
      if (blockers.length)
        throw new LobbyError(409, 'NOT_READY', `Warte auf ${blockers.join(', ')}`)
      if (!fill) {
        const free = seats.filter((s) => FREE_KINDS.includes(s.kind))
        if (seats.length - free.length < 2)
          throw new LobbyError(
            409,
            'TOO_FEW_PLAYERS',
            'Für den Start braucht es mindestens zwei Teilnehmer. Lass freie Plätze mit KI auffüllen.',
          )
        if (free.length)
          await tx.delete(matchSeats).where(
            and(
              eq(matchSeats.matchId, matchId),
              inArray(
                matchSeats.seat,
                free.map((s) => s.seat),
              ),
            ),
          )
      }
      await tx
        .update(matches)
        .set({ setup: { ...row.setup!, fillEmptyWithAI: fill } })
        .where(eq(matches.id, matchId))
      const started = await launchMatch(tx, matchId, now)
      const next = await runAITurns(tx, structuredClone(started), now)
      await saveMatch(tx, next)
      await enqueue(tx, turnNotifications(null, next, { actorId: me }), now)
      await signalRoom(tx, matchId)
      await signalMatch(tx, next)
      return { matchId }
    })
  }

  /** Leave the waiting room: the host dissolves the match, everyone else frees the seat */
  async function leave(matchId: string, me: { id: string; displayName: string }, now = new Date()) {
    return transaction(async (tx) => {
      const { row, seats, seat } = await ownSeat(tx, matchId, me.id)
      if (row.hostId === me.id) {
        const others = seats.flatMap((s) =>
          s.playerId && s.playerId !== me.id && (s.kind === 'player' || s.kind === 'friend')
            ? [s.playerId]
            : [],
        )
        await tx.delete(matches).where(eq(matches.id, matchId))
        await signal(tx, others, [`room:${matchId}`, 'lobby'])
        await enqueue(
          tx,
          others.map((playerId) => ({
            playerId,
            kind: 'matchCancelled' as const,
            matchId,
            title: `Partie aufgelöst: ${row.name}`,
            body: `${me.displayName} hat „${row.name}“ vor dem Start aufgelöst.`,
            url: LOBBY_PATH,
            email: false,
          })),
          now,
        )
        return { dissolved: true }
      }
      if (seat?.kind === 'friend') {
        // Invited but not joined: same as declining
        await tx
          .update(invitations)
          .set({ status: 'declined', respondedAt: now })
          .where(and(eq(invitations.matchId, matchId), eq(invitations.playerId, me.id)))
        await tx
          .update(matchSeats)
          .set({ kind: 'empty', playerId: null })
          .where(and(eq(matchSeats.matchId, matchId), eq(matchSeats.seat, seat.seat)))
      } else if (seat) {
        await tx
          .update(matchSeats)
          .set({
            kind: seat.freeKind ?? 'invite',
            playerId: null,
            factionId: null,
            ready: false,
            joinedAt: null,
            freeKind: null,
          })
          .where(and(eq(matchSeats.matchId, matchId), eq(matchSeats.seat, seat.seat)))
      }
      await signalRoom(tx, matchId, [me.id])
      return { dissolved: false }
    })
  }

  /**
   * Waiting room in the shape of the `Warteraum` component. Seats of 04 are mapped onto the
   * component's kinds: friend → invited; invite (link), open and empty → open.
   */
  async function room(matchId: string, me: string, origin: string): Promise<WaitingRoomData> {
    const [row] = await db.select().from(matches).where(eq(matches.id, matchId))
    if (!row) throw notFound()
    const seats = (await db.select().from(matchSeats).where(eq(matchSeats.matchId, matchId))).sort(
      (a, b) => a.seat - b.seat,
    )
    if (row.hostId !== me && !seats.some((s) => s.playerId === me))
      throw new LobbyError(403, 'NOT_PARTICIPANT', 'Du nimmst an dieser Partie nicht teil.')
    const people = await namesAndAvatars(seats.flatMap((s) => (s.playerId ? [s.playerId] : [])))
    const state = row.state ? normalizeState(row.state) : null
    const seatOf = (s: SeatRow): WaitingSeat => {
      const base = {
        isYou: s.playerId === me,
        isHost: s.playerId !== null && s.playerId === row.hostId,
      }
      const person = s.playerId ? people.get(s.playerId) : undefined
      switch (s.kind) {
        case 'player':
          return {
            ...base,
            kind: 'player',
            status: s.ready ? 'ready' : 'joined',
            name: person?.name ?? 'Unbekannt',
            avatarUrl: person?.avatarUrl ?? null,
            factionId: s.factionId,
          }
        case 'ai': {
          const personality = aiPersonality(s.aiPersonalityId)
          return {
            ...base,
            kind: 'ai',
            status: 'ready',
            aiDifficulty: s.aiDifficulty ?? 'normal',
            name: personality?.name ?? 'KI',
            avatarUrl: personality?.portraitUrl ?? null,
            factionId: s.factionId,
          }
        }
        case 'friend':
          return {
            ...base,
            kind: 'invited',
            status: 'pending',
            name: person?.name ?? 'Eingeladen',
            avatarUrl: person?.avatarUrl ?? null,
            factionId: null,
          }
        default:
          return {
            ...base,
            isYou: false,
            kind: 'open',
            status: 'pending',
            name: null,
            avatarUrl: null,
            factionId: null,
          }
      }
    }
    return {
      status: row.status,
      factions: LOBBY_FACTIONS,
      room: {
        matchId: row.id,
        matchName: row.name,
        isHost: row.hostId === me,
        inviteLink: row.inviteToken ? inviteLink(origin, row.inviteToken) : '',
        rules: rulesOfRow(row, state),
        map: mapInfo(row, state),
        fillEmptyWithAI: row.setup?.fillEmptyWithAI ?? true,
        seats: seats.map(seatOf),
      },
    }
  }

  return {
    getLobby,
    remind,
    surrender,
    takeOver,
    acceptInvitation,
    declineInvitation,
    joinOpen,
    claimInvite,
    setReady,
    start,
    leave,
    room,
  }
}

export type LobbyService = ReturnType<typeof createLobbyService>
