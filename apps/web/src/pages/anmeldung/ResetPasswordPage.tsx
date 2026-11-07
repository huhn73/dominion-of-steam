import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { PASSWORD_MIN, validatePassword } from '@dos/shared/account'
import { ApiRequestError } from '../../data/api'
import { useAuthActions } from '../../data/session'
import { routes } from '../../routes'
import { AuthLayout, Field, FormError, linkClass, SubmitButton } from './AuthLayout'
import { useT } from '../../i18n'

/** Target of the reset link (`?token=`): sets a new password and logs the player in */
export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const t = useT()
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
    if (invalid) found.password = t(invalid.key, invalid.params)
    else if (form.repeat !== form.password) found.repeat = t('auth.reset.mismatch')
    setErrors(found)
    setServerError(null)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      await resetPassword(token, form.password)
      await navigate(routes.lobby, {
        replace: true,
        state: {
          notice: t('auth.reset.done'),
        },
      })
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : t('common.api.unknown'))
      setBusy(false)
    }
  }

  const requestAgain = (
    <Link to={routes.forgotPassword} className={linkClass}>
      {t('auth.reset.requestAgain')}
    </Link>
  )

  return (
    <AuthLayout
      title={t('auth.reset.title')}
      footer={
        <Link to={routes.login} className={linkClass}>
          {t('auth.backToLogin')}
        </Link>
      }
    >
      {!token ? (
        <div className="space-y-4">
          <FormError message={t('auth.reset.incomplete')} />
          {requestAgain}
        </div>
      ) : (
        <form noValidate onSubmit={submit} className="space-y-5">
          <FormError message={serverError} />
          {serverError && requestAgain}
          <Field
            id="password"
            label={t('auth.reset.newPassword')}
            type="password"
            autoComplete="new-password"
            autoFocus
            value={form.password}
            onChange={update('password')}
            error={errors.password}
            hint={t('auth.register.passwordHint', { min: PASSWORD_MIN })}
          />
          <Field
            id="repeat"
            label={t('auth.reset.repeat')}
            type="password"
            autoComplete="new-password"
            value={form.repeat}
            onChange={update('repeat')}
            error={errors.repeat}
          />
          <SubmitButton busy={busy} label={t('auth.reset.submit')} busyLabel={t('auth.reset.busy')} />
        </form>
      )}
    </AuthLayout>
  )
}
