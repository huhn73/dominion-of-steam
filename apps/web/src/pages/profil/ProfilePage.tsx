import { Profil } from '../../sections/profil/components'
import { useProfile, useProfileActions } from '../../data/profile'
import { Toast, useToast } from '../shared/toast'
import { PageState } from './PageState'

/** Profil („Dienstakte“) mit Daten aus GET /api/profile; der Verlauf wird seitenweise geladen */
export function ProfilePage() {
  const { data, error, isPending, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useProfile()
  const actions = useProfileActions()
  const toast = useToast()

  /** Run an action; confirmation or the server's message as a toast */
  const run = (action: Promise<unknown>, done: string, fallback?: string) =>
    void action.then(
      () => toast.info(done),
      (e: unknown) => toast.error(e, fallback),
    )

  let content
  if (isPending)
    content = (
      <PageState
        title="Profil"
        loadingText="Lade Dienstakte …"
        fallback=""
        onRetry={() => undefined}
      />
    )
  else if (!data)
    content = (
      <PageState
        title="Profil"
        loadingText=""
        error={error}
        fallback="Das Profil konnte nicht geladen werden."
        onRetry={() => void refetch()}
      />
    )
  else {
    const first = data.pages[0]!
    content = (
      <Profil
        profile={first.profile}
        stats={first.stats}
        factionStats={first.factionStats}
        history={data.pages.flatMap((p) => p.history)}
        hasMoreHistory={hasNextPage}
        factions={first.factions}
        onLoadMoreHistory={() => {
          if (isFetchingNextPage) return
          void fetchNextPage().then((r) => {
            if (r.isError) toast.error(r.error, 'Ältere Partien konnten nicht geladen werden.')
          })
        }}
        onUpdateDisplayName={(name) =>
          run(actions.updateDisplayName(name), 'Anzeigename gespeichert')
        }
        onUploadAvatar={(file) =>
          run(
            actions.uploadAvatar(file),
            'Bild gespeichert',
            'Das Bild konnte nicht hochgeladen werden.',
          )
        }
        onRemoveAvatar={() => run(actions.removeAvatar(), 'Bild entfernt')}
      />
    )
  }

  return (
    <>
      {content}
      {toast.toast && <Toast toast={toast.toast} onClose={toast.close} />}
    </>
  )
}
