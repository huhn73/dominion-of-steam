import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import type { Settings } from '@dos/shared/profile'
import { Einstellungen } from '../../sections/profil/components'
import { settingsKey, useAccountActions, useSettings, useSettingsActions } from '../../data/profile'
import { unsubscribePush, usePushPermission } from '../../data/push'
import { meKey, useLogout, useSignOut } from '../../data/session'
import { routes } from '../../routes'
import { Toast, useToast } from '../shared/toast'
import { useAudio } from '../../audio/AudioProvider'
import { PageState } from './PageState'

/** Sliders report every step; the request waits until the player pauses */
export const SETTINGS_SAVE_DELAY_MS = 400

/** Result of the e-mail confirmation link (`?email=…`, set by the server redirect) */
const EMAIL_RESULT: Record<string, { kind: 'info' | 'error'; text: string }> = {
  bestaetigt: { kind: 'info', text: 'Deine neue E-Mail-Adresse ist bestätigt.' },
  verifiziert: { kind: 'info', text: 'Deine E-Mail-Adresse ist bestätigt.' },
  ungueltig: { kind: 'error', text: 'Der Bestätigungslink ist ungültig oder abgelaufen.' },
  vergeben: { kind: 'error', text: 'Diese E-Mail-Adresse ist inzwischen vergeben.' },
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
  const { sfx } = useAudio()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  // Remounts `Einstellungen` with the server state after a failed save
  const [epoch, setEpoch] = useState(0)

  // Hinweis aus dem Bestätigungslink der E-Mail-Änderung
  const [params] = useSearchParams()
  const emailResult = EMAIL_RESULT[params.get('email') ?? '']
  const { setToast } = toast
  useEffect(() => {
    if (!emailResult) return
    setToast(emailResult)
    if (emailResult.kind === 'info') {
      void queryClient.invalidateQueries({ queryKey: settingsKey })
      void queryClient.invalidateQueries({ queryKey: meKey })
    }
    void navigate(routes.settings, { replace: true })
  }, [emailResult, setToast, queryClient, navigate])

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
        toast.error(e, 'Die Einstellung konnte nicht gespeichert werden.')
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
        title="Einstellungen"
        loadingText="Lade Einstellungen …"
        fallback=""
        onRetry={() => undefined}
      />
    )
  else if (!data)
    content = (
      <PageState
        title="Einstellungen"
        loadingText=""
        error={error}
        fallback="Die Einstellungen konnten nicht geladen werden."
        onRetry={() => void refetch()}
      />
    )
  else
    content = (
      <Einstellungen
        key={epoch}
        settings={data.settings}
        account={data.account}
        displayName={data.displayName}
        pushPermission={push.permission}
        onChangeSettings={onChangeSettings}
        onEnablePush={() =>
          void push
            .enable()
            .catch((e: unknown) =>
              toast.error(e, 'Push-Benachrichtigungen konnten nicht aktiviert werden.'),
            )
        }
        onResendVerification={() =>
          run(account.resendVerification(), (r) =>
            r.alreadyVerified
              ? 'Deine E-Mail-Adresse ist schon bestätigt.'
              : 'Wir haben dir eine neue Bestätigungsmail geschickt.',
          )
        }
        onChangeEmail={(email, currentPassword) =>
          run(
            account.changeEmail(email, currentPassword),
            (r) => `Wir haben dir einen Bestätigungslink an ${r.pendingEmail} geschickt.`,
          )
        }
        onChangePassword={(currentPassword, newPassword) =>
          run(
            account.changePassword(currentPassword, newPassword),
            'Passwort geändert. Andere Geräte wurden abgemeldet.',
          )
        }
        onLogout={() => void flush().finally(() => void logout())}
        onLogoutEverywhere={() =>
          endSessions(
            account.logoutEverywhere,
            'Du wurdest auf allen Geräten abgemeldet.',
            'Die Abmeldung auf allen Geräten hat nicht geklappt.',
          )
        }
        onDeleteAccount={(currentPassword) =>
          endSessions(
            () => account.deleteAccount(currentPassword),
            'Dein Konto wurde gelöscht. Laufende Partien führt eine KI weiter.',
            'Das Konto konnte nicht gelöscht werden.',
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
