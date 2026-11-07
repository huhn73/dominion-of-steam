import { useState, type FormEvent, type ReactNode } from 'react'
import { Check, Search, UserMinus, UserPlus, Users, X } from 'lucide-react'
import type { Friend, FriendRequest, FriendsData } from '@dos/shared/account'
import { useLocale, useT } from '../../i18n'
import { timeAgo } from '../lobby/components/format'
import { Avatar, Sheet } from '../profil/components'

export interface FreundeProps {
  data: FriendsData
  now: string
  onSendRequest: (name: string) => void
  onAccept: (playerId: string) => void
  onDecline: (playerId: string) => void
  onWithdraw: (playerId: string) => void
  onRemove: (playerId: string) => void
  onOpenPlayer: (playerId: string) => void
}

const STATUS_DOT: Record<Friend['status'], string> = {
  online: 'bg-teal-500',
  inGame: 'bg-amber-500',
  offline: 'bg-stone-400',
}

function Heading({ title, count }: { title: string; count: number }) {
  return (
    <h2 className="mb-3 flex items-baseline gap-3 border-b-4 border-double border-stone-300 pb-2 font-['Big_Shoulders_Display'] text-2xl font-black uppercase tracking-wide dark:border-stone-700">
      {title}
      <span className="font-['IBM_Plex_Mono'] text-sm font-normal text-stone-500">{count}</span>
    </h2>
  )
}

