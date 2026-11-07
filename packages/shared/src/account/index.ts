// Konten, Anmeldung und Freunde: gemeinsame Typen und Regeln für Client und Server
import type { Locale } from '../i18n/locale'
import type { Message } from '../i18n'
import { validateDisplayName } from './names'

/** Logged-in player as returned by `GET /api/me` */
export interface Me {
  id: string
  name: string
  avatarUrl: string | null
  email: string
  /** false until the player opened the link of the verification e-mail */
  emailVerified: boolean
  /** Sees the usage overview (`ADMIN_EMAILS` on the server) */
  isAdmin: boolean
  /** Newest version whose news the player has seen (hint „Neuigkeiten“); null shows none */
  newsSeenVersion: string | null
  /** Language of the game, e-mails and notifications */
  locale: Locale
}

export type PresenceStatus = 'online' | 'inGame' | 'offline'

/** Same shape as `Friend` in product-plan/sections/partie-setup-and-ki-gegner/types.ts */
export interface Friend {
  id: string
  name: string
  avatarUrl: string | null
  status: PresenceStatus
  /** ISO timestamp, only for offline friends */
  lastSeen: string | null
}

export interface RegisterRequest {
  displayName: string
  email: string
  password: string
  /** Browser language; German if missing */
  locale?: Locale
}

export interface LoginRequest {
  email: string
  password: string
}

/** `POST /api/auth/forgot` */
export interface ForgotPasswordRequest {
  email: string
}

/** `POST /api/auth/reset` */
export interface ResetPasswordRequest {
  token: string
  password: string
}

export {
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_MIN,
  nameProblem,
  normalizeName,
  validateDisplayName,
} from './names'
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 200

/** Verification links (registration, e-mail change) are valid this long */
export const EMAIL_VERIFY_TTL_HOURS = 24
/** Password reset links are valid this long */
export const PASSWORD_RESET_TTL_MINUTES = 60
/** Minimum distance between two account e-mails (verification, reset) to the same player */
export const ACCOUNT_MAIL_COOLDOWN_MINUTES = 2

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

/** Validation messages per field; empty object when valid */
export function validateRegistration(input: {
  displayName: string
  email: string
  password: string
}): Partial<Record<'displayName' | 'email' | 'password', Message>> {
  const errors: Partial<Record<'displayName' | 'email' | 'password', Message>> = {}
  const nameError = validateDisplayName(input.displayName)
  if (nameError) errors.displayName = nameError
  const emailError = validateEmail(input.email)
  if (emailError) errors.email = emailError
  const passwordError = validatePassword(input.password)
  if (passwordError) errors.password = passwordError
  return errors
}

export function validatePassword(password: string): Message | null {
  if (password.length < PASSWORD_MIN)
    return { key: 'account.passwordShort', params: { min: PASSWORD_MIN } }
  if (password.length > PASSWORD_MAX) return { key: 'account.passwordLong' }
  return null
}

export function validateEmail(email: string): Message | null {
  const e = normalizeEmail(email)
  if (!e) return { key: 'account.emailMissing' }
  if (e.length > 254 || !EMAIL_PATTERN.test(e)) return { key: 'account.emailInvalid' }
  return null
}
