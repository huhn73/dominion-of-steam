import type { FactionColor, MatchResult } from '../types'

// Typography: Big Shoulders Display (headings), Barlow (body), IBM Plex Mono (numbers)

export const FACTION_HEX: Record<FactionColor, { base: string; deep: string }> = {
  amber: { base: '#f59e0b', deep: '#78350f' },
  rose: { base: '#f43f5e', deep: '#881337' },
  sky: { base: '#0ea5e9', deep: '#0c4a6e' },
  lime: { base: '#84cc16', deep: '#365314' },
  violet: { base: '#8b5cf6', deep: '#4c1d95' },
  orange: { base: '#f97316', deep: '#7c2d12' },
}

export const RESULT_STAMP: Record<MatchResult, { label: string; className: string }> = {
  victory: { label: 'Sieg', className: 'border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300' },
  defeat: { label: 'Niederlage', className: 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400' },
  surrendered: { label: 'Aufgegeben', className: 'border-stone-400 text-stone-500' },
}

export const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Intl.DateTimeFormat('de-DE', opts).format(new Date(iso))

export const percent = (part: number, total: number) => (total === 0 ? 0 : Math.round((part / total) * 100))
