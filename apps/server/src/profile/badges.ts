import { and, eq, inArray, sql } from 'drizzle-orm'
import { translate, type Locale } from '@dos/shared/i18n'
import {
  BADGES,
  earnedBadges,
  type BadgeId,
  type BadgeStats,
  type ProfileBadge,
} from '@dos/shared/profile'
import type { Db } from '../db/client'
import { playerBadges, playerResults, players } from '../db/schema'
import type { Tx } from '../matches/repository'
import type { NotificationInput } from '../notifications/service'

/** Aggregates of the stored results the badge rules need */
export async function badgeStats(db: Db | Tx, playerId: string): Promise<BadgeStats> {
  const won = sql`${playerResults.result} = 'victory'`
  const [row] = await db
    .select({
      wins: sql<number>`count(*) filter (where ${won})::int`,
      citiesCaptured: sql<number>`coalesce(sum(${playerResults.citiesCaptured}), 0)::int`,
      unitsBuilt: sql<number>`coalesce(sum(${playerResults.unitsBuilt}), 0)::int`,
      longestGameRounds: sql<number>`coalesce(max(${playerResults.rounds}), 0)::int`,
      winFactions: sql<
        string[]
      >`coalesce(array_agg(distinct ${playerResults.factionId}) filter (where ${won}), '{}')`,
      dominanceWins: sql<number>`count(*) filter (where ${won} and ${playerResults.endReason} = 'dominance')::int`,
      capitalWins: sql<number>`count(*) filter (where ${won} and ${playerResults.endReason} = 'capitals')::int`,
      hardAiWins: sql<number>`count(*) filter (where ${won} and ${playerResults.beatHardAi})::int`,
      bigWins: sql<number>`count(*) filter (where ${won} and ${playerResults.playerCount} >= 4)::int`,
    })
    .from(playerResults)
    .where(eq(playerResults.playerId, playerId))
  const [player] = await db
    .select({ tutorial: players.tutorialCompletedAt })
    .from(players)
    .where(eq(players.id, playerId))
  return { ...row!, tutorialCompleted: !!player?.tutorial }
}

/** All badges of a player for the profile: earned ones with date, the others with progress */
export async function profileBadges(db: Db | Tx, playerId: string): Promise<ProfileBadge[]> {
  const stats = await badgeStats(db, playerId)
  const earned = new Map(
    (
      await db
        .select({ id: playerBadges.badgeId, at: playerBadges.earnedAt })
        .from(playerBadges)
        .where(eq(playerBadges.playerId, playerId))
    ).map((b) => [b.id, b.at.toISOString()]),
  )
  return BADGES.map((b) => {
    const [progress, target] = b.progress(stats)
    return { id: b.id, icon: b.icon, earnedAt: earned.get(b.id) ?? null, progress, target }
  })
}

/** Notification „Abzeichen erhalten“ in the recipient's language */
export const badgeNotification = (playerId: string, badge: BadgeId): NotificationInput => ({
  playerId,
  kind: 'badge',
  title: (locale: Locale) =>
    translate(locale, 'notify.badge.title', { name: { key: `badges.${badge}.name` } }),
  body: (locale: Locale) => translate(locale, `badges.${badge}.hint`),
  url: '/profil',
  dedupeKey: `badge:${playerId}:${badge}`,
  email: false,
})

/**
 * Award the badges the players have reached and not got yet. With `notify` each new badge gets
 * a notification (not when old results are added at server start).
 */
export async function awardBadges(
  db: Db | Tx,
  playerIds: string[],
  notify?: (items: NotificationInput[]) => Promise<void>,
) {
  const awarded: { playerId: string; badgeId: BadgeId }[] = []
  for (const playerId of new Set(playerIds)) {
    const reached = earnedBadges(await badgeStats(db, playerId))
    if (!reached.length) continue
    const have = new Set(
      (
        await db
          .select({ id: playerBadges.badgeId })
          .from(playerBadges)
          .where(and(eq(playerBadges.playerId, playerId), inArray(playerBadges.badgeId, reached)))
      ).map((b) => b.id),
    )
    const fresh = reached.filter((id) => !have.has(id))
    if (!fresh.length) continue
    await db
      .insert(playerBadges)
      .values(fresh.map((badgeId) => ({ playerId, badgeId })))
      .onConflictDoNothing()
    awarded.push(...fresh.map((badgeId) => ({ playerId, badgeId })))
  }
  if (notify && awarded.length)
    await notify(awarded.map((a) => badgeNotification(a.playerId, a.badgeId)))
  return awarded
}

/** Badges for results stored before badges existed; no notifications. Returns the count */
export async function backfillBadges(db: Db) {
  const ids = await db
    .selectDistinct({ id: players.id })
    .from(players)
    .leftJoin(playerResults, eq(playerResults.playerId, players.id))
    .where(sql`${playerResults.playerId} is not null or ${players.tutorialCompletedAt} is not null`)
  return (
    await awardBadges(
      db,
      ids.map((r) => r.id),
    )
  ).length
}
