import { describe, expect, it } from 'vitest'
import { translateMessage } from '../../i18n'

const de = (m: Parameters<typeof translateMessage>[1]) => translateMessage('de', m)
import { defaultDraft, roundLimitLabel, SETUP_OPTIONS } from '../data'
import { roundLimitAfterSizeChange, roundLimitForSize } from '../setup'

describe('Rundenlimit je Kartengröße', () => {
  it('kennt die Vorgabe jeder Stufe und das Label „Ohne Limit“', () => {
    expect(roundLimitForSize(SETUP_OPTIONS, 'small')).toBe(50)
    expect(roundLimitForSize(SETUP_OPTIONS, 'empire')).toBe(500)
    expect(SETUP_OPTIONS.roundLimits).toEqual([50, 100, 150, 250, 500, null])
    expect(de(roundLimitLabel(null))).toBe('Ohne Limit')
    expect(de(roundLimitLabel(250))).toBe('250 Runden')
  })

  it('folgt der Stufe, solange der Spieler das Limit nicht selbst gesetzt hat', () => {
    const draft = defaultDraft() // medium, 150
    expect(roundLimitAfterSizeChange(draft, SETUP_OPTIONS, 'empire')).toBe(500)
    const custom = { ...draft, roundLimit: 100 }
    expect(roundLimitAfterSizeChange(custom, SETUP_OPTIONS, 'empire')).toBe(100)
    const unlimited = { ...draft, roundLimit: null }
    expect(roundLimitAfterSizeChange(unlimited, SETUP_OPTIONS, 'small')).toBeNull()
  })
})
