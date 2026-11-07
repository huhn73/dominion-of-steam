import { describe, expect, it } from 'vitest'
import { translateMessage } from '../../i18n'

const de = (m: Parameters<typeof translateMessage>[1]) => translateMessage('de', m)
import { defaultDraft, SETUP_OPTIONS, victoryConditionLabel } from '../data'
import { victoryConditionAfterShapeChange } from '../setup'
import type { MatchDraft } from '../types'

const withShape = (draft: MatchDraft, worldShape: MatchDraft['map']['worldShape']) => ({
  ...draft,
  map: { ...draft.map, worldShape },
})

describe('Siegbedingung „Vorherrschaft“', () => {
  it('steht im Assistenten zur Wahl', () => {
    expect(SETUP_OPTIONS.victoryConditions.map((v) => v.id)).toContain('dominance')
    expect(de(victoryConditionLabel({ victoryCondition: 'dominance', roundLimit: null }))).toBe(
      'Vorherrschaft',
    )
  })

  it('wird für Inselwelt und Archipel vorgeschlagen, solange die Vorgabe gilt', () => {
    const draft = defaultDraft()
    expect(draft.victoryCondition).toBe('capitals')
    expect(victoryConditionAfterShapeChange(draft, 'islands')).toBe('dominance')
    expect(victoryConditionAfterShapeChange(draft, 'archipelago')).toBe('dominance')
    expect(victoryConditionAfterShapeChange(draft, 'continent')).toBe('capitals')
  })

  it('kehrt beim Kontinent zur Vorgabe zurück und lässt eine eigene Wahl stehen', () => {
    const islands = {
      ...withShape(defaultDraft(), 'islands'),
      victoryCondition: 'dominance' as const,
    }
    expect(victoryConditionAfterShapeChange(islands, 'continent')).toBe('capitals')
    expect(victoryConditionAfterShapeChange(islands, 'archipelago')).toBe('dominance')
    const chosen = { ...defaultDraft(), victoryCondition: 'roundLimit' as const }
    expect(victoryConditionAfterShapeChange(chosen, 'islands')).toBe('roundLimit')
    const elimination = {
      ...withShape(defaultDraft(), 'islands'),
      victoryCondition: 'elimination' as const,
    }
    expect(victoryConditionAfterShapeChange(elimination, 'continent')).toBe('elimination')
  })
})
