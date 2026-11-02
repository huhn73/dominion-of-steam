import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt, lt } from 'drizzle-orm'
import type { Db } from '../db/client'
import { accountTokens, type AccountTokenPurpose } from '../db/schema'

/** Tokens (sessions, one-time links) are stored only as SHA-256 hex */
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

/** A random token for a cookie or a link (32 bytes, base64url) */
export const newToken = () => randomBytes(32).toString('base64url')

export type AccountToken = typeof accountTokens.$inferSelect

/**
 * Issue a one-time link token for the player; an older token of the same purpose is replaced.
 * Returns the plain token for the link (the table holds its hash).
 */
export async function issueToken(
  db: Db,
  input: {
    playerId: string
    purpose: AccountTokenPurpose
    email: string
    ttlMs: number
    now?: Date
  },
) {
  const now = input.now ?? new Date()
  const token = newToken()
  const values = {
    id: hashToken(token),
    email: input.email,
    createdAt: now,
    expiresAt: new Date(now.getTime() + input.ttlMs),
  }
  await db
    .insert(accountTokens)
    .values({ playerId: input.playerId, purpose: input.purpose, ...values })
    .onConflictDoUpdate({ target: [accountTokens.playerId, accountTokens.purpose], set: values })
  return token
}

/**
 * Look up a token from a link and delete it, so a link works once. Returns null when the token
 * is unknown, meant for another purpose or expired.
 */
export async function consumeToken(
  db: Db,
  token: string,
  purpose: AccountTokenPurpose,
  now = new Date(),
): Promise<AccountToken | null> {
  if (!token) return null
  const [row] = await db
    .delete(accountTokens)
    .where(and(eq(accountTokens.id, hashToken(token)), eq(accountTokens.purpose, purpose)))
    .returning()
  if (!row || row.expiresAt <= now) return null
  return row
}

/** True when a token of this purpose was issued to the player within `withinMs` */
export async function recentlyIssued(
  db: Db,
  playerId: string,
  purpose: AccountTokenPurpose,
  withinMs: number,
  now = new Date(),
) {
  const [row] = await db
    .select({ id: accountTokens.id })
    .from(accountTokens)
    .where(
      and(
        eq(accountTokens.playerId, playerId),
        eq(accountTokens.purpose, purpose),
        gt(accountTokens.createdAt, new Date(now.getTime() - withinMs)),
      ),
    )
  return !!row
}

export async function deleteExpiredTokens(db: Db, now = new Date()) {
  await db.delete(accountTokens).where(lt(accountTokens.expiresAt, now))
}
