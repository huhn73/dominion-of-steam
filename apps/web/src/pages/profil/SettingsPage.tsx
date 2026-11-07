import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import type { Settings } from '@dos/shared/profile'
import { Einstellungen } from '../../sections/profil/components'
import { settingsKey, useAccountActions, useSettings, useSettingsActions } from '../../data/profile'
import { PUSH_NO_PROMPT_HINT, unsubscribePush, usePushPermission } from '../../data/push'
import { meKey, useChangeLocale, useLogout, useSignOut } from '../../data/session'
import { useLocale, useT } from '../../i18n'
import { routes } from '../../routes'
import { Toast, useToast } from '../shared/toast'
import { useAudio } from '../../audio/AudioProvider'
import { PageState } from './PageState'
import type { MessageKey } from '@dos/shared/i18n'

/** Sliders report every step; the request waits until the player pauses */
export const SETTINGS_SAVE_DELAY_MS = 400

/** Result of the e-mail confirmation link (`?email=…`, set by the server redirect) */
const EMAIL_RESULT: Record<string, { kind: 'info' | 'error'; text: MessageKey }> = {
  bestaetigt: { kind: 'info', text: 'settings.emailConfirmed' },
  verifiziert: { kind: 'info', text: 'settings.emailVerified' },
  ungueltig: { kind: 'error', text: 'settings.linkInvalid' },
  vergeben: { kind: 'error', text: 'settings.emailTaken' },
}

/** Einstellungen („Maschinenraum“) mit Daten aus GET /api/settings */
export function SettingsPage() {
  const { data, error, isPending, refetch } = useSettings()
  const settingsActions = useSettingsActions()
  const account = useAccountActions()
  const push = usePushPermission()
  const logout = useLogout()
  const signOut = useSignOut()
  const toast = useToast()
  const t = useT()
  const { sfx } = useAudio()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { locale } = useLocale()
  const changeLocale = useChangeLocale()
  // Remounts `Einstellungen` with the server state after a failed save
  const [epoch, setEpoch] = useState(0)

  // Hinweis aus dem Bestätigungslink der E-Mail-Änderung
  const [params] = useSearchParams()
  const emailResult = EMAIL_RESULT[params.get('email') ?? '']
  const { setToast } = toast
  useEffect(() => {
    if (!emailResult) return
    setToast({ kind: emailResult.kind, text: t(emailResult.text) })
    if (emailResult.kind === 'info') {
      void queryClient.invalidateQueries({ queryKey: settingsKey })
      void queryClient.invalidateQueries({ queryKey: meKey })
    }
    void navigate(routes.settings, { replace: true })
  }, [emailResult, setToast, queryClient, navigate, t])

  // Debounced saving; pending changes are sent when the page is left
  const pending = useRef<Settings | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const actionsRef = useRef({
    save: settingsActions.save,
    reload: settingsActions.reload,
    toast,
    sfx,
  })
  actionsRef.current = { save: settingsActions.save, reload: settingsActions.reload, toast, sfx }
  const flush = useCallback(() => {
    clearTimeout(timer.current)
    const settings = pending.current
    pending.current = null
    if (!settings) return Promise.resolve()
    const { save, reload, toast, sfx } = actionsRef.current
    return save(settings).then(
      () => sfx('ui-saved'),
      async (e: unknown) => {
        toast.error(e, t('settings.saveFailed'))
        await reload().catch(() => undefined)
        setEpoch((n) => n + 1)
      },
    )
  }, [])
  useEffect(() => () => void flush(), [flush])

  const onChangeSettings = (settings: Settings) => {
    // Sofort anwenden (Farbschema, Animationen), gespeichert wird kurz danach
    settingsActions.setLocal(settings)
    pending.current = settings
    clearTimeout(timer.current)
    timer.current = setTimeout(() => void flush(), SETTINGS_SAVE_DELAY_MS)
  }

  const run = <T,>(action: Promise<T>, done: string | ((result: T) => string), fallback?: string) =>
    void action.then(
      (result) => toast.info(typeof done === 'function' ? done(result) : done),
      (e: unknown) => toast.error(e, fallback),
    )

  /** End sessions on the server and go to the login page (stays here on errors) */
  const endSessions = (end: () => Promise<unknown>, notice: string, fallback: string) =>
    void flush()
      .then(() =>
        signOut(
          async () => {
            // Push-Abo dieses Browsers gehört nicht mehr zu diesem Konto
            await unsubscribePush().catch(() => undefined)
            await end()
          },
          { notice },
        ),
      )
      .catch((e: unknown) => toast.error(e, fallback))

  let content
  if (isPending)
    content = (
      <PageState
        title={t('settings.title')}
        loadingText={t('settings.loading')}
        fallback=""
        onRetry={() => undefined}
      />
    )
  else if (!data)
    content = (
      <PageState
        title={t('settings.title')}
        loadingText=""
        error={error}
        fallback={t('settings.loadFailed')}
        onRetry={() => void refetch()}
      />
    )
  else
    content = (
      <Einstellungen
        key={epoch}
        settings={data.settings}
        locale={locale}
        onChangeLocale={changeLocale}
        account={data.account}
        displayName={data.displayName}
        pushPermission={push.permission}
        onChangeSettings={onChangeSettings}
        onEnablePush={() =>
          void push
            .enable()
            .then((result) => result === 'default' && toast.info(t(PUSH_NO_PROMPT_HINT)))
            .catch((e: unknown) => toast.error(e, t('lobby.pushFailed')))
        }
        onResendVerification={() =>
          run(account.resendVerification(), (r) =>
            r.alreadyVerified ? t('common.verify.already') : t('common.verify.sent'),
          )
        }
        onChangeEmail={(email, currentPassword) =>
          run(account.changeEmail(email, currentPassword), (r) =>
            t('settings.linkSent', { email: r.pendingEmail }),
          )
        }
        onChangePassword={(currentPassword, newPassword) =>
          run(account.changePassword(currentPassword, newPassword), t('settings.passwordChanged'))
        }
        onLogout={() => void flush().finally(() => void logout())}
        onLogoutEverywhere={() =>
          endSessions(
            account.logoutEverywhere,
            t('settings.loggedOutEverywhere'),
            t('settings.logoutEverywhereFailed'),
          )
        }
        onDeleteAccount={(currentPassword) =>
          endSessions(
            () => account.deleteAccount(currentPassword),
            t('settings.accountDeleted'),
            t('settings.deleteFailed'),
          )
        }
      />
    )

  return (
    <>
      {content}
      {toast.toast && <Toast toast={toast.toast} onClose={toast.close} />}
    </>
  )
}
