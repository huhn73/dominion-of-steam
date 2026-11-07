import { formatDate, type Locale, type Translate } from '@dos/shared/i18n'
import type { FactionColor } from '../types'

export const FACTION_HEX: Record<FactionColor, { base: string; deep: string }> = {
  amber: { base: '#f59e0b', deep: '#78350f' },
  rose: { base: '#f43f5e', deep: '#881337' },
  sky: { base: '#0ea5e9', deep: '#0c4a6e' },
  lime: { base: '#84cc16', deep: '#365314' },
  violet: { base: '#8b5cf6', deep: '#4c1d95' },
  orange: { base: '#f97316', deep: '#7c2d12' },
}

const HOUR = 3_600_000

/** "noch 22 Std.", "noch 1 Std. 40 Min." or "Frist abgelaufen" */
export function timeLeft(t: Translate, deadline: string, now: string) {
  const ms = new Date(deadline).getTime() - new Date(now).getTime()
  if (ms <= 0) return { label: t('common.time.expired'), hours: 0 }
  const h = Math.floor(ms / HOUR)
  const m = Math.round((ms % HOUR) / 60_000)
  const label =
    h === 0
      ? t('common.time.leftMin', { m })
      : h < 6 && m > 0
        ? t('common.time.leftHoursMin', { h, m })
        : t('common.time.leftHours', { h })
  return { label, hours: ms / HOUR }
}

/** "vor 19 Min.", "vor 2 Tagen", or a date for older events */
export function timeAgo(t: Translate, locale: Locale, iso: string, now: string) {
  const ms = new Date(now).getTime() - new Date(iso).getTime()
  const min = Math.round(ms / 60_000)
  if (min < 60) return t('common.time.agoMin', { m: Math.max(1, min) })
  const h = Math.round(min / 60)
  if (h < 24) return t('common.time.agoHours', { h })
  const d = Math.round(h / 24)
  if (d < 7) return d === 1 ? t('common.time.yesterday') : t('common.time.agoDays', { d })
  return formatDate(locale, iso, { day: 'numeric', month: 'short' })
}

export function hoursSince(iso: string, now: string) {
  return (new Date(now).getTime() - new Date(iso).getTime()) / HOUR
}
