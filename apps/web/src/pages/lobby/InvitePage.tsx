import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiRequestError } from '../../data/api'
import { useLobbyActions } from '../../data/lobby'
import { routes } from '../../routes'
import { PlaceholderPage } from '../PlaceholderPage'
import type { MessageKey } from '@dos/shared/i18n'
import { useT } from '../../i18n'

const TITLES: Record<string, MessageKey> = {
  INVITE_INVALID: 'lobby.invite.invalid',
  INVITE_EXPIRED: 'lobby.invite.expired',
  MATCH_FULL: 'lobby.invite.full',
}

/**
 * Einladungslink `/einladung/:token`: besetzt einen freien Platz und führt in den Warteraum.
 * Abgemeldet leitet `RequireAuth` zur Anmeldung mit `?weiter=` hierher zurück.
 */
export function InvitePage() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const t = useT()
  const { claimInvite } = useLobbyActions()
  const [error, setError] = useState<ApiRequestError | Error | null>(null)
  const claimed = useRef<string | null>(null)

  useEffect(() => {
    // Only once per token (React may run effects twice in development)
    if (claimed.current === token) return
    claimed.current = token
    claimInvite(token).then(
      ({ matchId }) => navigate(routes.waitingRoom(matchId), { replace: true }),
      (e: Error) => setError(e),
    )
  }, [token, claimInvite, navigate])

  if (!error)
    return (
      <PlaceholderPage title={t('lobby.invite.title')}>
        <p className="animate-pulse">{t('lobby.invite.joining')}</p>
      </PlaceholderPage>
    )
  const code = error instanceof ApiRequestError ? error.code : ''
  return (
    <PlaceholderPage title={t(TITLES[code] ?? 'lobby.invite.title')}>
      <p role="alert">
        {error instanceof ApiRequestError
          ? error.message
          : t('lobby.invite.failed')}
      </p>
      <p className="mt-4">
        <Link
          to={routes.lobby}
          className="font-semibold text-teal-700 underline dark:text-teal-300"
        >
          {t('lobby.toLobby')}
        </Link>{' '}
        {t('lobby.invite.hint')}
      </p>
    </PlaceholderPage>
  )
}
