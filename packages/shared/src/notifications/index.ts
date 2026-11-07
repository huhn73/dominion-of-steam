// Benachrichtigungen: Einstellungen (Form aus product-plan/sections/spielerprofil-and-einstellungen/
// types.ts, Meilenstein 06 baut die Oberfläche dazu) und die Push-API

export type NotificationEvent =
  'yourTurn' | 'deadlineSoon' | 'invitation' | 'matchEnded' | 'friends' | 'achievement'

export interface ChannelToggle {
  push: boolean
  email: boolean
}

export type EmailDelayHours = 0 | 1 | 6 | 24

export interface NotificationSettings extends Record<NotificationEvent, ChannelToggle> {
  /** Hours offline before an e-mail is sent: 0 = immediately */
  emailDelayHours: EmailDelayHours
}

export const NOTIFICATION_EVENTS: NotificationEvent[] = [
  'yourTurn',
  'deadlineSoon',
  'invitation',
  'matchEnded',
  'friends',
  'achievement',
]

export const EMAIL_DELAY_HOURS: EmailDelayHours[] = [0, 1, 6, 24]

/** Defaults while a player has not saved own settings (`players.settings` is null) */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  yourTurn: { push: true, email: true },
  deadlineSoon: { push: true, email: false },
  invitation: { push: true, email: true },
  matchEnded: { push: true, email: false },
  friends: { push: true, email: false },
  achievement: { push: true, email: false },
  emailDelayHours: 1,
}

/** Remaining time below which "Frist läuft bald ab" is sent (and the lobby warns) */
export const DEADLINE_SOON_HOURS = 3

/**
 * Notification settings from `players.settings` (`{ notifications: … }`, milestone 06). Missing
 * or invalid parts fall back to the defaults, so partial or older settings keep working.
 */
export function notificationSettingsOf(settings: unknown): NotificationSettings {
  const raw =
    settings && typeof settings === 'object'
      ? (settings as { notifications?: unknown }).notifications
      : undefined
  const n = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const result = structuredClone(DEFAULT_NOTIFICATION_SETTINGS)
  for (const event of NOTIFICATION_EVENTS) {
    const t = n[event] as Partial<ChannelToggle> | undefined
    if (!t || typeof t !== 'object') continue
    if (typeof t.push === 'boolean') result[event].push = t.push
    if (typeof t.email === 'boolean') result[event].email = t.email
  }
  if (EMAIL_DELAY_HOURS.includes(n.emailDelayHours as EmailDelayHours))
    result.emailDelayHours = n.emailDelayHours as EmailDelayHours
  return result
}

/** `GET /api/push/key` */
export interface PushKeyResponse {
  /** VAPID public key (base64url) for `PushManager.subscribe` */
  publicKey: string
}

/** `POST /api/push/subscribe` and `DELETE /api/push/subscribe` (only `endpoint` needed) */
export interface PushSubscriptionRequest {
  endpoint: string
  keys?: { p256dh: string; auth: string }
}

/** Payload of a push message (shown by the service worker `public/sw.js`) */
export interface PushPayload {
  title: string
  body: string
  /** Path within the app to open on click, e.g. `/partie/m-…` */
  url: string
  /** Same tag replaces an older notification of the same match */
  tag: string
}
