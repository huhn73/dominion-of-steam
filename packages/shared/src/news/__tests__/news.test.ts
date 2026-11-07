import { describe, expect, it } from 'vitest'
import { compareVersions, latestNewsVersion, NEWS, releasedNews, unseenNews, versionOf } from '..'
import rootPackage from '../../../../../package.json'
import { LOCALES } from '../../i18n'

const rootVersion = rootPackage.version

describe('Neuigkeiten', () => {
  it('sind nach Version absteigend sortiert, eindeutig und datiert', () => {
    for (let i = 1; i < NEWS.length; i++)
      expect(compareVersions(NEWS[i - 1]!.version, NEWS[i]!.version)).toBeGreaterThan(0)
    for (const n of NEWS) expect(n.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('beschreiben jede Neuerung in einem Satz', () => {
    for (const n of NEWS)
      for (const item of n.items)
        for (const locale of LOCALES) {
          expect(item[locale].title.trim(), `${n.version} ${locale}`).not.toBe('')
          expect(item[locale].text, `${n.version} ${locale}`).toMatch(/^[^.!?]+(?:\.[^\s.][^.!?]*)*[.!]$/)
        }
  })

  it('haben einen Eintrag für die aktuelle Version (pnpm release)', () => {
    expect(NEWS.map((n) => n.version)).toContain(rootVersion)
  })

  it('vergleicht Versionen numerisch', () => {
    expect(compareVersions('0.10.0', '0.9.9')).toBeGreaterThan(0)
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0)
    expect(versionOf('0.10.1+abc1234')).toBe('0.10.1')
    expect(versionOf('0.10.1-dev')).toBe('0.10.1')
  })

  it('zeigt nur ungesehene Versionen bis zur laufenden', () => {
    expect(unseenNews('0.9.0', '0.10.1').map((n) => n.version)).toEqual(['0.10.1', '0.10.0'])
    expect(unseenNews('0.10.1', '0.10.1')).toEqual([])
    expect(unseenNews(null, '0.10.1')).toEqual([])
    expect(releasedNews('0.10.0')[0]!.version).toBe('0.10.0')
    expect(latestNewsVersion('0.10.1')).toBe('0.10.1')
  })
})
