import { describe, expect, it } from 'vitest'
import { nameProblem, normalizeName, validateDisplayName, validateRegistration } from '..'

describe('Anzeigenamen', () => {
  it('normalisiert Umlaute, Leetspeak und Trennzeichen', () => {
    expect(normalizeName('H1tl3r_88')).toBe('hitlerbb')
    expect(normalizeName('Ärsch-Loch')).toBe('aerschloch')
    expect(normalizeName('Graf Ostrow')).toBe('grafostrow')
  })

  it('reserviert Rollen und die Namen der KI-Kommandanten', () => {
    expect(nameProblem('Admin')?.key).toBe('account.nameReserved')
    expect(nameProblem('  SYS-TEM ')?.key).toBe('account.nameReserved')
    expect(nameProblem('Admiral Kessler')?.key).toBe('account.nameReserved')
    expect(nameProblem('Kessler')).toBeNull()
    expect(nameProblem('Admiralin')).toBeNull()
  })

  it('sperrt Beleidigungen auch versteckt im Namen', () => {
    for (const name of ['Arschloch99', 'xX_N4z1_Xx', 'F.u.c.k', 'Hurensohn', 'Sieg Heil'])
      expect(nameProblem(name)?.key, name).toBe('account.nameBlocked')
  })

  it('lässt harmlose Namen durch', () => {
    for (const name of ['Kassel', 'Marschall', 'Torpedo', 'Speedo', 'Kapitän Nemo', 'Björn'])
      expect(nameProblem(name), name).toBeNull()
  })

  it('prüft bei Registrierung und Umbenennung dieselben Regeln', () => {
    expect(validateDisplayName('ab')?.key).toBe('account.nameLength')
    expect(validateDisplayName('Moderator')?.key).toBe('account.nameReserved')
    expect(
      validateRegistration({ displayName: 'Hitler', email: 'a@b.de', password: 'sehr-geheim' })
        .displayName?.key,
    ).toBe('account.nameBlocked')
  })
})
