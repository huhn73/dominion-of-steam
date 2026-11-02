import { describe, expect, it } from 'vitest'
import { parseCommand } from './command'

describe('parseCommand', () => {
  it('nimmt Einheitenbefehle mit unitId an, auch Erkunden', () => {
    expect(parseCommand({ type: 'explore', unitId: 'u8' })).toEqual({
      type: 'explore',
      unitId: 'u8',
    })
    expect(parseCommand({ type: 'sentry', unitId: 'u8' })).toEqual({ type: 'sentry', unitId: 'u8' })
    expect(parseCommand({ type: 'explore' })).toBeNull()
    expect(parseCommand({ type: 'explore', unitId: '' })).toBeNull()
  })

  it('lehnt unbekannte Befehle und falsche Formen ab', () => {
    expect(parseCommand({ type: 'fly', unitId: 'u8' })).toBeNull()
    expect(parseCommand({ type: 'move', unitId: 'u8', target: { col: 1 } })).toBeNull()
    expect(parseCommand(null)).toBeNull()
  })
})
