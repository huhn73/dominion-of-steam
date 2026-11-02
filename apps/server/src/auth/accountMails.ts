import { EMAIL_VERIFY_TTL_HOURS, PASSWORD_RESET_TTL_MINUTES } from '@dos/shared/account'
import type { Mailer } from '../notifications/channels'
import { renderMail } from '../notifications/mail'

/** Where players turn when something happened to their account (`SUPPORT_EMAIL`) */
export const supportEmail = () =>
  process.env.SUPPORT_EMAIL ?? fromAddress() ?? 'postmaster@huhn73.de'

const fromAddress = () => /<([^>]+)>/.exec(process.env.MAIL_FROM ?? '')?.[1]

const ACCOUNT_FOOTER =
  'Du bekommst diese E-Mail, weil zu dieser Adresse ein Konto bei Dominion of Steam gehört.'

const notYou = () =>
  `Wenn du das nicht warst, setze sofort dein Passwort zurück und schreib uns an ${supportEmail()}.`

/** Paths of the web app the links point to */
export const RESET_PASSWORD_PATH = '/passwort-zuruecksetzen'
export const FORGOT_PASSWORD_PATH = '/passwort-vergessen'

interface Recipient {
  displayName: string
  email: string
}

/** Welcome and verification link after registration (and on „Erneut senden“) */
export function sendVerification(mail: Mailer, origin: string, to: Recipient, token: string) {
  return mail({
    to: to.email,
    ...renderMail({
      title: 'Willkommen bei Dominion of Steam',
      name: to.displayName,
      body: [
        'schön, dass du dabei bist. Bitte bestätige deine E-Mail-Adresse, damit wir dich benachrichtigen können, wenn du am Zug bist oder eine Einladung bekommst.',
        `Der Link ist ${EMAIL_VERIFY_TTL_HOURS} Stunden gültig. Wenn du dich nicht registriert hast, ignoriere diese E-Mail.`,
      ],
      cta: {
        label: 'E-Mail-Adresse bestätigen',
        url: `${origin}/api/account/verify?token=${token}`,
      },
      footer: ACCOUNT_FOOTER,
    }),
  })
}

/** Link to set a new password („Passwort vergessen“) */
export function sendPasswordReset(mail: Mailer, origin: string, to: Recipient, token: string) {
  return mail({
    to: to.email,
    ...renderMail({
      title: 'Neues Passwort für Dominion of Steam',
      name: to.displayName,
      body: [
        'du hast ein neues Passwort angefordert. Über den Link legst du es fest; danach sind alle anderen Geräte abgemeldet.',
        `Der Link ist ${PASSWORD_RESET_TTL_MINUTES} Minuten gültig. Wenn du das nicht warst, ignoriere diese E-Mail; dein Passwort bleibt unverändert.`,
      ],
      cta: {
        label: 'Neues Passwort festlegen',
        url: `${origin}${RESET_PASSWORD_PATH}?token=${token}`,
      },
      footer: ACCOUNT_FOOTER,
    }),
  })
}

/** Confirmation link for a new address (e-mail change) */
export function sendEmailChangeConfirmation(
  mail: Mailer,
  origin: string,
  to: Recipient,
  token: string,
) {
  return mail({
    to: to.email,
    ...renderMail({
      title: 'Bestätige deine neue E-Mail-Adresse',
      name: to.displayName,
      body: [
        'bitte bestätige deine neue E-Mail-Adresse für Dominion of Steam. Erst dann gilt sie für dein Konto.',
        `Der Link ist ${EMAIL_VERIFY_TTL_HOURS} Stunden gültig. Wenn du die Änderung nicht angefordert hast, ignoriere diese E-Mail.`,
      ],
      cta: {
        label: 'E-Mail-Adresse bestätigen',
        url: `${origin}/api/account/email/confirm?token=${token}`,
      },
      footer: ACCOUNT_FOOTER,
    }),
  })
}

/** Notice to the OLD address once an e-mail change took effect */
export function sendEmailChanged(mail: Mailer, origin: string, to: Recipient, newEmail: string) {
  return mail({
    to: to.email,
    ...renderMail({
      title: 'Deine E-Mail-Adresse wurde geändert',
      name: to.displayName,
      body: [
        `die E-Mail-Adresse deines Kontos bei Dominion of Steam ist jetzt ${newEmail}. An diese Adresse hier schicken wir künftig nichts mehr.`,
        notYou(),
      ],
      cta: { label: 'Passwort zurücksetzen', url: `${origin}${FORGOT_PASSWORD_PATH}` },
      footer: ACCOUNT_FOOTER,
    }),
  })
}

/** Notice after a password change or reset */
export function sendPasswordChanged(mail: Mailer, origin: string, to: Recipient) {
  return mail({
    to: to.email,
    ...renderMail({
      title: 'Dein Passwort wurde geändert',
      name: to.displayName,
      body: [
        'das Passwort deines Kontos bei Dominion of Steam wurde gerade geändert. Alle anderen Geräte sind abgemeldet.',
        notYou(),
      ],
      cta: { label: 'Passwort zurücksetzen', url: `${origin}${FORGOT_PASSWORD_PATH}` },
      footer: ACCOUNT_FOOTER,
    }),
  })
}
