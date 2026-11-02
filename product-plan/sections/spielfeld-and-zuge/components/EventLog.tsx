import { AlertTriangle, Binoculars, ChevronDown, Flag, Fuel, Hammer, ScrollText, Skull, Swords } from 'lucide-react'
import type { GameEvent, GameEventType } from '../types'

interface EventLogProps {
  events: GameEvent[]
  open: boolean
  onToggle: () => void
  onSelect: (event: GameEvent) => void
}

const EVENT_STYLE: Record<GameEventType, { icon: typeof Flag; className: string }> = {
  enemySighted: { icon: Binoculars, className: 'text-sky-600 dark:text-sky-400' },
  combat: { icon: Swords, className: 'text-amber-600 dark:text-amber-400' },
  cityLost: { icon: AlertTriangle, className: 'text-rose-600 dark:text-rose-400' },
  cityCaptured: { icon: Flag, className: 'text-teal-600 dark:text-teal-400' },
  unitBuilt: { icon: Hammer, className: 'text-teal-600 dark:text-teal-400' },
  unitLost: { icon: Skull, className: 'text-rose-600 dark:text-rose-400' },
  fuelLow: { icon: Fuel, className: 'text-amber-600 dark:text-amber-400' },
}

export function EventLog({ events, open, onToggle, onSelect }: EventLogProps) {
  const newCount = events.filter((e) => e.isNew).length

  return (
    <div className="pointer-events-auto w-[min(22rem,calc(100vw-2rem))]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-11 items-center gap-2 rounded-lg border border-stone-300 bg-white/90 px-3 shadow-lg backdrop-blur transition-colors hover:border-teal-500 dark:border-stone-700 dark:bg-stone-900/90"
      >
        <ScrollText className="size-4 text-stone-600 dark:text-stone-300" />
        <span className="font-['Big_Shoulders_Display'] text-sm font-bold uppercase tracking-widest">Ereignisse</span>
        {newCount > 0 && (
          <span className="rounded-full bg-amber-500 px-1.5 font-['IBM_Plex_Mono'] text-[11px] font-semibold text-stone-950">
            {newCount} neu
          </span>
        )}
        <ChevronDown className={`size-4 text-stone-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ol className="mt-2 max-h-[45vh] overflow-y-auto rounded-lg border border-stone-300 bg-white/95 shadow-xl backdrop-blur dark:border-stone-700 dark:bg-stone-900/95">
          {events.length === 0 && (
            <li className="px-4 py-3 text-sm text-stone-500">Keine Ereignisse seit deinem letzten Zug.</li>
          )}
          {events.map((e) => {
            const { icon: Icon, className } = EVENT_STYLE[e.type]
            return (
              <li key={e.id} className="border-b border-stone-200 last:border-0 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => onSelect(e)}
                  className={`flex min-h-11 w-full items-start gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-teal-50 dark:hover:bg-teal-950/40 ${
                    e.isNew ? '' : 'opacity-60'
                  }`}
                >
                  <Icon className={`mt-0.5 size-4 shrink-0 ${className}`} />
                  <span className="flex-1 leading-snug">{e.message}</span>
                  <span className="shrink-0 font-['IBM_Plex_Mono'] text-[10px] text-stone-500">R{e.round}</span>
                </button>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
