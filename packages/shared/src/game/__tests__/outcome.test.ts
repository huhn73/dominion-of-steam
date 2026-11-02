import { describe, expect, it } from 'vitest'
import { matchOutcome, participantScore } from '../view'
import type { Participant } from '../types'

const participant = (over: Partial<Participant>): Participant => ({
  id: 'p1',
  name: 'Björn',
  isYou: false,
  isAI: false,
  aiDifficulty: null,
  factionId: 'eisenbund',
  color: 'amber',
  status: 'active',
  cityCount: 2,
  unitCount: 3,
  ...over,
})

const view = (winnerId: string | null, me: Partial<Participant> = {}) => ({
  match: { youId: 'p1' },
  participants: [
    participant({ isYou: true, ...me }),
    participant({ id: 'p2', name: 'KI', isAI: true }),
  ],
  result: { winnerId, endedAt: '2026-10-31T12:00:00Z', placements: { p1: 1, p2: 2 } },
})

describe('matchOutcome', () => {
  it('ist null, solange die Partie läuft', () => {
    expect(matchOutcome({ ...view('p1'), result: null })).toBeNull()
  })
  it('unterscheidet Sieg, Niederlage und Aufgabe', () => {
    expect(matchOutcome(view('p1'))).toBe('victory')
    expect(matchOutcome(view('p2'))).toBe('defeat')
    expect(matchOutcome(view(null))).toBe('defeat')
    // After surrendering the seat is played by an AI („KI für Björn“)
    expect(matchOutcome(view('p2', { isAI: true, name: 'KI für Björn' }))).toBe('surrendered')
  })
  it('ist null für Zuschauer ohne Sitz', () => {
    const v = view('p1')
    expect(matchOutcome({ ...v, match: { youId: 'px' } })).toBeNull()
  })
})

describe('participantScore', () => {
  it('zählt drei Punkte je Stadt und einen je Einheit', () => {
    expect(participantScore({ cityCount: 2, unitCount: 3 })).toBe(9)
    expect(participantScore({ cityCount: 0, unitCount: 0 })).toBe(0)
  })
})
