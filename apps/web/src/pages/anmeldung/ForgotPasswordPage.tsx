import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { PASSWORD_RESET_TTL_MINUTES, validateEmail } from '@dos/shared/account'
import { ApiRequestError } from '../../data/api'
import { useAuthActions } from '../../data/session'
import { routes } from '../../routes'
import { AuthLayout, Field, FormError, linkClass, SubmitButton } from './AuthLayout'
import { Rich, useT } from '../../i18n'

/** „Passwort vergessen“: asks for the address and sends a reset link */
export function ForgotPasswordPage() {
  // E-mail typed on the login page comes along
  const prefill = (useLocation().state as { email?: string } | null)?.email ?? ''
  const { forgotPassword } = useAuthActions()
  const t = useT()
  const [email, setEmail] = useState(prefill)
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [serverError, setServerError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const invalid = validateEmail(email)
    setFieldError(invalid ? t(invalid.key, invalid.params) : undefined)
    setServerError(null)
    if (invalid) return
    setBusy(true)
    try {
      await forgotPassword(email)
      setSentTo(email.trim())
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : t('common.api.unknown'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title={t('auth.forgot.title')}
      footer={
        <Link to={routes.login} className={linkClass}>
          {t('auth.backToLogin')}
        </Link>
      }
    >
      {sentTo ? (
        <p
          role="status"
          className="rounded-md border border-teal-500/60 bg-teal-50 px-3 py-3 text-sm text-teal-900 dark:bg-teal-950/60 dark:text-teal-100"
        >
          <Rich
            text={t('auth.forgot.sent', { minutes: PASSWORD_RESET_TTL_MINUTES })}
            email={<strong>{sentTo}</strong>}
          />
        </p>
      ) : (
        <form noValidate onSubmit={submit} className="space-y-5">
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {t('auth.forgot.intro')}
          </p>
          <FormError message={serverError} />
          <Field
            id="email"
            label={t('auth.email')}
            type="email"
            autoComplete="email"
            inputMode="email"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setFieldError(undefined)
            }}
            error={fieldError}
          />
          <SubmitButton busy={busy} label={t('auth.forgot.submit')} busyLabel={t('auth.forgot.busy')} />
        </form>
      )}
    </AuthLayout>
  )
}
