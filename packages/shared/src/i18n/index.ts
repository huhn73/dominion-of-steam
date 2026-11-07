import { de } from './de'
import { en } from './en'
import type { DictShape, Leaves, ParamValue, Params, Plural } from './dict'
import { DEFAULT_LOCALE, INTL_LOCALE, type Locale } from './locale'

export * from './locale'
export type { DictShape, ParamValue, Params, Plural } from './dict'

export type Dictionary = DictShape<typeof de>
export type MessageKey = Leaves<typeof de>

/** A text that is translated where it is shown: key plus parameters */
export interface Message {
  key: MessageKey
  params?: Params
}

const DICTIONARIES: Record<Locale, Dictionary> = { de, en }

function lookup(dict: Dictionary, key: string): string | Plural | undefined {
  let node: unknown = dict
  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[part]
  }
  return typeof node === 'string' || isPlural(node) ? node : undefined
}

function isPlural(node: unknown): node is Plural {
  return node !== null && typeof node === 'object' && 'one' in node && 'other' in node
}

const pluralRules = new Map<Locale, Intl.PluralRules>()
function pluralForm(locale: Locale, count: number): keyof Plural {
  let rules = pluralRules.get(locale)
  if (!rules) {
    rules = new Intl.PluralRules(INTL_LOCALE[locale])
    pluralRules.set(locale, rules)
  }
  return rules.select(count) === 'one' ? 'one' : 'other'
}

/** Fill `{name}` placeholders; unknown placeholders stay visible, nested messages are translated */
export function interpolate(text: string, params?: Params, locale: Locale = DEFAULT_LOCALE) {
  if (!params) return text
  const one = (value: ParamValue): string =>
    typeof value === 'object' ? translate(locale, value.key, value.params) : String(value)
  return text.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name]
    if (value === undefined) return match
    return Array.isArray(value) ? value.map(one).join(', ') : one(value as ParamValue)
  })
}

/**
 * Text for `key` in `locale`, German if the key is missing there, the key itself if it is
 * missing everywhere (never throws: a missing text must not break a page).
 */
export function translate(locale: Locale, key: MessageKey | string, params?: Params): string {
  const entry = lookup(DICTIONARIES[locale], key) ?? lookup(DICTIONARIES[DEFAULT_LOCALE], key)
  if (entry === undefined) return key
  const text =
    typeof entry === 'string' ? entry : entry[pluralForm(locale, Number(params?.count ?? 0))]
  return interpolate(text, params, locale)
}

export function translateMessage(locale: Locale, message: Message) {
  return translate(locale, message.key, message.params)
}

/** `t('a.b', params)` or `t(message)` */
export interface Translate {
  (key: MessageKey, params?: Params): string
  (message: Message): string
}

export function translator(locale: Locale): Translate {
  return ((key: MessageKey | Message, params?: Params) =>
    typeof key === 'string'
      ? translate(locale, key, params)
      : translate(locale, key.key, key.params)) as Translate
}

export function dictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale]
}

/** Date and number formatting in the given language */
export function formatDate(
  locale: Locale,
  value: string | Date,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], options).format(new Date(value))
}

export function formatNumber(locale: Locale, value: number, options?: Intl.NumberFormatOptions) {
  return value.toLocaleString(INTL_LOCALE[locale], options)
}
