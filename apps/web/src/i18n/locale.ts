import { DEFAULT_LOCALE, isLocale, pickLocale, type Locale } from '@dos/shared/i18n'

export const LOCALE_STORAGE_KEY = 'dos.locale'

/** Saved choice of this browser, else the browser language */
export function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isLocale(saved)) return saved
  } catch {
    // Speicher gesperrt (privates Fenster o. Ä.)
  }
  return typeof navigator === 'undefined' ? DEFAULT_LOCALE : pickLocale(navigator.languages)
}

export function writeLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // ignorieren, Auswahl gilt dann nur für diese Sitzung
  }
}

/** Current language outside React (API header, fallback error texts) */
let active: Locale = DEFAULT_LOCALE
export const activeLocale = () => active
export function setActiveLocale(locale: Locale) {
  active = locale
  document.documentElement.lang = locale
}
