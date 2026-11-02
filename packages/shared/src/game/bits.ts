/**
 * Bitsets as URL-safe base64 strings (6 bits per character, no padding). Used for the explored
 * tiles of a participant: 40,000 tiles become 6,667 characters instead of a list of keys.
 */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const DECODE = new Int8Array(128).fill(-1)
for (let i = 0; i < ALPHABET.length; i++) DECODE[ALPHABET.charCodeAt(i)] = i

export const bitsLength = (n: number) => Math.ceil(n / 6)

/** All bits cleared */
export const emptyBits = (n: number) => 'A'.repeat(bitsLength(n))

/** One byte (0 or 1) per bit */
export function decodeBits(s: string, n: number): Uint8Array {
  const bits = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    const v = DECODE[s.charCodeAt((i / 6) | 0)] ?? -1
    if (v > 0 && (v >> (i % 6)) & 1) bits[i] = 1
  }
  return bits
}

export function encodeBits(bits: Uint8Array): string {
  const out = new Array<string>(bitsLength(bits.length))
  for (let c = 0; c < out.length; c++) {
    let v = 0
    for (let b = 0; b < 6; b++) if (bits[c * 6 + b]) v |= 1 << b
    out[c] = ALPHABET[v]!
  }
  return out.join('')
}

/** Reads one bit without decoding the whole string */
export const hasBit = (s: string, i: number) =>
  i >= 0 && ((DECODE[s.charCodeAt((i / 6) | 0)] ?? 0) >> (i % 6)) & 1 ? true : false

/** Returns the string with bit `i` set (O(n); for tests and one-off edits) */
export function setBit(s: string, i: number): string {
  const c = (i / 6) | 0
  const v = (DECODE[s.charCodeAt(c)] ?? 0) | (1 << (i % 6))
  return s.slice(0, c) + ALPHABET[v] + s.slice(c + 1)
}

export function countBits(s: string): number {
  let n = 0
  for (let c = 0; c < s.length; c++) {
    let v = DECODE[s.charCodeAt(c)] ?? 0
    while (v > 0) {
      n += v & 1
      v >>= 1
    }
  }
  return n
}

/** Bitset over the tile index from hexKeys "col,row" (migration of older states, tests) */
export function bitsFromKeys(keys: readonly string[], map: { width: number; height: number }) {
  const bits = new Uint8Array(map.width * map.height)
  for (const k of keys) {
    const [col, row] = k.split(',').map(Number)
    if (col! >= 0 && row! >= 0 && col! < map.width && row! < map.height)
      bits[row! * map.width + col!] = 1
  }
  return encodeBits(bits)
}
