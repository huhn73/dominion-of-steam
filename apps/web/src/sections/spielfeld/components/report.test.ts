import { describe, expect, it } from 'vitest'
import sample from '../../../../../../product-plan/sections/spielfeld-and-zuge/sample-data.json'
import type { GameEvent, ReplayAction, SpielfeldUndZuegeProps } from '../types'
import { translator } from '@dos/shared/i18n'
import { buildTurnReport } from './report'

const data = sample as unknown as SpielfeldUndZuegeProps
const event = (id: string, type: GameEvent['type'], message: string = type): GameEvent => ({
  id,
  round: 14,
  type,
  message,
  col: 1,
  row: 2,
  isNew: true,
})

describe('buildTurnReport', () => {
  it('ordnet die Ereignisse den Abschnitten in fester Reihenfolge zu', () => {
    const events = [
      event('a', 'unitBuilt'),
      event('b', 'cityDiscovered'),
      event('c', 'unitLost'),
      event('d', 'combat'),
      event('e', 'cityLost'),
      event('f', 'enemySighted'),
      event('g', 'fuelLow'),
      event('h', 'cityCaptured'),
      event('i', 'exploration'),
    ]
    const report = buildTurnReport({
      events,
      replay: [],
      participants: data.participants,
      unitTypes: data.unitTypes,
      round: 14,
    })
    expect(report.isEmpty).toBe(false)
    expect(report.sections.map((s) => s.title)).toEqual([
      'Verluste',
      'Städte',
      'Gefechte',
      'Entdeckt',
      'Eigenes Reich',
    ])
    expect(report.sections.map((s) => s.entries.map((e) => e.key))).toEqual([
      ['c'],
      ['e', 'h'],
      ['d'],
      ['b', 'f'],
      ['a', 'g', 'i'],
    ])
    expect(report.sections[0]!.entries[0]).toMatchObject({
      eventId: 'c',
      coord: { col: 1, row: 2 },
      isNew: true,
    })
  })

  it('beschreibt Gegnerbewegungen mit Einheit, Spieler und Endpunkt bzw. Ergebnis', () => {
    const replay: ReplayAction[] = [
      {
        id: 'r1',
        participantId: 'p2',
        action: 'move',
        unitTypeId: 'panzerkreuzer',
        path: [
          { col: 10, row: 4 },
          { col: 10, row: 5 },
        ],
        result: null,
      },
      {
        id: 'r2',
        participantId: 'p2',
        action: 'attack',
        unitTypeId: 'tauchboot',
        path: [
          { col: 9, row: 8 },
          { col: 10, row: 8 },
        ],
        result: 'Kanonenboot versenkt',
      },
      { id: 'r3', participantId: 'p2', action: 'capture', unitTypeId: 'grenadiere', path: [], result: null },
    ]
    const report = buildTurnReport({
      events: [],
      replay,
      participants: data.participants,
      unitTypes: data.unitTypes,
      round: 14,
    })
    expect(report.sections).toHaveLength(1)
    const [moves] = report.sections
    expect(moves!.title).toBe('Gegnerbewegungen')
    expect(moves!.entries).toEqual([
      expect.objectContaining({
        key: 'r1',
        icon: 'move',
        text: 'Panzerkreuzer · Admiral Kessler',
        detail: 'nach 10,5',
        coord: { col: 10, row: 5 },
      }),
      expect.objectContaining({
        key: 'r2',
        icon: 'attack',
        text: 'Tauchboot · Admiral Kessler',
        detail: 'greift an · Kanonenboot versenkt',
        coord: { col: 10, row: 8 },
      }),
    ])
  })

  it('ist leer ohne Ereignisse und Bewegungen', () => {
    const report = buildTurnReport({
      events: [],
      replay: [],
      participants: data.participants,
      unitTypes: data.unitTypes,
      round: 3,
    })
    expect(report).toEqual({ round: 3, sections: [], isEmpty: true })
  })
})

describe('buildTurnReport in English', () => {
  it('formuliert strukturierte Ereignisse in der Sprache des Spielers, alte nur mit deutschem Text', () => {
    const built: GameEvent = {
      ...event('a', 'unitBuilt', 'Kesselhafen hat Panzerwagen fertiggestellt.'),
      text: { key: 'events.built', params: { city: 'Kesselhafen', unit: { key: 'units.panzerwagen' } } },
    }
    const legacy = event('b', 'unitLost', 'Grenadiere ist ohne Treibstoff abgestürzt.')
    const report = buildTurnReport({
      t: translator('en'),
      events: [built, legacy],
      replay: [],
      participants: data.participants,
      unitTypes: data.unitTypes,
      round: 14,
    })
    expect(report.sections.map((s) => s.title)).toEqual(['Losses', 'Home front'])
    const texts = report.sections.flatMap((s) => s.entries.map((e) => e.text))
    expect(texts).toEqual([
      'Grenadiere ist ohne Treibstoff abgestürzt.',
      'Kesselhafen has completed Armoured Car.',
    ])
  })
})
