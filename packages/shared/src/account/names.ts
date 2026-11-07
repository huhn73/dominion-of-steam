import type { Message } from '../i18n'
import { AI_PERSONALITIES } from '../setup/data'

export const DISPLAY_NAME_MIN = 3
export const DISPLAY_NAME_MAX = 24

const LEET: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '!': 'i',
  '|': 'i',
  '3': 'e',
  '4': 'a',
  '@': 'a',
  '5': 's',
  $: 's',
  '7': 't',
  '8': 'b',
}

/**
 * Name reduced for comparisons: lower case, umlauts spelled out, leetspeak read as letters and
 * everything but a–z dropped („H1tl3r_88“ → „hitlerb“, „Ärsch-Loch“ → „aerschloch“).
 */
export function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[0-9!|@$]/g, (c) => LEET[c] ?? '')
    .replace(/[^a-z]/g, '')
}

/** Names nobody may take: roles of the game and the AI commanders (the whole name counts) */
const RESERVED = [
  'admin',
  'administrator',
  'moderator',
  'mod',
  'system',
  'support',
  'dominion',
  'dominionofsteam',
  'ki',
  'ai',
  'server',
  'root',
  'gast',
  'guest',
  'unbekannt',
  'unknown',
  'manoeverleitung',
]

/** Insults, slurs and Nazi terms, matched anywhere in the normalized name */
const BLOCKED_PARTS = [
  'arschloch',
  'arschgeige',
  'fick',
  'fotze',
  'wichser',
  'wixer',
  'hurensohn',
  'hure',
  'schlampe',
  'missgeburt',
  'spast',
  'mongo',
  'schwuchtel',
  'kanake',
  'neger',
  'nigger',
  'nigga',
  'judensau',
  'kinderschaender',
  'vergewaltig',
  'paedo',
  'pedo',
  'hitler',
  'nazi',
  'siegheil',
  'holocaust',
  'auschwitz',
  'fuck',
  'cunt',
  'bitch',
  'whore',
  'slut',
  'faggot',
  'retard',
  'rapist',
  'kike',
  'shit',
  'scheisse',
  'wanker',
  'porn',
]

/** Harmless names that contain a blocked part */
const ALLOWED = ['pedometer', 'pedone', 'torpedo', 'speedo', 'mongolei', 'mongolia', 'mongoose']

const reservedNames = () =>
  new Set([...RESERVED, ...AI_PERSONALITIES.map((p) => normalizeName(p.name))])

/** Why a display name is not allowed (reserved or offensive), or null */
export function nameProblem(name: string): Message | null {
  const n = normalizeName(name)
  if (reservedNames().has(n)) return { key: 'account.nameReserved' }
  const checked = ALLOWED.reduce((rest, ok) => rest.replaceAll(ok, ''), n)
  if (BLOCKED_PARTS.some((part) => checked.includes(part))) return { key: 'account.nameBlocked' }
  return null
}

/** Rules for display names at registration and in „Profil bearbeiten“ (after trim) */
export function validateDisplayName(name: string): Message | null {
  const n = name.trim()
  if (n.length < DISPLAY_NAME_MIN || n.length > DISPLAY_NAME_MAX)
    return { key: 'account.nameLength', params: { min: DISPLAY_NAME_MIN, max: DISPLAY_NAME_MAX } }
  return nameProblem(n)
}
