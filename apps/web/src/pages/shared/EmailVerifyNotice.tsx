import { useState } from 'react'
import { Link } from 'react-router'
import { MailWarning } from 'lucide-react'
import { useAccountActions } from '../../data/profile'
import { useMe } from '../../data/session'
import { routes } from '../../routes'
import { Rich, useT } from '../../i18n'

/**
 * Reminder for players who have not opened their verification link yet: without it no e-mails
 * are sent. Shown in the lobby; „Erneut senden“ requests a fresh link.
 */
export function EmailVerifyNotice({
  onInfo,
  onError,
}: {
  onInfo: (text: string) => void
  onError: (e: unknown) => void
}) {
  const t = useT()
  const { data: me } = useMe()
  const { resendVerification } = useAccountActions()
  const [busy, setBusy] = useState(false)
  if (!me || me.emailVerified) return null

  const resend = async () => {
    setBusy(true)
    try {
      const result = await resendVerification()
      onInfo(
        result.alreadyVerified
          ? t('common.verify.already')
          : t('common.verify.sent'),
      )
    } catch (e) {
      onError(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="region"
      aria-label={t('common.verify.region')}
      className="mx-auto mt-6 flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border-2 border-amber-400 bg-amber-50 px-4 py-3 font-['Barlow'] text-stone-900 dark:border-amber-600 dark:bg-amber-950/40 dark:text-stone-100 sm:mx-6"
    >
      <MailWarning className="size-6 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
      <p className="min-w-0 flex-1 basis-64 text-sm">
        <Rich text={t('common.verify.text')} email={<strong className="break-all">{me.email}</strong>} />
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void resend()}
          disabled={busy}
          className="min-h-11 rounded-lg bg-amber-500 px-4 font-semibold text-stone-950 hover:bg-amber-400 disabled:opacity-60"
        >
          {busy ? t('common.verify.sending') : t('common.verify.resend')}
        </button>
        <Link
          to={routes.settings}
          className="inline-flex min-h-11 items-center rounded-lg border-2 border-stone-300 px-4 font-semibold hover:border-teal-500 dark:border-stone-700"
        >
          {t('common.verify.change')}
        </Link>
      </div>
    </div>
  )
}
