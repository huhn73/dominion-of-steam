import { useState } from 'react'
import { Search } from 'lucide-react'
import type { AiPersonality, Faction, Friend } from '../types'
import { FACTION_HEX } from './setup'
import { Avatar, FactionEmblem, Sheet } from './ui'

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
  return (
    <Sheet title="KI-Gegner wählen" onClose={onClose}>
      {personalities.length === 0 && <p className="py-8 text-center text-sm text-stone-500">Es sind keine KI-Gegner verfügbar.</p>}
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
                    {p.title} · {faction?.shortName}
                  </span>
                  {p.style.length > 0 && (
                    <span className="mt-2 flex flex-wrap gap-1">
                      {p.style.map((s) => (
                        <span key={s} className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                          {s}
                        </span>
                      ))}
                    </span>
                  )}
                  <span className="mt-2 line-clamp-3 text-sm text-stone-600 dark:text-stone-400">{p.description}</span>
                  {disabled && (
                    <span className="mt-2 block text-xs font-semibold text-stone-500">
                      {used ? 'Bereits in dieser Partie' : `${faction?.shortName} ist schon vergeben`}
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
  online: { label: 'Online', dot: 'bg-teal-500' },
  inGame: { label: 'Im Spiel', dot: 'bg-amber-500' },
  offline: { label: 'Offline', dot: 'bg-stone-400' },
} as const

function lastSeenLabel(iso: string | null) {
  if (!iso) return ''
  return `zuletzt ${new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' }).format(new Date(iso))}`
}

interface FriendPickerProps {
  friends: Friend[]
  usedIds: Set<string>
  onPick: (friendId: string) => void
  onClose: () => void
}

export function FriendPicker({ friends, usedIds, onPick, onClose }: FriendPickerProps) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = friends.filter((f) => f.name.toLowerCase().includes(q))

  return (
    <Sheet title="Freund einladen" onClose={onClose}>
      <label className="relative mb-4 flex items-center">
        <Search className="pointer-events-none absolute left-3 size-4 text-stone-400" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Freunde durchsuchen"
          aria-label="Freunde durchsuchen"
          className="h-12 w-full rounded-lg border-2 border-stone-300 bg-white pl-9 pr-3 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-950"
        />
      </label>
      {friends.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-500">Du hast noch keine Freunde. Lade Mitspieler stattdessen über den Einladungslink ein.</p>
      ) : shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-500">Kein Freund mit „{query}“ gefunden.</p>
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
                      {s.label}
                      {f.status === 'offline' && f.lastSeen && ` · ${lastSeenLabel(f.lastSeen)}`}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-teal-700 dark:text-teal-400">{used ? 'Eingeladen' : 'Einladen'}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Sheet>
  )
}
