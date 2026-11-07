import { useCallback, useEffect, useState } from 'react'
import type { PushPermission } from '@dos/shared/lobby'
import type { PushKeyResponse } from '@dos/shared/notifications'
import type { MessageKey } from '@dos/shared/i18n'
import { api } from './api'

const SW_URL = '/sw.js'
/** Shown when the browser answers the request without a decision (prompt blocked or closed) */
export const PUSH_NO_PROMPT_HINT = 'common.pushNoPrompt' satisfies MessageKey
/** "Später" hides the banner for this long (per player and browser) */
export const PUSH_BANNER_SNOOZE_MS = 7 * 24 * 3600_000

/** Web push needs notifications, a service worker and the Push API */
export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  )
}

/**
 * Permission as the lobby shows it. Browsers without web push (e.g. Safari on iOS outside the
 * home screen) count as `granted`, so no banner offers something that cannot work.
 */
export function currentPushPermission(): PushPermission {
  if (!pushSupported()) return 'granted'
  return Notification.permission
}

function base64UrlToBytes(value: string) {
  const padded = (value + '='.repeat((4 - (value.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const raw = atob(padded)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

/** Register the service worker, subscribe with the server's VAPID key and store the subscription */
export async function subscribePush() {
  const registration = await navigator.serviceWorker.register(SW_URL)
  await navigator.serviceWorker.ready
  const { publicKey } = await api<PushKeyResponse>('/push/key')
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToBytes(publicKey),
    }))
  await api('/push/subscribe', { method: 'POST', body: subscription.toJSON() })
}

/** Remove this browser's subscription for the logged-in player (before logging out) */
export async function unsubscribePush() {
  if (!pushSupported()) return
  const registration = await navigator.serviceWorker.getRegistration(SW_URL)
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return
  await api('/push/subscribe', { method: 'DELETE', body: { endpoint: subscription.endpoint } })
}

/**
 * Push permission of the browser and the action of the banner. With permission granted the
 * subscription is (re)stored for the logged-in player once, so it follows account switches.
 */
export function usePushPermission() {
  const [permission, setPermission] = useState<PushPermission>(currentPushPermission)
  useEffect(() => {
    if (permission !== 'granted' || !pushSupported()) return
    subscribePush().catch(() => undefined)
  }, [permission])
  // Allowed or blocked later via the address bar (e.g. Edge blocks the prompt of unknown sites
  // silently): follow the change, with focus as a fallback where the Permissions API is missing
  useEffect(() => {
    if (!pushSupported()) return
    const sync = () => setPermission(currentPushPermission())
    let status: PermissionStatus | undefined
    let cancelled = false
    navigator.permissions
      ?.query({ name: 'notifications' })
      .then((s) => {
        if (cancelled) return
        status = s
        s.addEventListener('change', sync)
      })
      .catch(() => undefined)
    window.addEventListener('focus', sync)
    return () => {
      cancelled = true
      status?.removeEventListener('change', sync)
      window.removeEventListener('focus', sync)
    }
  }, [])
  /** Asks the browser; `default` means it showed no prompt or it was closed without a choice */
  const enable = useCallback(async (): Promise<PushPermission> => {
    if (!pushSupported()) return 'granted'
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') await subscribePush()
    return result
  }, [])
  return { permission, enable }
}

const bannerKey = (playerId: string) => `dos.pushBanner.${playerId}`

/** "Später"/"Ausblenden" is stored per player in this browser (localStorage) */
export function usePushBannerDismissed(playerId: string | undefined) {
  const read = () => {
    if (!playerId) return false
    try {
      const at = Number(localStorage.getItem(bannerKey(playerId)))
      return Number.isFinite(at) && at > 0 && Date.now() - at < PUSH_BANNER_SNOOZE_MS
    } catch {
      return false
    }
  }
  const [dismissed, setDismissed] = useState(read)
  useEffect(() => setDismissed(read()), [playerId])
  const dismiss = useCallback(() => {
    setDismissed(true)
    if (!playerId) return
    try {
      localStorage.setItem(bannerKey(playerId), String(Date.now()))
    } catch {
      // Private mode: hidden until the next visit only
    }
  }, [playerId])
  return { dismissed, dismiss }
}
