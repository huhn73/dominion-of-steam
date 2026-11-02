const SEED_WORDS = [
  'KOHLE',
  'DAMPF',
  'RUSS',
  'NIETE',
  'KESSEL',
  'MESSING',
  'SCHLOT',
  'ANKER',
  'FUNKE',
  'BOLZEN',
]

/** Map code in the format of the setup wizard, e.g. "KOHLE-4417" */
export function randomSeed(rng: () => number = Math.random) {
  return `${SEED_WORDS[Math.floor(rng() * SEED_WORDS.length)]}-${1000 + Math.floor(rng() * 9000)}`
}

/** Allowed map codes: A–Z, 0–9 and "-", 1 to 16 characters (as the wizard's input enforces) */
export const SEED_PATTERN = /^[A-Z0-9-]{1,16}$/
