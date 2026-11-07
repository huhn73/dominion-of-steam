import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Warteraum } from '../../sections/lobby/components'
import { ApiRequestError } from '../../data/api'
import { useLobbyActions, useWaitingRoom } from '../../data/lobby'
import { routes } from '../../routes'
import { PlaceholderPage } from '../PlaceholderPage'
import { shareLink, Toast, useToast } from '../shared/toast'
import { useT } from '../../i18n'

const linkClass = 'font-semibold text-teal-700 underline dark:text-teal-300'

/** Warteraum einer wartenden Partie (GET /api/matches/:id/room, alle 4 s neu) */
export function WaitingRoomPage() {
  const { matchId = '' } = useParams()
  const navigate = useNavigate()
  const t = useT()
  const { data, error, isPending } = useWaitingRoom(matchId)
  const actions = useLobbyActions()
  const toast = useToast()
  const own = data?.room.seats.find((s) => s.isYou)
  const serverReady = own?.kind === 'player' ? own.status === 'ready' : null

  // `Warteraum` keeps the own ready state locally (optimistic). When the server reports a
  // different state than the last one sent (or seen), the component is mounted anew.
  const lastReady = useRef<boolean | null>(null)
  const sending = useRef(0)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (serverReady === null || sending.current > 0) return
    if (lastReady.current !== null && lastReady.current !== serverReady) setVersion((v) => v + 1)
    lastReady.current = serverReady
  }, [serverReady])

  // Started (also by the host while we look): on to the board
  const started = data && data.status !== 'waiting'
  useEffect(() => {
    if (started) void navigate(routes.match(matchId), { replace: true })
  }, [started, matchId, navigate])

  if (isPending || started)
    return (
      <PlaceholderPage title={t('lobby.room.title')}>
        <p className="animate-pulse">{started ? t('lobby.room.starting') : t('lobby.room.loading')}</p>
      </PlaceholderPage>
    )
  if (error || !data) {
    const status = error instanceof ApiRequestError ? error.status : 0
    return (
      <PlaceholderPage title={t('lobby.room.title')}>
        <p role="alert">
          {status === 404
            ? t('lobby.room.gone')
            : error instanceof ApiRequestError
              ? error.message
              : t('lobby.room.unavailable')}
        </p>
        <p className="mt-4">
          <Link to={routes.lobby} className={linkClass}>
            {t('lobby.toLobby')}
          </Link>
        </p>
      </PlaceholderPage>
    )
  }

  const toggleReady = (ready: boolean) => {
    sending.current += 1
    lastReady.current = ready
    void actions
      .setReady(matchId, ready)
      .catch((e: unknown) => {
        toast.error(e)
        lastReady.current = !ready
        setVersion((v) => v + 1)
      })
      .finally(() => (sending.current -= 1))
  }

  return (
    <>
      <Warteraum
        key={version}
        room={data.room}
        factions={data.factions}
        onToggleReady={toggleReady}
        onStartMatch={(fill) =>
          void actions.start(matchId, fill).then(
            () => navigate(routes.match(matchId)),
            (e: unknown) => toast.error(e),
          )
        }
        onLeave={() =>
          void actions.leave(matchId).then(
            ({ dissolved }) =>
              navigate(routes.lobby, {
                state: { notice: dissolved ? t('lobby.room.dissolved') : t('lobby.room.left') },
              }),
            (e: unknown) => toast.error(e),
          )
        }
        onCopyInviteLink={() => toast.info(t('lobby.room.linkCopied'))}
        onShareInviteLink={(link) =>
          void shareLink(link, {
            onCopied: () => toast.info(t('lobby.room.linkCopied')),
            onError: (text) => toast.setToast({ kind: 'error', text }),
          })
        }
        onBack={() => void navigate(routes.lobby)}
      />
      {toast.toast && <Toast toast={toast.toast} onClose={toast.close} />}
    </>
  )
}
