import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import { validateEmail } from '@dos/shared/account'
import { ApiRequestError } from '../../data/api'
import { safeNext, useAuthActions, useMe } from '../../data/session'
import { routes } from '../../routes'
import { AuthLayout, Field, FormError, linkClass, SubmitButton } from './AuthLayout'
import { useT } from '../../i18n'

type Errors = { email?: string; password?: string }

export function LoginPage() {
  const [params] = useSearchParams()
  const next = safeNext(params.get('weiter'))
  const navigate = useNavigate()
  const t = useT()
  // Hinweis nach „Konto löschen“ oder „Auf allen Geräten abmelden“
  const notice = (useLocation().state as { notice?: string } | null)?.notice
  const { data: me } = useMe()
  const { login } = useAuthActions()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (me && !busy) return <Navigate to={next} replace />

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value })
    setErrors({ ...errors, [field]: undefined })
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found: Errors = {}
    const emailError = validateEmail(form.email)
    if (emailError) found.email = t(emailError.key, emailError.params)
    if (!form.password) found.password = t('auth.login.passwordMissing')
    setErrors(found)
    setServerError(null)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      await login(form)
      await navigate(next, { replace: true })
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : t('common.api.unknown'))
      setBusy(false)
    }
  }

  const registerHref =
    next === routes.lobby
      ? routes.register
      : `${routes.register}?weiter=${encodeURIComponent(next)}`

  return (
    <AuthLayout
      title={t('auth.login.title')}
      footer={
        <>
          {t('auth.login.noAccount')}{' '}
          <Link to={registerHref} className={linkClass}>
            {t('auth.login.register')}
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={submit} className="space-y-5">
        {notice && !serverError && (
          <p
            role="status"
            className="rounded-md border border-teal-500/60 bg-teal-50 px-3 py-2 text-sm text-teal-900 dark:bg-teal-950/60 dark:text-teal-100"
          >
            {notice}
          </p>
        )}
        <FormError message={serverError} />
        <Field
          id="email"
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          inputMode="email"
          autoFocus
          value={form.email}
          onChange={update('email')}
          error={errors.email}
        />
        <Field
          id="password"
          label={t('auth.password')}
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
        />
        <div className="-mt-2 text-right text-sm">
          <Link to={routes.forgotPassword} state={{ email: form.email }} className={linkClass}>
            {t('auth.login.forgot')}
          </Link>
        </div>
        <SubmitButton busy={busy} label={t('auth.login.submit')} busyLabel={t('auth.login.busy')} />
      </form>
    </AuthLayout>
  )
}
