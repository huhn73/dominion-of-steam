import { useNavigate } from 'react-router'
import { Freunde } from '../../sections/freunde/Freunde'
import { useFriendActions, useFriends } from '../../data/friends'
import { routes } from '../../routes'
import { useT } from '../../i18n'
import { PageState } from '../profil/PageState'
import { Toast, useToast } from '../shared/toast'

/** Freunde (`/freunde`): requests and the friends list, updated through the event stream */
export function FriendsPage() {
  const t = useT()
  const navigate = useNavigate()
  const { data, error, isPending, refetch } = useFriends()
  const actions = useFriendActions()
  const toast = useToast()

  /** Run an action; confirmation or the server's message as a toast */
  const run = (action: Promise<unknown>, done: string) =>
    void action.then(
      () => toast.info(done),
      (e: unknown) => toast.error(e),
    )

  let content
  if (isPending)
    content = (
      <PageState
        title={t('friends.title')}
        loadingText={t('friends.loading')}
        fallback=""
        onRetry={() => undefined}
      />
    )
  else if (!data)
    content = (
      <PageState
        title={t('friends.title')}
        loadingText=""
        error={error}
        fallback={t('friends.loadFailed')}
        onRetry={() => void refetch()}
      />
    )
  else
    content = (
      <Freunde
        data={data}
        now={new Date().toISOString()}
        onSendRequest={(name) => run(actions.request({ name }), t('friends.requestSent'))}
        onAccept={(id) => run(actions.accept(id), t('friends.accepted'))}
        onDecline={(id) => run(actions.decline(id), t('friends.declined'))}
        onWithdraw={(id) => run(actions.withdraw(id), t('friends.withdrawn'))}
        onRemove={(id) => run(actions.remove(id), t('friends.removed'))}
        onOpenPlayer={(id) => void navigate(routes.player(id))}
      />
    )

  return (
    <>
      {content}
      {toast.toast && <Toast toast={toast.toast} onClose={toast.close} />}
    </>
  )
}
