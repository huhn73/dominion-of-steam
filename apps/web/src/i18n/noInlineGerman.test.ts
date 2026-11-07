import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Guard against new inline German texts: every text for players goes through `t()` and the
 * dictionaries in packages/shared/src/i18n. Exceptions: tests, the dictionaries themselves, the
 * German legal pages (binding text) and the developer bar.
 */
const SRC = join(__dirname, '..')
const EXCEPTIONS = [
  'i18n/',
  'test/',
  'pages/rechtliches/ImpressumPage.tsx',
  'pages/rechtliches/DatenschutzPage.tsx',
  'pages/rechtliches/LizenzenPage.tsx',
  'pages/rechtliches/anbieter.ts',
  'pages/lobby/DevBar.tsx',
]
/** English translations of the legal pages are written out like their German originals */
const ENGLISH_PAGES = /^pages\/rechtliches\/\w+En\.tsx$/

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return files(path)
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

/** Lines that look like German text for players */
function suspicious(source: string) {
  return source.split('\n').flatMap((line, i) => {
    // `// i18n-ignore` marks a line that is no text for players
    if (line.includes('i18n-ignore')) return []
    const code = line.replace(/\/\/.*$/, '').trim()
    if (!code || code.startsWith('*') || code.startsWith('/*') || code.includes('console.'))
      return []
    const umlaut = /[äöüÄÖÜß]/.test(code)
    // A line of JSX text, e.g. „Abbrechen“ between tags on its own line
    const bareText = /^[A-ZÄÖÜ][a-zäöüß]+(?: [A-Za-zäöüß]+)*[.!?…]?$/.test(code)
    return umlaut || bareText ? [`${i + 1}: ${code}`] : []
  })
}

describe('Keine Inline-Texte auf Deutsch', () => {
  it('alle Texte kommen aus den Wörterbüchern', () => {
    const found = files(SRC)
      .map((path) => relative(SRC, path).replaceAll('\\', '/'))
      .filter((path) => !EXCEPTIONS.some((e) => path.startsWith(e)) && !ENGLISH_PAGES.test(path))
      .flatMap((path) =>
        suspicious(readFileSync(join(SRC, path), 'utf8')).map((hit) => `${path}:${hit}`),
      )
    expect(found).toEqual([])
  })
})
