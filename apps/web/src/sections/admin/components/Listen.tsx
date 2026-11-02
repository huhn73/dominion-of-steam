import type { ReactNode } from 'react'
import type { AdminMatchRow, AdminPlayerRow } from '@dos/shared/admin'
import { Avatar, formatDate } from '../../profil/components'

const when = (iso: string | null) =>
  iso
    ? formatDate(iso, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '–'

const STATUS: Record<AdminMatchRow['status'], string> = {
  waiting: 'Wartet',
  running: 'Läuft',
  finished: 'Beendet',
}
const MODE: Record<AdminMatchRow['mode'], string> = { live: 'Live', async: 'Async' }

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
  return (
    <Tabelle
      caption="Zuletzt aktive Konten"
      head={['Name', 'Registriert', 'Zuletzt gesehen', 'Bestätigt', 'Partien']}
      empty="Noch keine Konten."
    >
      {players.map((p) => (
        <tr key={p.id}>
          <td className={td}>
            <span className="flex items-center gap-2.5">
              <Avatar name={p.name} url={p.avatarUrl} className="size-7 text-xs" />
              <span className="font-semibold">{p.name}</span>
            </span>
          </td>
          <td className={`${td} ${mono}`}>{formatDate(p.createdAt)}</td>
          <td className={`${td} ${mono}`}>{when(p.lastSeenAt)}</td>
          <td className={td}>
            {p.emailVerified ? 'Ja' : <span className="text-stone-500">Nein</span>}
          </td>
          <td className={`${td} ${mono}`}>{p.matches}</td>
        </tr>
      ))}
    </Tabelle>
  )
}

export function PartienListe({ matches }: { matches: AdminMatchRow[] }) {
  return (
    <Tabelle
      caption="Zuletzt aktualisierte Partien"
      head={['Partie', 'Modus', 'Status', 'Runde', 'Menschen / KI', 'Aktualisiert']}
      empty="Noch keine Partien."
    >
      {matches.map((m) => (
        <tr key={m.id}>
          <td className={`${td} font-semibold`}>{m.name}</td>
          <td className={td}>{MODE[m.mode]}</td>
          <td className={td}>{STATUS[m.status]}</td>
          <td className={`${td} ${mono}`}>{m.round}</td>
          <td className={`${td} ${mono}`}>
            {m.humans} / {m.ais}
          </td>
          <td className={`${td} ${mono}`}>{when(m.updatedAt)}</td>
        </tr>
      ))}
    </Tabelle>
  )
}
