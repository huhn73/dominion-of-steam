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
import { useT } from '../../i18n'

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
  const t = useT()
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
    const found: Errors = Object.fromEntries(
      Object.entries(validateRegistration(form)).map(([field, m]) => [field, t(m.key, m.params)]),
    )
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
              notice: t('auth.register.created', { email: me.email }),
            },
      })
    } catch (err) {
      const field = err instanceof ApiRequestError ? FIELD_OF_CODE[err.code] : undefined
      if (field) setErrors({ [field]: (err as ApiRequestError).message })
      else setServerError(err instanceof ApiRequestError ? err.message : t('common.api.unknown'))
      setBusy(false)
    }
  }

  const loginHref =
    next === routes.lobby ? routes.login : `${routes.login}?weiter=${encodeURIComponent(next)}`

  return (
    <AuthLayout
      title={t('auth.register.title')}
      footer={
        <>
          {t('auth.register.haveAccount')}{' '}
          <Link to={loginHref} className={linkClass}>
            {t('auth.register.toLogin')}
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={submit} className="space-y-5">
        <FormError message={serverError} />
        <Field
          id="displayName"
          label={t('auth.name')}
          autoComplete="nickname"
          autoFocus
          maxLength={DISPLAY_NAME_MAX + 10}
          value={form.displayName}
          onChange={update('displayName')}
          error={errors.displayName}
          hint={t('auth.register.nameHint', { min: DISPLAY_NAME_MIN, max: DISPLAY_NAME_MAX })}
        />
        <Field
          id="email"
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          inputMode="email"
          value={form.email}
          onChange={update('email')}
          error={errors.email}
        />
        <Field
          id="password"
          label={t('auth.password')}
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
          hint={t('auth.register.passwordHint', { min: PASSWORD_MIN })}
        />
        <SubmitButton busy={busy} label={t('auth.register.submit')} busyLabel={t('auth.register.busy')} />
      </form>
    </AuthLayout>
  )
}
