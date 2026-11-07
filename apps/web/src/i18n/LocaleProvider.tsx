import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_LOCALE,
  formatDate,
  formatNumber,
  translator,
  type Locale,
  type Translate,
} from '@dos/shared/i18n'
import { initialLocale, setActiveLocale, writeLocale } from './locale'

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translate
}

const fallback: LocaleContextValue = {
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: translator(DEFAULT_LOCALE),
}

const LocaleContext = createContext<LocaleContextValue>(fallback)

/**
 * Language of the app. Sits above the router and only holds local state (the query cache is
 * cleared on login); `ApplyPlayerSettings` sets the player's saved language after login.
 */
export function LocaleProvider({ children, initial }: { children: ReactNode; initial?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const start = initial ?? initialLocale()
    setActiveLocale(start)
    return start
  })

  const setLocale = useCallback((next: Locale) => {
    writeLocale(next)
    setActiveLocale(next)
    setLocaleState(next)
  }, [])

  const value = useMemo(() => ({ locale, setLocale, t: translator(locale) }), [locale, setLocale])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const { locale, setLocale } = useContext(LocaleContext)
  return { locale, setLocale }
}

/** Translate function of the current language: `t('common.language.label')` */
export function useT(): Translate {
  return useContext(LocaleContext).t
}

/** Dates and numbers in the current language */
export function useFormat() {
  const { locale } = useContext(LocaleContext)
  return useMemo(
    () => ({
      date: (value: string | Date, options: Intl.DateTimeFormatOptions) =>
        formatDate(locale, value, options),
      number: (value: number, options?: Intl.NumberFormatOptions) =>
        formatNumber(locale, value, options),
    }),
    [locale],
  )
}
