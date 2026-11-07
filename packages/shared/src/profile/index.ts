// Spielerprofil & Einstellungen: Datentypen der Übergabe, Vorgaben, Prüfregeln und API-Formen
import { DISPLAY_NAME_MAX, DISPLAY_NAME_MIN } from '../account'
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  EMAIL_DELAY_HOURS,
  NOTIFICATION_EVENTS,
  notificationSettingsOf,
} from '../notifications'
import type {
  Account,
  ControlSettings,
  DisplaySettings,
  Faction,
  FactionStat,
  HistoryEntry,
  PlayerStats,
  Profile,
  Settings,
  SoundSettings,
} from './types'

export type * from './types'

// =============================================================================
// Vorgaben
// =============================================================================

/**
 * Settings of a player who has not saved any yet. Notifications follow the server defaults of
 * milestone 05 (`DEFAULT_NOTIFICATION_SETTINGS`); display, sound and controls the sample data
 * of the handoff.
 */
export const DEFAULT_SETTINGS: Settings = {
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  display: {
    theme: 'system',
    reduceMotion: false,
    combatAnimations: true,
    autoplayReplay: true,
    turnReport: true,
  },
  sound: { muted: false, master: 80, effects: 70, music: 40, ambience: 55 },
  controls: { rightClick: 'cancel', confirmEndTurn: true, dragUnits: true, zoomSensitivity: 50 },
}

const THEMES: DisplaySettings['theme'][] = ['light', 'dark', 'system']
const RIGHT_CLICK: ControlSettings['rightClick'][] = ['cancel', 'contextMenu']
const VOLUMES: (keyof Omit<SoundSettings, 'muted'>)[] = ['master', 'effects', 'music', 'ambience']

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isPercent = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100

/**
 * Settings from `players.settings`, merged field by field with the defaults, so partial,
 * older or damaged settings keep working.
 */
export function settingsOf(raw: unknown): Settings {
  const s = isObject(raw) ? raw : {}
  const d = isObject(s.display) ? s.display : {}
  const so = isObject(s.sound) ? s.sound : {}
  const c = isObject(s.controls) ? s.controls : {}
  const def = DEFAULT_SETTINGS
  const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback)
  return {
    notifications: notificationSettingsOf(s),
    display: {
      theme: THEMES.includes(d.theme as never)
        ? (d.theme as DisplaySettings['theme'])
        : def.display.theme,
      reduceMotion: bool(d.reduceMotion, def.display.reduceMotion),
      combatAnimations: bool(d.combatAnimations, def.display.combatAnimations),
      autoplayReplay: bool(d.autoplayReplay, def.display.autoplayReplay),
      turnReport: bool(d.turnReport, def.display.turnReport),
    },
    sound: {
      muted: bool(so.muted, def.sound.muted),
      master: isPercent(so.master) ? so.master : def.sound.master,
      effects: isPercent(so.effects) ? so.effects : def.sound.effects,
      music: isPercent(so.music) ? so.music : def.sound.music,
      ambience: isPercent(so.ambience) ? so.ambience : def.sound.ambience,
    },
    controls: {
      rightClick: RIGHT_CLICK.includes(c.rightClick as never)
        ? (c.rightClick as ControlSettings['rightClick'])
        : def.controls.rightClick,
      confirmEndTurn: bool(c.confirmEndTurn, def.controls.confirmEndTurn),
      dragUnits: bool(c.dragUnits, def.controls.dragUnits),
      zoomSensitivity: isPercent(c.zoomSensitivity)
        ? c.zoomSensitivity
        : def.controls.zoomSensitivity,
    },
  }
}

/**
 * Check a complete `Settings` object (`PUT /api/settings`). Returns the cleaned settings
 * (unknown keys dropped) or a German error message naming the first invalid field.
 */
export function validateSettings(input: unknown): { settings: Settings } | { error: string } {
  const fail = (field: string) => ({ error: `Ungültige Einstellung: ${field}` })
  if (!isObject(input)) return fail('settings')
  const { notifications: n, display: d, sound: s, controls: c } = input
  if (!isObject(n)) return fail('notifications')
  for (const event of NOTIFICATION_EVENTS) {
    const t = n[event]
    if (!isObject(t) || typeof t.push !== 'boolean' || typeof t.email !== 'boolean')
      return fail(`notifications.${event}`)
  }
  if (!EMAIL_DELAY_HOURS.includes(n.emailDelayHours as never))
    return fail('notifications.emailDelayHours')
  if (!isObject(d)) return fail('display')
  if (!THEMES.includes(d.theme as never)) return fail('display.theme')
  for (const key of ['reduceMotion', 'combatAnimations', 'autoplayReplay', 'turnReport'] as const)
    if (typeof d[key] !== 'boolean') return fail(`display.${key}`)
  if (!isObject(s)) return fail('sound')
  if (typeof s.muted !== 'boolean') return fail('sound.muted')
  for (const key of VOLUMES) if (!isPercent(s[key])) return fail(`sound.${key}`)
  if (!isObject(c)) return fail('controls')
  if (!RIGHT_CLICK.includes(c.rightClick as never)) return fail('controls.rightClick')
  for (const key of ['confirmEndTurn', 'dragUnits'] as const)
    if (typeof c[key] !== 'boolean') return fail(`controls.${key}`)
  if (!isPercent(c.zoomSensitivity)) return fail('controls.zoomSensitivity')
  // All fields are valid: settingsOf copies exactly the known fields
  return { settings: settingsOf(input) }
}

// =============================================================================
// Profil
// =============================================================================

/** Same rule as the dialog „Profil bearbeiten“ (after trim) */
export function validateDisplayName(name: string): string | null {
  const n = name.trim()
  if (n.length < DISPLAY_NAME_MIN || n.length > DISPLAY_NAME_MAX)
    return `Der Name muss ${DISPLAY_NAME_MIN} bis ${DISPLAY_NAME_MAX} Zeichen lang sein.`
  return null
}

/** Entries of the match history per page (`limit`, at most `HISTORY_PAGE_MAX`) */
export const HISTORY_PAGE_SIZE = 10
export const HISTORY_PAGE_MAX = 50

/** Avatar upload: formats and size */
export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const
/** Original upload; the server stores a 256×256 WebP of a few KB */
export const AVATAR_MAX_BYTES = 10 * 1024 * 1024

/** E-mail change links are valid this long */
export const EMAIL_CHANGE_TTL_HOURS = 24

/** `GET /api/profile?limit&cursor` (props of `Profil` plus the cursor of the next page) */
export interface ProfileData {
  profile: Profile
  stats: PlayerStats
  factionStats: FactionStat[]
  /** One page of the history, newest first */
  history: HistoryEntry[]
  hasMoreHistory: boolean
  /** Pass as `cursor` to load the next page; null on the last page */
  nextCursor: string | null
  factions: Faction[]
}

/** `GET /api/settings` (`PUT` answers the same shape) */
export interface SettingsData {
  settings: Settings
  account: Account
  displayName: string
}

/** `PATCH /api/profile` */
export interface UpdateProfileRequest {
  displayName: string
}

/** `POST /api/account/email` */
export interface ChangeEmailRequest {
  email: string
  currentPassword: string
}

/** `POST /api/account/password` */
export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}
