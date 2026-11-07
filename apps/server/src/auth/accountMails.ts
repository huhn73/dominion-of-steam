import { EMAIL_VERIFY_TTL_HOURS, PASSWORD_RESET_TTL_MINUTES } from '@dos/shared/account'
import { DEFAULT_LOCALE, isLocale, translator, type Translate } from '@dos/shared/i18n'
import type { Mailer } from '../notifications/channels'
import { renderMail } from '../notifications/mail'

/** Where players turn when something happened to their account (`SUPPORT_EMAIL`) */
export const supportEmail = () =>
  process.env.SUPPORT_EMAIL ?? fromAddress() ?? 'postmaster@huhn73.de'

const fromAddress = () => /<([^>]+)>/.exec(process.env.MAIL_FROM ?? '')?.[1]

const notYou = (t: Translate) => t('mail.notYou', { support: supportEmail() })

/** Paths of the web app the links point to */
export const RESET_PASSWORD_PATH = '/passwort-zuruecksetzen'
export const FORGOT_PASSWORD_PATH = '/passwort-vergessen'

interface Recipient {
  displayName: string
  email: string
  /** Language of the mail; German if unknown */
  locale?: string
}

/** Translator and layout language for a recipient */
function textsFor(to: Recipient) {
  const locale = isLocale(to.locale) ? to.locale : DEFAULT_LOCALE
  return { locale, t: translator(locale) }
}

/** Welcome and verification link after registration (and on „Erneut senden“) */
export function sendVerification(mail: Mailer, origin: string, to: Recipient, token: string) {
  const { locale, t } = textsFor(to)
  return mail({
    to: to.email,
    ...renderMail({
      title: t('mail.verify.title'),
      name: to.displayName,
      body: [t('mail.verify.body'), t('mail.verify.valid', { hours: EMAIL_VERIFY_TTL_HOURS })],
      cta: {
        label: t('mail.verify.cta'),
        url: `${origin}/api/account/verify?token=${token}`,
      },
      footer: t('mail.accountFooter'),
      locale,
    }),
  })
}

/** Link to set a new password („Passwort vergessen“) */
export function sendPasswordReset(mail: Mailer, origin: string, to: Recipient, token: string) {
  const { locale, t } = textsFor(to)
  return mail({
    to: to.email,
    ...renderMail({
      title: t('mail.reset.title'),
      name: to.displayName,
      body: [t('mail.reset.body'), t('mail.reset.valid', { minutes: PASSWORD_RESET_TTL_MINUTES })],
      cta: {
        label: t('mail.reset.cta'),
        url: `${origin}${RESET_PASSWORD_PATH}?token=${token}`,
      },
      footer: t('mail.accountFooter'),
      locale,
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
  const { locale, t } = textsFor(to)
  return mail({
    to: to.email,
    ...renderMail({
      title: t('mail.change.title'),
      name: to.displayName,
      body: [t('mail.change.body'), t('mail.change.valid', { hours: EMAIL_VERIFY_TTL_HOURS })],
      cta: {
        label: t('mail.verify.cta'),
        url: `${origin}/api/account/email/confirm?token=${token}`,
      },
      footer: t('mail.accountFooter'),
      locale,
    }),
  })
}

/** Notice to the OLD address once an e-mail change took effect */
export function sendEmailChanged(mail: Mailer, origin: string, to: Recipient, newEmail: string) {
  const { locale, t } = textsFor(to)
  return mail({
    to: to.email,
    ...renderMail({
      title: t('mail.changed.title'),
      name: to.displayName,
      body: [t('mail.changed.body', { email: newEmail }), notYou(t)],
      cta: { label: t('mail.resetCta'), url: `${origin}${FORGOT_PASSWORD_PATH}` },
      footer: t('mail.accountFooter'),
      locale,
    }),
  })
}

/** Notice after a password change or reset */
export function sendPasswordChanged(mail: Mailer, origin: string, to: Recipient) {
  const { locale, t } = textsFor(to)
  return mail({
    to: to.email,
    ...renderMail({
      title: t('mail.password.title'),
      name: to.displayName,
      body: [t('mail.password.body'), notYou(t)],
      cta: { label: t('mail.resetCta'), url: `${origin}${FORGOT_PASSWORD_PATH}` },
      footer: t('mail.accountFooter'),
      locale,
    }),
  })
}
