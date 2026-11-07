import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Profil } from '../../sections/profil/components'
import { NO_FILTER, useProfile, type HistoryFilter } from '../../data/profile'
import { useMe } from '../../data/session'
import { useFriendActions } from '../../data/friends'
import { routes } from '../../routes'
import { useT } from '../../i18n'
import { Toast, useToast } from '../shared/toast'
import { PageState } from './PageState'

/** Another player's profile (`/spieler/:playerId`): statistics, history, badges, friend button */
export function PlayerProfilePage() {
  const t = useT()
  const { playerId = '' } = useParams()
  const navigate = useNavigate()
  const { data: me } = useMe()
  const [filter, setFilter] = useState<HistoryFilter>(NO_FILTER)
  const { data, error, isPending, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useProfile(playerId, filter)
  const friends = useFriendActions()
  const toast = useToast()

  if (me && playerId === me.id) return <Navigate to={routes.profile} replace />

  let content
  if (isPending)
    content = (
      <PageState
        title={t('shell.profile')}
        loadingText={t('profile.loading')}
        fallback=""
        onRetry={() => undefined}
      />
    )
  else if (!data)
    content = (
      <PageState
        title={t('shell.profile')}
        loadingText=""
        error={error}
        fallback={t('profile.loadFailed')}
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
        badges={first.badges}
        isOwn={false}
        friendship={first.friendship}
        resultFilter={filter.result}
        factionFilter={filter.faction}
        onFilterChange={setFilter}
        onOpenPlayer={(id) => void navigate(routes.player(id))}
        onAddFriend={() =>
          void friends.request({ playerId }).then(
            () => toast.info(t('friends.requestSent')),
            (e: unknown) => toast.error(e),
          )
        }
        onLoadMoreHistory={() => {
          if (isFetchingNextPage) return
          void fetchNextPage().then((r) => {
            if (r.isError) toast.error(r.error, t('profile.olderFailed'))
          })
        }}
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
