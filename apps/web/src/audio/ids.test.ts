import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  AMBIENCE_IDS,
  attackSfx,
  type AudioManifest,
  barSecondsOf,
  FIELD_BARS,
  MUSIC_IDS,
  SFX_IDS,
  unitSfx,
} from './ids'

// vitest runs in apps/web
const manifest = JSON.parse(
  readFileSync(path.resolve(process.cwd(), '../../public/audio/manifest.json'), 'utf8'),
) as AudioManifest

describe('Audio-IDs', () => {
  it('stimmen mit dem Manifest überein', () => {
    expect([...MUSIC_IDS].sort()).toEqual(Object.keys(manifest.music).sort())
    expect([...AMBIENCE_IDS].sort()).toEqual(Object.keys(manifest.ambience).sort())
    expect([...SFX_IDS].sort()).toEqual(Object.keys(manifest.sfx).sort())
  })

  it('jede Effektgruppe hat mindestens eine Datei unter /audio/', () => {
    for (const [id, paths] of Object.entries(manifest.sfx)) {
      expect(paths.length, id).toBeGreaterThan(0)
      for (const p of paths) expect(p).toMatch(/^\/audio\/sfx\/.+\.ogg$/)
    }
  })

  it('leitet die Taktlänge aus der Dateilänge ab (28 Takte, ≈88 BPM)', () => {
    const bar = barSecondsOf(manifest)
    expect(bar * FIELD_BARS).toBeCloseTo(manifest.playback.adaptive_field.frames / 48000, 6)
    // 4 Schläge je Takt bei ca. 88 BPM
    expect((4 * 60) / bar).toBeGreaterThan(86)
    expect((4 * 60) / bar).toBeLessThan(90)
  })

  it('ordnet Einheiten und Angriffe ihren Sounds zu', () => {
    expect(unitSfx('panzerwagen', 'select')).toBe('panzerwagen-select')
    expect(unitSfx('doppeldecker', 'move')).toBe('doppeldecker-move')
    expect(unitSfx('luftschiff', 'move')).toBeNull()
    expect(attackSfx('grenadiere', 'land')).toBe('combat-gun')
    expect(attackSfx('panzerwagen', 'land')).toBe('combat-cannon')
    expect(attackSfx('kanonenboot', 'sea')).toBe('combat-cannon')
    expect(attackSfx('schwerbomber', 'air')).toBe('combat-air')
  })
})
