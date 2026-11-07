import type { ReactNode } from 'react'
import type { AdminMatchRow, AdminPlayerRow } from '@dos/shared/admin'
import { Avatar, formatDate } from '../../profil/components'
import type { Locale } from '@dos/shared/i18n'
import { useLocale, useT } from '../../../i18n'

const when = (locale: Locale, iso: string | null) =>
  iso
    ? formatDate(locale, iso, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '–'

const th =
  'px-3 py-2 text-left text-[11px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400'
const td = 'px-3 py-2.5 align-middle'
const mono = "font-['IBM_Plex_Mono'] text-sm"

function Tabelle({
  caption,
  head,
  children,
  empty,
}: {
  caption: string
  head: string[]
  children: ReactNode[]
  empty: string
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <table className="w-full min-w-[36rem] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-stone-200 dark:border-stone-800">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
          {children.length > 0 ? (
            children
          ) : (
            <tr>
              <td colSpan={head.length} className={`${td} text-stone-500`}>
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export function KontenListe({ players }: { players: AdminPlayerRow[] }) {
  const t = useT()
  const { locale } = useLocale()
  return (
    <Tabelle
      caption={t('admin.recentPlayers')}
      head={[t('admin.col.name'), t('admin.col.registered'), t('admin.col.lastSeen'), t('admin.col.verified'), t('admin.col.matches')]}
      empty={t('admin.noPlayers')}
    >
      {players.map((p) => (
        <tr key={p.id}>
          <td className={td}>
            <span className="flex items-center gap-2.5">
              <Avatar name={p.name} url={p.avatarUrl} className="size-7 text-xs" />
              <span className="font-semibold">{p.name}</span>
            </span>
          </td>
          <td className={`${td} ${mono}`}>{formatDate(locale, p.createdAt)}</td>
          <td className={`${td} ${mono}`}>{when(locale, p.lastSeenAt)}</td>
          <td className={td}>
            {p.emailVerified ? t('admin.yes') : <span className="text-stone-500">{t('admin.no')}</span>}
          </td>
          <td className={`${td} ${mono}`}>{p.matches}</td>
        </tr>
      ))}
    </Tabelle>
  )
}

export function PartienListe({ matches }: { matches: AdminMatchRow[] }) {
  const t = useT()
  const { locale } = useLocale()
  return (
    <Tabelle
      caption={t('admin.recentMatches')}
      head={[t('admin.col.match'), t('admin.col.mode'), t('admin.col.status'), t('admin.col.round'), t('admin.col.humansAi'), t('admin.col.updated')]}
      empty={t('admin.noMatches')}
    >
      {matches.map((m) => (
        <tr key={m.id}>
          <td className={`${td} font-semibold`}>{m.name}</td>
          <td className={td}>{t(`admin.mode.${m.mode}`)}</td>
          <td className={td}>{t(`admin.status.${m.status}`)}</td>
          <td className={`${td} ${mono}`}>{m.round}</td>
          <td className={`${td} ${mono}`}>
            {m.humans} / {m.ais}
          </td>
          <td className={`${td} ${mono}`}>{when(locale, m.updatedAt)}</td>
        </tr>
      ))}
    </Tabelle>
  )
}
