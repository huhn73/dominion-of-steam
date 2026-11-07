import { formatDate, type Locale, type MessageKey, type Translate } from '@dos/shared/i18n'
import { Link } from 'react-router'
import { routes } from '../../../routes'
import { useState } from 'react'
import { Search } from 'lucide-react'
import type { AiPersonality, Faction, Friend } from '../types'
import { FACTION_HEX } from './setup'
import { Avatar, FactionEmblem, Sheet } from './ui'
import { useLocale, useT } from '../../../i18n'

interface AiPickerProps {
  personalities: AiPersonality[]
  factions: Faction[]
  /** Personality ids already placed in other seats */
  usedIds: Set<string>
  /** Faction ids that are taken and may not be reused */
  blockedFactionIds: Set<string>
  onPick: (personalityId: string) => void
  onClose: () => void
}

export function AiPicker({ personalities, factions, usedIds, blockedFactionIds, onPick, onClose }: AiPickerProps) {
  const t = useT()
  return (
    <Sheet title={t('partieSetup.pickAi')} onClose={onClose}>
      {personalities.length === 0 && <p className="py-8 text-center text-sm text-stone-500">{t('partieSetup.noAi')}</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {personalities.map((p) => {
          const faction = factions.find((f) => f.id === p.factionId)
          const c = faction ? FACTION_HEX[faction.color] : FACTION_HEX.amber
          const used = usedIds.has(p.id)
          const blocked = blockedFactionIds.has(p.factionId)
          const disabled = used || blocked
          return (
            <li key={p.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(p.id)}
                className="group flex h-full w-full gap-4 overflow-hidden rounded-xl border-2 border-stone-200 bg-white p-4 text-left transition hover:border-teal-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-stone-200 disabled:hover:shadow-none dark:border-stone-700 dark:bg-stone-950"
              >
                <span className="relative shrink-0">
                  <Avatar name={p.name} url={p.portraitUrl} color={c.base} className="size-16 text-xl" />
                  {faction && (
                    <span className="absolute -bottom-1 -right-1">
                      <FactionEmblem faction={faction} className="size-7" />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-['Big_Shoulders_Display'] text-xl font-black uppercase leading-tight tracking-wide">{p.name}</span>
                  <span className="block text-xs font-semibold uppercase tracking-widest" style={{ color: c.base }}>
                    {t(p.title)} · {faction?.shortName}
                  </span>
                  {p.style.length > 0 && (
                    <span className="mt-2 flex flex-wrap gap-1">
                      {p.style.map((s) => (
                        <span key={s} className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                          {t(`setup.style.${s}` as MessageKey)}
                        </span>
                      ))}
                    </span>
                  )}
                  <span className="mt-2 line-clamp-3 text-sm text-stone-600 dark:text-stone-400">{t(p.description)}</span>
                  {disabled && (
                    <span className="mt-2 block text-xs font-semibold text-stone-500">
                      {used ? t('partieSetup.alreadyIn') : t('partieSetup.factionTaken', { faction: faction?.shortName ?? '' })}
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}

const STATUS = {
  online: { label: 'partieSetup.status.online', dot: 'bg-teal-500' },
  inGame: { label: 'partieSetup.status.inGame', dot: 'bg-amber-500' },
  offline: { label: 'partieSetup.status.offline', dot: 'bg-stone-400' },
} as const

function lastSeenLabel(t: Translate, locale: Locale, iso: string | null) {
  if (!iso) return ''
  return t('partieSetup.lastSeen', { date: formatDate(locale, iso, { day: 'numeric', month: 'short' }) })
}

interface FriendPickerProps {
  friends: Friend[]
  usedIds: Set<string>
  onPick: (friendId: string) => void
  onClose: () => void
}

export function FriendPicker({ friends, usedIds, onPick, onClose }: FriendPickerProps) {
  const t = useT()
  const { locale } = useLocale()
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = friends.filter((f) => f.name.toLowerCase().includes(q))

  return (
    <Sheet title={t('partieSetup.inviteFriend')} onClose={onClose}>
      <label className="relative mb-4 flex items-center">
        <Search className="pointer-events-none absolute left-3 size-4 text-stone-400" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('partieSetup.searchFriends')}
          aria-label={t('partieSetup.searchFriends')}
          className="h-12 w-full rounded-lg border-2 border-stone-300 bg-white pl-9 pr-3 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-950"
        />
      </label>
      {friends.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-500">
          {t('partieSetup.noFriends')}{' '}
          <Link to={routes.friends} className="font-semibold text-teal-700 underline dark:text-teal-300">
            {t('friends.manage')}
          </Link>
        </p>
      ) : shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-500">{t('partieSetup.noFriendMatch', { query })}</p>
      ) : (
        <ul className="divide-y divide-stone-200 dark:divide-stone-800">
          {shown.map((f) => {
            const used = usedIds.has(f.id)
            const s = STATUS[f.status]
            return (
              <li key={f.id}>
                <button
                  type="button"
                  disabled={used}
                  onClick={() => onPick(f.id)}
                  className="flex min-h-16 w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent dark:hover:bg-teal-950/40"
                >
                  <span className="relative">
                    <Avatar name={f.name} url={f.avatarUrl} />
                    <span className={`absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-stone-50 dark:border-stone-900 ${s.dot}`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{f.name}</span>
                    <span className="block text-xs text-stone-500">
                      {t(s.label)}
                      {f.status === 'offline' && f.lastSeen && ` · ${lastSeenLabel(t, locale, f.lastSeen)}`}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-teal-700 dark:text-teal-400">{used ? t('partieSetup.invited') : t('partieSetup.invite')}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Sheet>
  )
}
