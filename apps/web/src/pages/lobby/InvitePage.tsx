import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiRequestError } from '../../data/api'
import { useLobbyActions } from '../../data/lobby'
import { routes } from '../../routes'
import { PlaceholderPage } from '../PlaceholderPage'

const TITLES: Record<string, string> = {
  INVITE_INVALID: 'Einladung ungültig',
  INVITE_EXPIRED: 'Einladung abgelaufen',
  MATCH_FULL: 'Partie voll',
}

/**
 * Einladungslink `/einladung/:token`: besetzt einen freien Platz und führt in den Warteraum.
 * Abgemeldet leitet `RequireAuth` zur Anmeldung mit `?weiter=` hierher zurück.
 */
export function InvitePage() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
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
      <PlaceholderPage title="Einladung">
        <p className="animate-pulse">Du trittst der Partie bei …</p>
      </PlaceholderPage>
    )
  const code = error instanceof ApiRequestError ? error.code : ''
  return (
    <PlaceholderPage title={TITLES[code] ?? 'Einladung'}>
      <p role="alert">
        {error instanceof ApiRequestError
          ? error.message
          : 'Der Einladungslink konnte nicht geöffnet werden.'}
      </p>
      <p className="mt-4">
        <Link
          to={routes.lobby}
          className="font-semibold text-teal-700 underline dark:text-teal-300"
        >
          Zur Lobby
        </Link>{' '}
        – dort findest du offene Partien und kannst selbst eine anlegen.
      </p>
    </PlaceholderPage>
  )
}
