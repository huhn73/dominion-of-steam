import { describe, expect, it } from 'vitest'
import { defaultDraft, type MatchDraft, validateDraft } from '..'

const FRIENDS = new Set(['lena'])
const base = (patch: Partial<MatchDraft> = {}): MatchDraft => ({
  ...defaultDraft(undefined, { name: 'Die Kohleinseln II', seed: 'KOHLE-4417' }),
  factionId: 'eisenbund',
  ...patch,
})
const message = (input: unknown) => {
  const r = validateDraft(input, FRIENDS)
  return r.ok ? null : r.message
}

describe('validateDraft', () => {
  it('nimmt einen gültigen Entwurf an und kürzt Name und Kartencode', () => {
    const r = validateDraft(base({ name: '  Ostfront  ' }), FRIENDS)
    expect(r.ok && r.draft.name).toBe('Ostfront')
  })

  it('prüft dieselben Blocker wie der Assistent', () => {
    expect(message(base({ name: '   ' }))).toBe('Gib der Partie einen Namen.')
    expect(message(base({ factionId: null }))).toBe('Wähle deine Fraktion.')
    expect(message(base({ fillEmptyWithAI: false }))).toBe(
      'Lege für jeden Platz fest, wer ihn besetzt, oder lass freie Plätze mit KI auffüllen.',
    )
    expect(message(base({ map: { ...base().map, seed: '' } }))).toBe(
      'Gib einen Kartencode ein oder würfle einen neuen.',
    )
    const twoAurelia: MatchDraft['seats'] = [
      { kind: 'you' },
      { kind: 'ai', personalityId: 'kessler', difficulty: 'hard' },
      { kind: 'ai', personalityId: 'varenne', difficulty: 'easy' },
    ]
    expect(message(base({ seats: twoAurelia }))).toBe(
      'Zwei KI-Gegner führen dieselbe Fraktion. Doppelte Fraktionen sind nicht erlaubt.',
    )
    expect(
      message(
        base({
          factionId: 'aurelia',
          seats: [{ kind: 'you' }, { kind: 'ai', personalityId: 'kessler', difficulty: 'hard' }],
        }),
      ),
    ).toBe(
      'Ein KI-Gegner führt deine Fraktion. Wähle eine andere KI-Persönlichkeit oder erlaube doppelte Fraktionen.',
    )
    expect(message(base({ seats: twoAurelia, allowDuplicateFactions: true }))).toBeNull()
  })

  it('prüft Plätze, Freunde und Persönlichkeiten', () => {
    expect(message(base({ seats: [{ kind: 'you' }] }))).toBe('Eine Partie hat 2 bis 6 Plätze.')
    expect(message(base({ seats: [{ kind: 'open' }, { kind: 'you' }] }))).toBe(
      'Platz 1 gehört dir.',
    )
    expect(message(base({ seats: [{ kind: 'you' }, { kind: 'friend', friendId: 'fremd' }] }))).toBe(
      'Du kannst nur Spieler aus deiner Freundesliste einladen.',
    )
    expect(
      message(
        base({
          seats: [
            { kind: 'you' },
            { kind: 'friend', friendId: 'lena' },
            { kind: 'friend', friendId: 'lena' },
          ],
        }),
      ),
    ).toBe('Jeden Freund kannst du nur einmal einladen.')
    expect(
      message(
        base({ seats: [{ kind: 'you' }, { kind: 'ai', personalityId: 'x', difficulty: 'hard' }] }),
      ),
    ).toBe('Diese KI-Persönlichkeit gibt es nicht.')
    expect(
      message(
        base({
          allowDuplicateFactions: true,
          seats: [
            { kind: 'you' },
            { kind: 'ai', personalityId: 'kessler', difficulty: 'hard' },
            { kind: 'ai', personalityId: 'kessler', difficulty: 'easy' },
          ],
        }),
      ),
    ).toBe('Jede KI-Persönlichkeit kann nur einen Platz besetzen.')
    expect(message(base({ seats: [{ kind: 'you' }, ...Array(4).fill({ kind: 'open' })] }))).toMatch(
      /^Ohne doppelte Fraktionen sind höchstens 4 Plätze möglich/,
    )
    expect(message(base({ seats: [{ kind: 'you' }, { kind: 'robot' }] as never }))).toBe(
      'Ein Platz ist ungültig.',
    )
  })

  it('lehnt unbekannte Werte und ungültige Kartencodes ab', () => {
    expect(message(null)).toBe('Die Angaben zur Partie sind unvollständig.')
    expect(message(base({ asyncTurnLimitHours: 7 }))).toBe('Diese Frist pro Zug gibt es nicht.')
    expect(message(base({ roundLimit: 99 }))).toBe('Diese Rundenzahl gibt es nicht.')
    expect(message(base({ map: { ...base().map, landShare: 47 } }))).toMatch(/Landanteil/)
    expect(message(base({ map: { ...base().map, worldShape: 'pangaea' as never } }))).toMatch(
      /Karteneinstellung/,
    )
    expect(message(base({ map: { ...base().map, seed: 'kohle 12' } }))).toMatch(/Kartencode/)
    expect(message(base({ map: { ...base().map, seed: 'A'.repeat(17) } }))).toMatch(/Kartencode/)
    expect(message(base({ name: 'x'.repeat(41) }))).toMatch(/höchstens 40/)
    expect(message(base({ factionId: 'atlantis' }))).toBe('Diese Fraktion gibt es nicht.')
  })

  it('kennt die Weltform und ergänzt Kontinent bei alten Entwürfen', () => {
    const { worldShape: _w, ...oldMap } = base().map
    const old = validateDraft(base({ map: oldMap as never }), FRIENDS)
    expect(old.ok && old.draft.map.worldShape).toBe('continent')
    const islands = validateDraft(base({ map: { ...base().map, worldShape: 'islands' } }), FRIENDS)
    expect(islands.ok && islands.draft.map.worldShape).toBe('islands')
  })
})
