import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import {
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_MIN,
  PASSWORD_MIN,
  type RegisterRequest,
  validateRegistration,
} from '@dos/shared/account'
import { ApiRequestError } from '../../data/api'
import { safeNext, useAuthActions, useMe } from '../../data/session'
import { routes } from '../../routes'
import { AuthLayout, Field, FormError, linkClass, SubmitButton } from './AuthLayout'

type Errors = Partial<Record<keyof RegisterRequest, string>>

/** Server errors that belong to a field */
const FIELD_OF_CODE: Record<string, keyof RegisterRequest> = {
  EMAIL_TAKEN: 'email',
  NAME_TAKEN: 'displayName',
}

export function RegisterPage() {
  const [params] = useSearchParams()
  const next = safeNext(params.get('weiter'))
  const navigate = useNavigate()
  const { data: me } = useMe()
  const { register } = useAuthActions()
  const [form, setForm] = useState<RegisterRequest>({ displayName: '', email: '', password: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (me && !busy) return <Navigate to={next} replace />

  const update = (field: keyof RegisterRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value })
    setErrors({ ...errors, [field]: undefined })
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found = validateRegistration(form)
    setErrors(found)
    setServerError(null)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      const me = await register(form)
      await navigate(next, {
        replace: true,
        state: me.emailVerified
          ? null
          : {
              notice: `Konto angelegt. Wir haben dir eine Bestätigungsmail an ${me.email} geschickt.`,
            },
      })
    } catch (err) {
      const field = err instanceof ApiRequestError ? FIELD_OF_CODE[err.code] : undefined
      if (field) setErrors({ [field]: (err as ApiRequestError).message })
      else setServerError(err instanceof ApiRequestError ? err.message : 'Unbekannter Fehler.')
      setBusy(false)
    }
  }

  const loginHref =
    next === routes.lobby ? routes.login : `${routes.login}?weiter=${encodeURIComponent(next)}`

  return (
    <AuthLayout
      title="Konto anlegen"
      footer={
        <>
          Schon registriert?{' '}
          <Link to={loginHref} className={linkClass}>
            Zur Anmeldung
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={submit} className="space-y-5">
        <FormError message={serverError} />
        <Field
          id="displayName"
          label="Name"
          autoComplete="nickname"
          autoFocus
          maxLength={DISPLAY_NAME_MAX + 10}
          value={form.displayName}
          onChange={update('displayName')}
          error={errors.displayName}
          hint={`So sehen dich deine Mitspieler; ${DISPLAY_NAME_MIN} bis ${DISPLAY_NAME_MAX} Zeichen.`}
        />
        <Field
          id="email"
          label="E-Mail-Adresse"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={form.email}
          onChange={update('email')}
          error={errors.email}
        />
        <Field
          id="password"
          label="Passwort"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
          hint={`Mindestens ${PASSWORD_MIN} Zeichen.`}
        />
        <SubmitButton busy={busy} label="Registrieren" busyLabel="Lege Konto an …" />
      </form>
    </AuthLayout>
  )
}
