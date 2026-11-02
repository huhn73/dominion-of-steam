import { useNavigate } from 'react-router'
import { randomSeed } from '@dos/shared/game/seed'
import type { MatchDraft } from '@dos/shared/setup'
import { PartieSetup } from '../../sections/partie-setup/components'
import { ApiRequestError } from '../../data/api'
import { useCreateMatch, useSetupData } from '../../data/setup'
import { PlaceholderPage } from '../PlaceholderPage'
import { routes } from '../../routes'
import { shareLink, Toast, useToast } from '../shared/toast'

/** Assistent „Neue Partie“ mit Daten aus GET /api/setup */
export function NewMatchPage() {
  const navigate = useNavigate()
  const { data, error, isPending, refetch } = useSetupData()
  const create = useCreateMatch()
  const { toast, setToast } = useToast()

  if (isPending)
    return (
      <PlaceholderPage title="Neue Partie">
        <p className="animate-pulse">Lade Einrichtung …</p>
      </PlaceholderPage>
    )
  if (error || !data)
    return (
      <PlaceholderPage title="Neue Partie">
        <p>
          {error instanceof ApiRequestError
            ? error.message
            : 'Die Einrichtung konnte nicht geladen werden.'}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-6 min-h-11 rounded-md bg-gradient-to-b from-amber-400 to-amber-600 px-4 font-['Big_Shoulders_Display'] font-bold uppercase tracking-widest text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
        >
          Erneut versuchen
        </button>
      </PlaceholderPage>
    )

  const copied = () => setToast({ kind: 'info', text: 'Link kopiert' })

  const share = (link: string) =>
    shareLink(link, { onCopied: copied, onError: (text) => setToast({ kind: 'error', text }) })

  const createMatch = (draft: MatchDraft) => {
    if (create.isPending) return
    setToast({ kind: 'info', text: 'Partie wird angelegt …' })
    create.mutate(
      { draft, reservationId: data.reservationId },
      {
        onSuccess: ({ matchId, started }) =>
          void navigate(started ? routes.match(matchId) : routes.waitingRoom(matchId)),
        // Der Assistent bleibt mit allen Eingaben stehen; die Meldung des Servers erscheint oben
        onError: (e) =>
          setToast({
            kind: 'error',
            text:
              e instanceof ApiRequestError ? e.message : 'Die Partie konnte nicht angelegt werden.',
          }),
      },
    )
  }

  return (
    <>
      <PartieSetup
        key={data.reservationId}
        you={data.you}
        factions={data.factions}
        aiPersonalities={data.aiPersonalities}
        friends={data.friends}
        options={data.options}
        draft={data.draft}
        inviteLink={data.inviteLink}
        onRandomizeSeed={() => randomSeed()}
        onCopyInviteLink={copied}
        onShareInviteLink={(link) => void share(link)}
        onCreateMatch={createMatch}
        onCancel={() => void navigate(routes.lobby)}
      />
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </>
  )
}
