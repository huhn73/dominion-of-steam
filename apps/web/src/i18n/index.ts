export { LocaleProvider, useFormat, useLocale, useT } from './LocaleProvider'
export { activeLocale } from './locale'
export { Rich } from './Rich'

/**
 * Language choice in the settings and on the login card; stays hidden in production until
 * every text is translated (spec 2026-11-07-1821-mehrsprachigkeit, task 9)
 */
export const languageChoiceEnabled =
  import.meta.env.DEV || import.meta.env.VITE_DEV_TOOLS === 'true'
