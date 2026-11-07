import { describe, expect, it } from 'vitest'
import type { GameState } from '@dos/shared/engine'
import type { Locale } from '@dos/shared/i18n'
import { mailFor, type Localizable } from './service'
import { yourTurnNotification } from './events'

describe('Benachrichtigungen in der Sprache des Empfängers', () => {
  it('rendert Titel und Text erst mit der Sprache', () => {
    const state = {
      id: 'm-test',
      name: 'Nordwind',
      mode: 'async',
      round: 3,
      seat: 0,
      turnDeadline: '2026-10-31T10:00:00Z',
    } as GameState
    const turn = yourTurnNotification(state, 'p1')
    const text = (v: Localizable, l: Locale) => (typeof v === 'string' ? v : v(l))
    expect(text(turn.title, 'de')).toBe('Du bist am Zug: Nordwind')
    expect(text(turn.title, 'en')).toBe('Your turn: Nordwind')
    expect(text(turn.body, 'de')).toBe(
      'Du bist in Runde 3 am Zug. Deine Truppen warten auf Befehle. Frist: Sa., 31. Okt., 11:00.',
    )
    expect(text(turn.body, 'en')).toBe(
      'It is your turn in round 3. Your troops await orders. Deadline: Sat 31 Oct, 11:00.',
    )
  })

  it('schreibt die Partie-Mail mit Gruß und Knopf in der Sprache', () => {
    const mail = mailFor({ title: 'T', body: 'B', url: '/partie/x' }, 'Lena', 'https://d.test', 'en')
    expect(mail.text).toMatch(/^Hello Lena,/)
    expect(mail.text).toContain('To the match: https://d.test/partie/x')
  })
})
