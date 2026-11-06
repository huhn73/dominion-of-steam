// Konten, Anmeldung und Freunde: gemeinsame Typen und Regeln für Client und Server

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

export const DISPLAY_NAME_MIN = 3
export const DISPLAY_NAME_MAX = 24
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

/** German validation messages per field; empty object when valid */
export function validateRegistration(input: {
  displayName: string
  email: string
  password: string
}): Partial<Record<keyof RegisterRequest, string>> {
  const errors: Partial<Record<keyof RegisterRequest, string>> = {}
  const name = input.displayName.trim()
  if (name.length < DISPLAY_NAME_MIN || name.length > DISPLAY_NAME_MAX)
    errors.displayName = `Der Name muss ${DISPLAY_NAME_MIN} bis ${DISPLAY_NAME_MAX} Zeichen lang sein.`
  const emailError = validateEmail(input.email)
  if (emailError) errors.email = emailError
  const passwordError = validatePassword(input.password)
  if (passwordError) errors.password = passwordError
  return errors
}

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN)
    return `Das Passwort muss mindestens ${PASSWORD_MIN} Zeichen lang sein.`
  if (password.length > PASSWORD_MAX) return 'Das Passwort ist zu lang.'
  return null
}

export function validateEmail(email: string): string | null {
  const e = normalizeEmail(email)
  if (!e) return 'Bitte gib deine E-Mail-Adresse ein.'
  if (e.length > 254 || !EMAIL_PATTERN.test(e)) return 'Bitte gib eine gültige E-Mail-Adresse ein.'
  return null
}
