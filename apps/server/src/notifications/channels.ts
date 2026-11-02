import { eq } from 'drizzle-orm'
import nodemailer from 'nodemailer'
import webpush from 'web-push'
import type { Db } from '../db/client'
import { appConfig } from '../db/schema'

export interface PushTarget {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

/** Sends one push message; throws an error with `statusCode` when the push service refuses */
export type PushSender = (target: PushTarget, payload: string) => Promise<void>

export interface MailMessage {
  to: string
  subject: string
  text: string
  html: string
}

export type Mailer = (message: MailMessage) => Promise<void>

interface VapidKeys {
  publicKey: string
  privateKey: string
}

/**
 * VAPID keys for web push: from VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY, otherwise generated once and
 * stored in `app_config` (so subscriptions stay valid across restarts and containers).
 */
export async function vapidKeys(db: Db): Promise<VapidKeys> {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env
  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)
    return { publicKey: VAPID_PUBLIC_KEY, privateKey: VAPID_PRIVATE_KEY }
  const read = async () =>
    (await db.select().from(appConfig).where(eq(appConfig.key, 'vapid')))[0]?.value as
      VapidKeys | undefined
  const stored = await read()
  if (stored) return stored
  await db
    .insert(appConfig)
    .values({ key: 'vapid', value: webpush.generateVAPIDKeys() })
    .onConflictDoNothing()
  // Another process may have won the race; everybody uses the stored keys
  return (await read())!
}

/** Web push via the `web-push` library with the VAPID keys of `vapidKeys` */
export function webPushSender(db: Db): PushSender {
  let keys: Promise<VapidKeys> | null = null
  return async (target, payload) => {
    keys ??= vapidKeys(db)
    const { publicKey, privateKey } = await keys
    await webpush.sendNotification(target, payload, {
      TTL: 24 * 3600,
      vapidDetails: {
        subject: process.env.VAPID_SUBJECT ?? 'mailto:noreply@dominion-of-steam.app',
        publicKey,
        privateKey,
      },
    })
  }
}

/** E-mail via SMTP (`SMTP_URL`, e.g. smtp://mailpit:1025); null when not configured */
export function smtpMailer(url = process.env.SMTP_URL): Mailer | null {
  if (!url) return null
  const transport = nodemailer.createTransport(url)
  const from = process.env.MAIL_FROM ?? 'Dominion of Steam <noreply@dominion-of-steam.app>'
  return async (message) => {
    await transport.sendMail({ from, ...message })
  }
}
