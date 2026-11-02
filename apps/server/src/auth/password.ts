import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64
const COST = 16384

function derive(password: string, salt: Buffer, cost: number) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, KEY_LENGTH, { N: cost, r: 8, p: 1 }, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  )
}

/** Hash as `scrypt$<cost>$<salt>$<key>` (base64) */
export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const key = await derive(password, salt, COST)
  return `scrypt$${COST}$${salt.toString('base64')}$${key.toString('base64')}`
}

export async function verifyPassword(password: string, stored: string) {
  const [algo, cost, salt, key] = stored.split('$')
  if (algo !== 'scrypt' || !cost || !salt || !key) return false
  const expected = Buffer.from(key, 'base64')
  const actual = await derive(password, Buffer.from(salt, 'base64'), Number(cost))
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
