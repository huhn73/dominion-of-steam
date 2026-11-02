import { describe, expect, it } from 'vitest'
import { bitsFromKeys, countBits, decodeBits, emptyBits, encodeBits, hasBit, setBit } from '../bits'

describe('Bitsets', () => {
  it.each([1, 6, 7, 400, 40_000])('kodiert %i Bits verlustfrei', (n) => {
    const bits = new Uint8Array(n)
    for (let i = 0; i < n; i += 3) bits[i] = 1
    bits[n - 1] = 1
    const s = encodeBits(bits)
    expect(s).toHaveLength(Math.ceil(n / 6))
    expect(decodeBits(s, n)).toEqual(bits)
    for (let i = 0; i < n; i++) expect(hasBit(s, i)).toBe(bits[i] === 1)
    expect(countBits(s)).toBe(bits.reduce((a, b) => a + b, 0))
  })

  it('beginnt leer und setzt einzelne Bits', () => {
    const s = emptyBits(20)
    expect(countBits(s)).toBe(0)
    const t = setBit(setBit(s, 0), 19)
    expect(hasBit(t, 0)).toBe(true)
    expect(hasBit(t, 19)).toBe(true)
    expect(hasBit(t, 7)).toBe(false)
    expect(hasBit(t, -1)).toBe(false)
    expect(countBits(t)).toBe(2)
  })

  it('übernimmt Schlüssel „col,row“ und ignoriert Felder außerhalb', () => {
    const s = bitsFromKeys(['0,0', '2,1', '9,9'], { width: 3, height: 2 })
    expect(decodeBits(s, 6)).toEqual(new Uint8Array([1, 0, 0, 0, 0, 1]))
  })
})