function PlayerRow({
  id,
  name,
  avatarUrl,
  dot,
  detail,
  onOpen,
  children,
}: {
  id: string
  name: string
  avatarUrl: string | null
  dot?: string
  detail: string
  onOpen: (id: string) => void
  children?: ReactNode
}) {
  const t = useT()
  return (
    <li className="flex items-center gap-3 p-3">
      <span className="relative shrink-0">
        <Avatar name={name} url={avatarUrl} className="size-10" />
        {dot && (
          <span
            className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white dark:border-stone-900 ${dot}`}
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onOpen(id)}
          aria-label={t('profile.openProfile', { name })}
          className="block truncate text-left font-semibold underline-offset-2 hover:text-teal-700 hover:underline dark:hover:text-teal-300"
        >
          {name}
        </button>
        <span className="block text-xs text-stone-500">{detail}</span>
      </span>
      <span className="flex shrink-0 gap-1.5">{children}</span>
    </li>
  )
}

const listClass =
  'divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900'
const primary =
  'flex min-h-10 items-center gap-1.5 rounded-lg bg-amber-500 px-3 text-sm font-semibold text-stone-950 hover:bg-amber-400'
const secondary =
  'flex min-h-10 items-center gap-1.5 rounded-lg border-2 border-stone-300 px-3 text-sm font-semibold hover:border-rose-400 hover:text-rose-600 dark:border-stone-700'

/** Friends page: search and send requests, answer incoming ones, manage the friends list */
export function Freunde({
  data,
  now,
  onSendRequest,
  onAccept,
  onDecline,
  onWithdraw,
  onRemove,
  onOpenPlayer,
}: FreundeProps) {
  const t = useT()
  const { locale } = useLocale()
  const [name, setName] = useState('')
  const [removing, setRemoving] = useState<Friend | null>(null)
  const ago = (iso: string) => timeAgo(t, locale, iso, now)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSendRequest(trimmed)
    setName('')
  }

  const presence = (f: Friend) =>
    f.status === 'offline' && f.lastSeen
      ? t('friends.lastSeen', { when: ago(f.lastSeen) })
      : t(`partieSetup.status.${f.status}`)

  const requestRow = (r: FriendRequest, actions: ReactNode, detail: string) => (
    <PlayerRow
      key={r.id}
      id={r.id}
      name={r.name}
      avatarUrl={r.avatarUrl}
      detail={detail}
      onOpen={onOpenPlayer}
    >
      {actions}
    </PlayerRow>
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 font-['Barlow'] text-stone-900 sm:px-6 sm:py-12 dark:text-stone-100">
      <header className="mb-8">
        <p className="mb-2 flex items-center gap-3 font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.3em] text-teal-700 dark:text-teal-400">
          <span className="h-px w-8 bg-current" /> {t('friends.kicker')}
        </p>
        <h1 className="font-['Big_Shoulders_Display'] text-5xl font-black uppercase leading-[0.9] tracking-wide sm:text-6xl">
          {t('friends.title')}
        </h1>
      </header>

      <form onSubmit={submit} className="mb-10 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex flex-1 items-center">
          <span className="sr-only">{t('friends.searchLabel')}</span>
          <Search className="pointer-events-none absolute left-3 size-4 text-stone-400" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('friends.searchPlaceholder')}
            className="min-h-12 w-full rounded-lg border-2 border-stone-300 bg-white pl-10 pr-3 outline-none focus:border-teal-500 dark:border-stone-700 dark:bg-stone-900"
          />
        </label>
        <button
          type="submit"
          disabled={!name.trim()}
          className={`${primary} min-h-12 px-5 disabled:opacity-50`}
        >
          <UserPlus className="size-4" /> {t('friends.send')}
        </button>
      </form>

      {data.incoming.length > 0 && (
        <section aria-label={t('friends.incoming')} className="mb-10">
          <Heading title={t('friends.incoming')} count={data.incoming.length} />
          <ul className={listClass}>
            {data.incoming.map((r) =>
              requestRow(
                r,
                <>
                  <button type="button" onClick={() => onAccept(r.id)} className={primary}>
                    <Check className="size-4" /> {t('friends.accept')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDecline(r.id)}
                    aria-label={t('friends.declineName', { name: r.name })}
                    className={secondary}
                  >
                    <X className="size-4" />
                    <span className="hidden sm:inline">{t('friends.decline')}</span>
                  </button>
                </>,
                t('friends.sentAgo', { when: ago(r.createdAt) }),
              ),
            )}
          </ul>
        </section>
      )}

      <section aria-label={t('friends.list')} className="mb-10">
        <Heading title={t('friends.list')} count={data.friends.length} />
        {data.friends.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-stone-300 px-6 py-10 text-center dark:border-stone-700">
            <Users className="mb-2 size-8 text-stone-400" />
            <p className="font-['Big_Shoulders_Display'] text-2xl font-black uppercase tracking-wide">
              {t('friends.none')}
            </p>
            <p className="mt-1 max-w-md text-sm text-stone-500">{t('friends.noneHint')}</p>
          </div>
        ) : (
          <ul className={listClass}>
            {data.friends.map((f) => (
              <PlayerRow
                key={f.id}
                id={f.id}
                name={f.name}
                avatarUrl={f.avatarUrl}
                dot={STATUS_DOT[f.status]}
                detail={presence(f)}
                onOpen={onOpenPlayer}
              >
                <button
                  type="button"
                  onClick={() => setRemoving(f)}
                  aria-label={t('friends.removeName', { name: f.name })}
                  className={secondary}
                >
                  <UserMinus className="size-4" />
                </button>
              </PlayerRow>
            ))}
          </ul>
        )}
      </section>

      {data.outgoing.length > 0 && (
        <section aria-label={t('friends.outgoing')}>
          <Heading title={t('friends.outgoing')} count={data.outgoing.length} />
          <ul className={listClass}>
            {data.outgoing.map((r) =>
              requestRow(
                r,
                <button type="button" onClick={() => onWithdraw(r.id)} className={secondary}>
                  <X className="size-4" /> {t('friends.withdraw')}
                </button>,
                t('friends.sentAgo', { when: ago(r.createdAt) }),
              ),
            )}
          </ul>
        </section>
      )}

      {removing && (
        <Sheet
          title={t('friends.removeTitle')}
          onClose={() => setRemoving(null)}
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRemoving(null)}
                className="min-h-11 rounded-lg border-2 border-stone-300 px-4 font-semibold dark:border-stone-700"
              >
                {t('friends.keep')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemove(removing.id)
                  setRemoving(null)
                }}
                className="min-h-11 rounded-lg bg-rose-600 px-4 font-semibold text-white hover:bg-rose-500"
              >
                {t('friends.remove')}
              </button>
            </div>
          }
        >
          <p>{t('friends.removeText', { name: removing.name })}</p>
        </Sheet>
      )}
    </div>
  )
}
