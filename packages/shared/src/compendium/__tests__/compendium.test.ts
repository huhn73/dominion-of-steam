import { describe, expect, it } from 'vitest'
import data from '../data.json'
import dataEn from '../data.en.json'
import { compendiumFor, localizeFactions, localizeUnitTypes } from '..'

const TEXT = new Set(['name', 'shortName', 'motto', 'trait', 'label', 'description', 'playstyle', 'playstyleSummary', 'history', 'tactics'])

/** Same structure and the same values outside the texts; every text filled */
function compare(de: unknown, en: unknown, path: string) {
  const key = path.split('.').pop()!.replace(/\[\d+\]$/, '')
  if (TEXT.has(key)) {
    if (Array.isArray(de)) expect((en as unknown[]).length, path).toBe(de.length)
    else expect(typeof en === 'string' && en.trim().length > 0, path).toBe(true)
    return
  }
  if (Array.isArray(de)) {
    expect(Array.isArray(en), path).toBe(true)
    expect((en as unknown[]).length, path).toBe(de.length)
    de.forEach((v, i) => compare(v, (en as unknown[])[i], `${path}[${i}]`))
  } else if (de && typeof de === 'object') {
    expect(Object.keys(en as object).sort(), path).toEqual(Object.keys(de).sort())
    for (const [k, v] of Object.entries(de)) compare(v, (en as Record<string, unknown>)[k], `${path}.${k}`)
  } else expect(en, path).toEqual(de)
}

describe('Kompendium auf Englisch', () => {
  it('hat dieselbe Struktur und dieselben Werte wie das deutsche, nur andere Texte', () => {
    compare(data, dataEn, 'data')
  })

  it('übersetzt Fraktionen und Einheiten anhand der ID', () => {
    expect(compendiumFor('en').factions.find((f) => f.id === 'eisenbund')?.name).toBe(
      'Iron Covenant of Valdrin',
    )
    const [f] = localizeFactions([{ id: 'aurelia', name: 'x', bonus: { label: 'y', stat: 'z' } }], 'en')
    expect(f).toEqual({ id: 'aurelia', name: 'Aurelian Republic', bonus: { label: 'Sea power', stat: 'z' } })
    expect(localizeUnitTypes([{ id: 'panzerwagen', name: 'x', hp: 3 }], 'en')).toEqual([
      { id: 'panzerwagen', name: 'Armoured Car', hp: 3 },
    ])
    expect(localizeUnitTypes([{ id: 'unbekannt', name: 'x' }], 'en')[0]!.name).toBe('x')
  })
})
