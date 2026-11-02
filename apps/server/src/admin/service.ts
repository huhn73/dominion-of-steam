import { sql } from 'drizzle-orm'
import type {
  AdminDay,
  AdminMatchRow,
  AdminPlayerRow,
  AdminRange,
  AdminStats,
} from '@dos/shared/admin'
import type { Db } from '../db/client'
import { DEMO_MATCH_ID } from '../matches/service'

const RECENT_LIMIT = 20
const TIME_ZONE = 'Europe/Berlin'
const DAY_MS = 24 * 3600 * 1000

// Test data stays out of the numbers: dev accounts (devAccounts.ts), the demo match and
// matches hosted by a dev account
const DEV_EMAIL = '%@dominion.test'
const realPlayer = sql`p.email NOT LIKE ${DEV_EMAIL}`
const realMatch = sql`m.id <> ${DEMO_MATCH_ID} AND NOT EXISTS (
  SELECT 1 FROM players hp WHERE hp.id = m.host_id AND hp.email LIKE ${DEV_EMAIL})`

const iso = (v: unknown) => (v == null ? null : new Date(v as string | Date).toISOString())
const num = (v: unknown) => Number(v ?? 0)

/** Usage overview for admins; reads only existing data and returns no e-mail addresses */
export function createAdminService(db: Db) {
  const rows = async <T>(query: ReturnType<typeof sql>) =>
    (await db.execute(query)) as unknown as T[]

  async function stats(range: AdminRange, now = new Date()): Promise<AdminStats> {
    // postgres-js takes no Date in raw queries: ISO strings, cast in SQL
    const since = sql`${new Date(now.getTime() - range * DAY_MS).toISOString()}::timestamptz`
    const since24h = sql`${new Date(now.getTime() - DAY_MS).toISOString()}::timestamptz`
    const today = sql`(${now.toISOString()}::timestamptz AT TIME ZONE ${TIME_ZONE})::date`

    const [accounts] = await rows<Record<string, unknown>>(sql`
      SELECT count(*)::int AS total,
             count(*) FILTER (WHERE p.email_verified_at IS NOT NULL)::int AS verified,
             count(*) FILTER (WHERE p.created_at >= ${since})::int AS new,
             count(*) FILTER (WHERE p.last_seen_at >= ${since24h})::int AS active24h,
             count(*) FILTER (WHERE p.last_seen_at >= ${since})::int AS active_range
      FROM players p WHERE ${realPlayer}`)

    const [matchStats] = await rows<Record<string, unknown>>(sql`
      WITH h AS (
        SELECT m.id, m.status, m.mode, m.round, m.created_at,
               (SELECT count(*) FROM match_seats s
                 WHERE s.match_id = m.id AND s.kind = 'player' AND s.player_id IS NOT NULL) AS humans
        FROM matches m WHERE ${realMatch}
      )
      SELECT count(*) FILTER (WHERE status = 'waiting')::int AS waiting,
             count(*) FILTER (WHERE status = 'running')::int AS running,
             count(*) FILTER (WHERE status = 'finished')::int AS finished,
             count(*) FILTER (WHERE mode = 'live')::int AS live,
             count(*) FILTER (WHERE mode = 'async')::int AS async,
             count(*) FILTER (WHERE humans = 1)::int AS solo,
             count(*) FILTER (WHERE humans >= 2)::int AS multiplayer,
             avg(round) FILTER (WHERE status = 'finished')::float AS avg_rounds,
             count(*) FILTER (WHERE created_at >= ${since})::int AS new_in_range
      FROM h`)

    // One row per day (Berlin time), the last one is today; human turns only
    const daily = await rows<Record<string, unknown>>(sql`
      WITH days AS (
        SELECT generate_series(
          ${today} - (${range}::int - 1),
          ${today},
          interval '1 day')::date AS day
      ),
      reg AS (
        SELECT (p.created_at AT TIME ZONE ${TIME_ZONE})::date AS day, count(*) AS n
        FROM players p WHERE ${realPlayer} GROUP BY 1
      ),
      mat AS (
        SELECT (m.created_at AT TIME ZONE ${TIME_ZONE})::date AS day, count(*) AS n
        FROM matches m WHERE ${realMatch} GROUP BY 1
      ),
      tur AS (
        SELECT (t.ended_at AT TIME ZONE ${TIME_ZONE})::date AS day, count(*) AS n
        FROM turns t JOIN players p ON p.id = t.participant_id
        JOIN matches m ON m.id = t.match_id
        WHERE ${realPlayer} AND ${realMatch} GROUP BY 1
      )
      SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
             coalesce(reg.n, 0)::int AS registrations,
             coalesce(mat.n, 0)::int AS matches_started,
             coalesce(tur.n, 0)::int AS turns
      FROM days d
      LEFT JOIN reg ON reg.day = d.day
      LEFT JOIN mat ON mat.day = d.day
      LEFT JOIN tur ON tur.day = d.day
      ORDER BY d.day`)

    const recentPlayers = await rows<Record<string, unknown>>(sql`
      SELECT p.id, p.display_name, p.avatar_url, p.created_at, p.last_seen_at,
             p.email_verified_at IS NOT NULL AS verified,
             (SELECT count(DISTINCT s.match_id) FROM match_seats s
               JOIN matches m ON m.id = s.match_id
               WHERE s.player_id = p.id AND ${realMatch})::int AS matches
      FROM players p WHERE ${realPlayer}
      ORDER BY coalesce(p.last_seen_at, p.created_at) DESC
      LIMIT ${RECENT_LIMIT}`)

    const recentMatches = await rows<Record<string, unknown>>(sql`
      SELECT m.id, m.name, m.mode, m.status, m.round, m.created_at, m.updated_at,
             count(s.*) FILTER (WHERE s.kind = 'player' AND s.player_id IS NOT NULL)::int AS humans,
             count(s.*) FILTER (WHERE s.kind = 'ai')::int AS ais
      FROM matches m LEFT JOIN match_seats s ON s.match_id = m.id
      WHERE ${realMatch}
      GROUP BY m.id
      ORDER BY m.updated_at DESC
      LIMIT ${RECENT_LIMIT}`)

    const avg = matchStats?.avg_rounds
    return {
      range,
      accounts: {
        total: num(accounts?.total),
        verified: num(accounts?.verified),
        new: num(accounts?.new),
        active24h: num(accounts?.active24h),
        activeRange: num(accounts?.active_range),
      },
      matches: {
        waiting: num(matchStats?.waiting),
        running: num(matchStats?.running),
        finished: num(matchStats?.finished),
        live: num(matchStats?.live),
        async: num(matchStats?.async),
        solo: num(matchStats?.solo),
        multiplayer: num(matchStats?.multiplayer),
        avgRoundsFinished: avg == null ? null : Math.round(Number(avg) * 10) / 10,
        newInRange: num(matchStats?.new_in_range),
      },
      daily: daily.map((d): AdminDay => ({
        date: String(d.date),
        registrations: num(d.registrations),
        matchesStarted: num(d.matches_started),
        turns: num(d.turns),
      })),
      recentPlayers: recentPlayers.map((p): AdminPlayerRow => ({
        id: String(p.id),
        name: String(p.display_name),
        avatarUrl: (p.avatar_url as string | null) ?? null,
        createdAt: iso(p.created_at)!,
        lastSeenAt: iso(p.last_seen_at),
        emailVerified: Boolean(p.verified),
        matches: num(p.matches),
      })),
      recentMatches: recentMatches.map((m): AdminMatchRow => ({
        id: String(m.id),
        name: String(m.name),
        mode: m.mode as AdminMatchRow['mode'],
        status: m.status as AdminMatchRow['status'],
        round: num(m.round),
        humans: num(m.humans),
        ais: num(m.ais),
        createdAt: iso(m.created_at)!,
        updatedAt: iso(m.updated_at)!,
      })),
    }
  }

  return { stats }
}

export type AdminService = ReturnType<typeof createAdminService>
