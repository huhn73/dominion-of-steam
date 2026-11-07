import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Lobby } from '../../sections/lobby/components'
import { ApiRequestError } from '../../data/api'
import { useLobby, useLobbyActions, useTickingNow } from '../../data/lobby'
import { PUSH_NO_PROMPT_HINT, usePushBannerDismissed, usePushPermission } from '../../data/push'
import { useMe } from '../../data/session'
import { routes } from '../../routes'
import { PlaceholderPage } from '../PlaceholderPage'
import { EmailVerifyNotice } from '../shared/EmailVerifyNotice'
import { Toast, useToast } from '../shared/toast'
import { DevBar, devToolsEnabled } from './DevBar'
import { useT } from '../../i18n'

/** Lobby („Lagebericht“) mit Daten aus GET /api/lobby; Startseite der App */
export function LobbyPage() {
  const navigate = useNavigate()
  const { data, error, isPending, refetch } = useLobby()
  const { data: me } = useMe()
  const now = useTickingNow(data?.now)
  const push = usePushPermission()
  const banner = usePushBannerDismissed(me?.id)
  const actions = useLobbyActions()
  const toast = useToast()
  const t = useT()

  // Hinweis von einer anderen Seite (z. B. „Warteraum verlassen“, „aufgegeben“)
  const location = useLocation()
  const notice = (location.state as { notice?: string } | null)?.notice
  const { info } = toast
  useEffect(() => {
    if (!notice) return
    info(notice)
    void navigate(location.pathname, { replace: true, state: null })
  }, [notice, info, navigate, location.pathname])

  /** Run an action; confirmation or the server's message as a toast */
  const run = <T,>(action: Promise<T>, done?: string | ((result: T) => void)) =>
    void action.then(
      (result) => (typeof done === 'function' ? done(result) : done && toast.info(done)),
      (e: unknown) => toast.error(e),
    )
  const toRoom = ({ matchId }: { matchId: string }) => void navigate(routes.waitingRoom(matchId))

  let content
  if (isPending)
    content = (
      <PlaceholderPage title={t('lobby.title')}>
        <p className="animate-pulse">{t('lobby.loading')}</p>
      </PlaceholderPage>
    )
  else if (error || !data || !now)
    content = (
      <PlaceholderPage title={t('lobby.title')}>
        <p role="alert">
          {error instanceof ApiRequestError ? error.message : t('lobby.loadFailed')}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-6 min-h-11 rounded-md bg-gradient-to-b from-amber-400 to-amber-600 px-4 font-['Big_Shoulders_Display'] font-bold uppercase tracking-widest text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
        >
          {t('common.retry')}
        </button>
      </PlaceholderPage>
    )
  else
    content = (
      <Lobby
        {...data}
        now={now}
        // „Später“ gilt dauerhaft (je Spieler im Browser): dann kein Banner mehr
        pushPermission={banner.dismissed ? 'granted' : push.permission}
        onPlay={(id) => void navigate(routes.match(id))}
        onOpenWaitingRoom={(id) => void navigate(routes.waitingRoom(id))}
        onRemind={(id, participantId) =>
          run(actions.remind(id, participantId), t('lobby.reminderSent'))
        }
        onSurrender={(id) => run(actions.surrender(id), t('shell.surrendered'))}
        // Der Dialog öffnet sich in der Komponente; frische Daten schaden nicht
        onShowDetails={() => void refetch()}
        onAcceptInvitation={(id) => run(actions.acceptInvitation(id), toRoom)}
        onDeclineInvitation={(id) =>
          run(actions.declineInvitation(id), t('lobby.invitationDeclined'))
        }
        onJoinOpenMatch={(id) => run(actions.joinOpenMatch(id), toRoom)}
        onEnablePush={() =>
          void push
            .enable()
            .then((result) => result === 'default' && toast.info(t(PUSH_NO_PROMPT_HINT)))
            .catch((e: unknown) => toast.error(e, t('lobby.pushFailed')))
        }
        onDismissPushBanner={banner.dismiss}
        onNewMatch={() => void navigate(routes.newMatch)}
        onStartTutorial={(restart) =>
          run(actions.startTutorial(restart), ({ matchId }) => void navigate(routes.match(matchId)))
        }
        onDismissTutorial={() => run(actions.dismissTutorial(), t('lobby.tutorialLater'))}
      />
    )

  return (
    <>
      <EmailVerifyNotice onInfo={toast.info} onError={(e) => toast.error(e)} />
      {content}
      {devToolsEnabled && <DevBar />}
      {toast.toast && <Toast toast={toast.toast} onClose={toast.close} />}
    </>
  )
}
