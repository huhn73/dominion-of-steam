import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { PASSWORD_MIN, validatePassword } from '@dos/shared/account'
import { ApiRequestError } from '../../data/api'
import { useAuthActions } from '../../data/session'
import { routes } from '../../routes'
import { AuthLayout, Field, FormError, linkClass, SubmitButton } from './AuthLayout'

/** Target of the reset link (`?token=`): sets a new password and logs the player in */
export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const { resetPassword } = useAuthActions()
  const [form, setForm] = useState({ password: '', repeat: '' })
  const [errors, setErrors] = useState<{ password?: string; repeat?: string }>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value })
    setErrors({ ...errors, [field]: undefined })
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found: typeof errors = {}
    const invalid = validatePassword(form.password)
    if (invalid) found.password = invalid
    else if (form.repeat !== form.password) found.repeat = 'Die Passwörter stimmen nicht überein.'
    setErrors(found)
    setServerError(null)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      await resetPassword(token, form.password)
      await navigate(routes.lobby, {
        replace: true,
        state: {
          notice: 'Passwort geändert. Du bist angemeldet, andere Geräte wurden abgemeldet.',
        },
      })
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : 'Unbekannter Fehler.')
      setBusy(false)
    }
  }

  const requestAgain = (
    <Link to={routes.forgotPassword} className={linkClass}>
      Neuen Link anfordern
    </Link>
  )

  return (
    <AuthLayout
      title="Neues Passwort"
      footer={
        <Link to={routes.login} className={linkClass}>
          Zurück zur Anmeldung
        </Link>
      }
    >
      {!token ? (
        <div className="space-y-4">
          <FormError message="Der Link ist unvollständig. Fordere einen neuen an." />
          {requestAgain}
        </div>
      ) : (
        <form noValidate onSubmit={submit} className="space-y-5">
          <FormError message={serverError} />
          {serverError && requestAgain}
          <Field
            id="password"
            label="Neues Passwort"
            type="password"
            autoComplete="new-password"
            autoFocus
            value={form.password}
            onChange={update('password')}
            error={errors.password}
            hint={`Mindestens ${PASSWORD_MIN} Zeichen.`}
          />
          <Field
            id="repeat"
            label="Passwort wiederholen"
            type="password"
            autoComplete="new-password"
            value={form.repeat}
            onChange={update('repeat')}
            error={errors.repeat}
          />
          <SubmitButton busy={busy} label="Passwort speichern" busyLabel="Speichere …" />
        </form>
      )}
    </AuthLayout>
  )
}
