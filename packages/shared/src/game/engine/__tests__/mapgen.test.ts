import { describe, expect, it } from 'vitest'
import { createMatch, defaultRules, generateWorld, projectView, type MapSettings } from '..'
import { MAP_SIZES } from '../../catalog'
import { hexDistance, isWater } from '../../hex'
import { expandMap, isWaterCode, terrainAt, visibilityAt } from '../../mapcodec'

const settings = (extra: Partial<MapSettings> = {}): MapSettings => ({
  ...MAP_SIZES.medium,
  landShare: 45,
  neutralCities: 'normal',
  terrain: 'normal',
  seed: 'KOHLE-4417',
  ...extra,
})

const landShare = (terrain: string) =>
  [...terrain].filter((c) => !isWaterCode(c)).length / terrain.length

describe('Kartengenerator', () => {
  it('erzeugt aus gleichem Seed und gleichen Einstellungen dieselbe Welt', () => {
    expect(generateWorld(settings(), 3)).toEqual(generateWorld(settings(), 3))
    expect(generateWorld(settings({ seed: 'DAMPF-1234' }), 3)).not.toEqual(
      generateWorld(settings(), 3),
    )
  })

  it('umgibt die Welt mit Tiefsee und setzt Untiefen an die Küsten', () => {
    const world = generateWorld(settings(), 2)
    const { width, height } = MAP_SIZES.medium
    const map = { width, height, terrain: world.terrain }
    for (let row = 0; row < height; row++)
      for (let col = 0; col < width; col++) {
        if (col === 0 || row === 0 || col === width - 1 || row === height - 1)
          expect(isWater(terrainAt(map, { col, row })!)).toBe(true)
      }
    expect(world.terrain.includes('s')).toBe(true)
  })

  it.each([20, 45, 70])('trifft den Landanteil von %i %%', (share) => {
    for (const size of ['small', 'large'] as const) {
      const { terrain } = generateWorld(settings({ ...MAP_SIZES[size], landShare: share }), 2)
      const ring = 2 * (MAP_SIZES[size].width + MAP_SIZES[size].height) - 4
      const maxShare = (terrain.length - ring) / terrain.length
      expect(landShare(terrain)).toBeCloseTo(Math.min(share / 100, maxShare), 1)
    }
  })

  it('setzt Hauptstädte auf Land, weit auseinander und mit Platz drumherum', () => {
    for (const seed of ['A-1', 'B-2', 'C-3', 'D-4']) {
      const world = generateWorld(settings({ ...MAP_SIZES.large, seed }), 4)
      expect(world.capitals).toHaveLength(4)
      const map = { ...MAP_SIZES.large, terrain: world.terrain }
      for (const [i, c] of world.capitals.entries()) {
        expect(isWater(terrainAt(map, c)!)).toBe(false)
        for (const other of world.capitals.slice(i + 1))
          expect(hexDistance(c, other)).toBeGreaterThanOrEqual(4)
      }
    }
  })

  it('hält Abstand zwischen Städten und skaliert ihre Anzahl mit der Stufe', () => {
    const count = (neutralCities: MapSettings['neutralCities']) =>
      generateWorld(settings({ neutralCities }), 2).neutralCities.length
    expect(count('low')).toBeLessThan(count('normal'))
    expect(count('normal')).toBeLessThan(count('high'))
    const world = generateWorld(settings({ neutralCities: 'high' }), 2)
    const all = [...world.capitals, ...world.neutralCities]
    for (const [i, c] of all.entries())
      for (const o of all.slice(i + 1)) expect(hexDistance(c, o)).toBeGreaterThanOrEqual(3)
    expect(new Set(world.neutralCities.map((c) => c.name)).size).toBe(world.neutralCities.length)
  })

  it('macht mit höherer Geländestufe mehr Wald, Hügel und Berge', () => {
    const rough = (terrain: MapSettings['terrain']) =>
      [...generateWorld(settings({ terrain }), 2).terrain].filter((c) => 'fhm'.includes(c)).length
    expect(rough('low')).toBeLessThan(rough('normal'))
    expect(rough('normal')).toBeLessThan(rough('high'))
  })
})

describe('Neue Partie', () => {
  const match = createMatch({
    id: 'm1',
    name: 'Testwelt',
    rules: defaultRules('live'),
    map: settings(),
    participants: [
      {
        id: 'p1',
        name: 'Björn',
        factionId: 'eisenbund',
        color: 'amber',
        isAI: false,
        aiDifficulty: null,
      },
      {
        id: 'p2',
        name: 'Admiral Kessler',
        factionId: 'aurelia',
        color: 'rose',
        isAI: true,
        aiDifficulty: 'normal',
      },
    ],
  })

  it('gibt jedem Teilnehmer Hauptstadt, Produktion mit Fraktionsbonus und eine Einheit', () => {
    const capitals = match.cities.filter((c) => c.isCapital)
    expect(capitals.map((c) => [c.ownerId, c.name])).toEqual([
      ['p1', 'Eisenhafen'],
      ['p2', 'Port Aurel'],
    ])
    expect(capitals[0]!.production).toEqual({
      unitTypeId: 'grenadiere',
      progress: 0,
      turnsRemaining: 4,
    })
    expect(capitals[1]!.production!.turnsRemaining).toBe(4)
    expect(match.units.map((u) => [u.ownerId, u.unitTypeId])).toEqual([
      ['p1', 'grenadiere'],
      ['p2', 'grenadiere'],
    ])
    expect(match.cities.filter((c) => c.ownerId === null).length).toBeGreaterThan(3)
  })

  it('zeigt dem Spieler nur die Umgebung seiner Hauptstadt', () => {
    const view = projectView(match, 'p1')
    const known = expandMap(view.map).filter((t) => t.visibility !== 'unexplored')
    expect(known.length).toBeLessThan(15)
    expect(visibilityAt(view.map, match.cities[0]!)).toBe('visible')
    expect(view.cities.map((c) => c.name)).toContain('Eisenhafen')
    expect(view.cities.some((c) => c.ownerId === 'p2')).toBe(false)
    expect(view.match).toMatchObject({ phase: 'yourTurn', round: 1 })
  })
})
