/** Languages of the game; German is the source and the fallback */
export const LOCALES = ['de', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'de'

/** Locale tags for `Intl` (dates, numbers): British English fits the setting */
export const INTL_LOCALE: Record<Locale, string> = { de: 'de-DE', en: 'en-GB' }

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/**
 * First supported language from a preference list: `navigator.languages` or an
 * `Accept-Language` header ("en-US,en;q=0.9,de;q=0.8", taken in the given order).
 */
export function pickLocale(preferred: readonly string[] | string | null | undefined): Locale {
  const list =
    typeof preferred === 'string'
      ? preferred.split(',').map((part) => part.split(';')[0]!.trim())
      : (preferred ?? [])
  for (const tag of list) {
    const base = tag.toLowerCase().split('-')[0]
    if (isLocale(base)) return base
  }
  return DEFAULT_LOCALE
}
