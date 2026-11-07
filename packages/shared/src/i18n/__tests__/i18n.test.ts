import { describe, expect, it } from 'vitest'
import { dictionary, interpolate, pickLocale, translate, type Dictionary } from '..'

function leaves(node: unknown, path = ''): [string, unknown][] {
  if (typeof node === 'string') return [[path, node]]
  return Object.entries(node as object).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k))
}

describe('pickLocale', () => {
  it('takes the first supported language', () => {
    expect(pickLocale(['fr-FR', 'en-US', 'de'])).toBe('en')
    expect(pickLocale('en-US,en;q=0.9,de;q=0.8')).toBe('en')
    expect(pickLocale('de-AT')).toBe('de')
  })
  it('falls back to German', () => {
    expect(pickLocale(['fr'])).toBe('de')
    expect(pickLocale(undefined)).toBe('de')
    expect(pickLocale('')).toBe('de')
  })
})

describe('translate', () => {
  it('looks up dotted keys per language', () => {
    expect(translate('de', 'common.language.label')).toBe('Sprache')
    expect(translate('en', 'common.language.label')).toBe('Language')
  })
  it('returns the key for unknown keys', () => {
    expect(translate('en', 'nope.missing')).toBe('nope.missing')
  })
  it('fills placeholders', () => {
    expect(interpolate('{a} gegen {b}', { a: 'X', b: 2 })).toBe('X gegen 2')
    expect(interpolate('{a} und {c}', { a: 'X' })).toBe('X und {c}')
  })
})

describe('dictionaries', () => {
  const de = leaves(dictionary('de'))
  const en = new Map(leaves(dictionary('en')))
  it('English has every German text and none is empty', () => {
    for (const [key] of de) expect(en.get(key), key).toBeTruthy()
  })
  it('placeholders match between the languages', () => {
    const names = (s: unknown) =>
      [...new Set([...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort()
    for (const [key, text] of de) expect(names(en.get(key)), key).toEqual(names(text))
  })
  it('English differs from German except for words both languages share', () => {
    const SAME = new Set([
      'Dominion of Steam',
      'Deutsch',
      'English',
      'Live',
      'Async',
      'Name',
      'Status',
      'Tutorial',
      'Neutral',
      'Normal',
      'Land',
      'Lobby',
      'Online',
      'Offline',
      'Zoom',
      'Push',
      'System',
      'Version {version}',
    ])
    // Texts without words (placeholders, numbers, signs) may be equal
    const wordless = (s: string) => !/[A-Za-zÄÖÜäöüß]/.test(s.replace(/\{\w+\}/g, ''))
    for (const [key, text] of de)
      if (
        en.get(key) === text &&
        !wordless(String(text)) &&
        !SAME.has(String(text)) &&
        // Names from the compendium are checked there (Aurelia stays Aurelia)
        !/^(units|factions)\./.test(key)
      )
        expect.fail(`${key} is not translated: ${String(text)}`)
  })

  it('has the same type for both languages', () => {
    const check: Dictionary = dictionary('en')
    expect(check).toBeDefined()
  })
})
