import type { AccountService } from './accounts'

/** Password of all dev accounts (README) */
export const DEV_PASSWORD = 'dampfmaschine'

/**
 * Dev accounts: Björn and Lena from the demo match plus the friends from the sample data of
 * product-plan/sections/partie-setup-and-ki-gegner (offline friends keep their "last seen").
 */
export const DEV_ACCOUNTS = [
  { displayName: 'Björn', email: 'bjoern@dominion.test', lastSeenAt: null },
  { displayName: 'Lena Hartmann', email: 'lena@dominion.test', lastSeenAt: null },
  { displayName: 'Mira Okonkwo', email: 'mira@dominion.test', lastSeenAt: null },
  { displayName: 'Jonas Vogt', email: 'jonas@dominion.test', lastSeenAt: null },
  {
    displayName: 'Tobias Brenner',
    email: 'tobias@dominion.test',
    lastSeenAt: '2026-10-29T21:14:00Z',
  },
  { displayName: 'Selin Arslan', email: 'selin@dominion.test', lastSeenAt: '2026-10-24T18:02:00Z' },
  {
    displayName: 'Paul Kretschmer-Wittenberg',
    email: 'paul@dominion.test',
    lastSeenAt: '2026-08-11T09:30:00Z',
  },
] as const

/** Create missing dev accounts (idempotent); Björn is friends with everyone */
export async function ensureDevAccounts(accounts: AccountService) {
  const ids: string[] = []
  for (const a of DEV_ACCOUNTS) {
    const existing = await accounts.findByEmail(a.email)
    const player =
      existing ??
      (await accounts.register({
        displayName: a.displayName,
        email: a.email,
        password: DEV_PASSWORD,
        lastSeenAt: a.lastSeenAt ? new Date(a.lastSeenAt) : null,
        emailVerifiedAt: new Date(),
      }))
    ids.push(player.id)
  }
  const [bjoern, ...others] = ids
  for (const id of others) await accounts.addFriend(bjoern!, id)
  return { bjoernId: bjoern!, lenaId: ids[1]! }
}
