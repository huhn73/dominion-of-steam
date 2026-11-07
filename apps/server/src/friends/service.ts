import { and, desc, eq, or } from 'drizzle-orm'
import type { FriendRequest, FriendsData, SendFriendRequest } from '@dos/shared/account'
import { translate, type Locale } from '@dos/shared/i18n'
import type { Db } from '../db/client'
import { friendRequests, friendships, players } from '../db/schema'
import { LocalizedError } from '../locale'
import type { AccountService } from '../auth/accounts'
import type { createNotifier, NotificationInput } from '../notifications/service'
import { signal } from '../realtime/signals'

export class FriendsError extends LocalizedError {}

const notFound = () => new FriendsError(404, 'PLAYER_NOT_FOUND', { key: 'errors.noSuchPlayer' })

/** Notification to `to` about `from` (request or accepted request) */
function friendNotification(
  kind: 'friendRequest' | 'friendAccepted',
  to: string,
  fromName: string,
): NotificationInput {
  const key = kind === 'friendRequest' ? 'notify.friendRequest' : 'notify.friendAccepted'
  return {
    playerId: to,
    kind,
    title: (locale: Locale) => translate(locale, `${key}.title`, { name: fromName }),
    body: (locale: Locale) => translate(locale, `${key}.body`, { name: fromName }),
    url: '/freunde',
    email: false,
  }
}

/**
 * Friends with requests: a request waits until the other player accepts; a request to someone
 * who already asked you accepts theirs. Every change signals both players (`friends`).
 */
export function createFriendsService(
  db: Db,
  accounts: AccountService,
  notifier: ReturnType<typeof createNotifier> | null,
) {
  async function requests(where: ReturnType<typeof eq>, side: 'fromId' | 'toId') {
    const rows = await db
      .select({ player: players, createdAt: friendRequests.createdAt })
      .from(friendRequests)
      .innerJoin(players, eq(players.id, friendRequests[side]))
      .where(where)
      .orderBy(desc(friendRequests.createdAt))
    return rows.map((r): FriendRequest => ({
      id: r.player.id,
      name: r.player.displayName,
      avatarUrl: r.player.avatarUrl,
      createdAt: r.createdAt.toISOString(),
    }))
  }

  async function list(me: string): Promise<FriendsData> {
    return {
      friends: await accounts.listFriends(me),
      incoming: await requests(eq(friendRequests.toId, me), 'fromId'),
      outgoing: await requests(eq(friendRequests.fromId, me), 'toId'),
    }
  }

  async function playerName(id: string) {
    const [p] = await db
      .select({ name: players.displayName })
      .from(players)
      .where(eq(players.id, id))
    return p?.name ?? null
  }

  /** Send a request (or accept the other's); answers with the new list */
  async function request(me: string, to: SendFriendRequest) {
    const target =
      'playerId' in to
        ? await db
            .select()
            .from(players)
            .where(eq(players.id, to.playerId))
            .then((r) => r[0] ?? null)
        : await accounts.findByName(to.name)
    if (!target) throw notFound()
    if (target.id === me)
      throw new FriendsError(422, 'CANNOT_FRIEND_SELF', { key: 'errors.friendSelf' })
    await db.transaction(async (tx) => {
      const [friend] = await tx
        .select()
        .from(friendships)
        .where(and(eq(friendships.playerId, me), eq(friendships.friendId, target.id)))
      if (friend) throw new FriendsError(409, 'ALREADY_FRIENDS', { key: 'errors.alreadyFriends' })
      const [mine] = await tx
        .select()
        .from(friendRequests)
        .where(and(eq(friendRequests.fromId, me), eq(friendRequests.toId, target.id)))
      if (mine) throw new FriendsError(409, 'REQUEST_EXISTS', { key: 'errors.requestExists' })
      const [theirs] = await tx
        .select()
        .from(friendRequests)
        .where(and(eq(friendRequests.fromId, target.id), eq(friendRequests.toId, me)))
      const myName = (await playerName(me)) ?? ''
      if (theirs) {
        await befriend(tx, target.id, me)
        await notifier?.enqueue(tx, [friendNotification('friendAccepted', target.id, myName)])
      } else {
        await tx.insert(friendRequests).values({ fromId: me, toId: target.id })
        await notifier?.enqueue(tx, [friendNotification('friendRequest', target.id, myName)])
      }
      await signal(tx, [me, target.id], ['friends'])
    })
    notifier?.kick()
    return list(me)
  }

  /** Turn the request `from` → `to` into a friendship */
  async function befriend(
    tx: Parameters<Parameters<Db['transaction']>[0]>[0],
    from: string,
    to: string,
  ) {
    await tx
      .delete(friendRequests)
      .where(
        or(
          and(eq(friendRequests.fromId, from), eq(friendRequests.toId, to)),
          and(eq(friendRequests.fromId, to), eq(friendRequests.toId, from)),
        ),
      )
    await tx
      .insert(friendships)
      .values([
        { playerId: from, friendId: to },
        { playerId: to, friendId: from },
      ])
      .onConflictDoNothing()
  }

  async function accept(me: string, fromId: string) {
    await db.transaction(async (tx) => {
      const [req] = await tx
        .select()
        .from(friendRequests)
        .where(and(eq(friendRequests.fromId, fromId), eq(friendRequests.toId, me)))
      if (!req) throw new FriendsError(404, 'REQUEST_NOT_FOUND', { key: 'errors.requestNotFound' })
      await befriend(tx, fromId, me)
      const myName = (await playerName(me)) ?? ''
      await notifier?.enqueue(tx, [friendNotification('friendAccepted', fromId, myName)])
      await signal(tx, [me, fromId], ['friends'])
    })
    notifier?.kick()
    return list(me)
  }

  /** Decline a request to me (`fromId`) or withdraw mine (`toId`) */
  async function dropRequest(me: string, other: string, direction: 'incoming' | 'outgoing') {
    const [from, to] = direction === 'incoming' ? [other, me] : [me, other]
    await db.transaction(async (tx) => {
      const deleted = await tx
        .delete(friendRequests)
        .where(and(eq(friendRequests.fromId, from), eq(friendRequests.toId, to)))
        .returning()
      if (!deleted.length)
        throw new FriendsError(404, 'REQUEST_NOT_FOUND', { key: 'errors.requestNotFound' })
      await signal(tx, [me, other], ['friends'])
    })
    return list(me)
  }

  async function remove(me: string, friendId: string) {
    await db.transaction(async (tx) => {
      await tx
        .delete(friendships)
        .where(
          or(
            and(eq(friendships.playerId, me), eq(friendships.friendId, friendId)),
            and(eq(friendships.playerId, friendId), eq(friendships.friendId, me)),
          ),
        )
      await signal(tx, [me, friendId], ['friends'])
    })
    return list(me)
  }

  return { list, request, accept, dropRequest, remove }
}

export type FriendsService = ReturnType<typeof createFriendsService>
