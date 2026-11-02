import { Crown, Hammer, Lock, X } from 'lucide-react'
import type { City, Faction, Participant, UnitType } from '../types'
import { withBonus } from './bonus'
import { PARTICIPANT_HEX } from './hex'
import { UnitIcon } from './unitIcons'

interface CityPanelProps {
  city: City
  owner?: Participant
  isYours: boolean
  buildable: UnitType[]
  /** Owner's faction; its bonus may shorten build times */
  faction?: Faction
  disabled?: boolean
  onSetProduction?: (unitTypeId: string) => void
  onClose?: () => void
}

const DOMAIN_LABEL: Record<UnitType['domain'], string> = { land: 'Land', sea: 'See', air: 'Luft' }

export function CityPanel({ city, owner, isYours, buildable, faction, disabled, onSetProduction, onClose }: CityPanelProps) {
  const prod = city.production
  const current = prod ? buildable.find((t) => t.id === prod.unitTypeId) : undefined
  const total = prod ? prod.progress + prod.turnsRemaining : 0
  const color = owner ? PARTICIPANT_HEX[owner.color].base : '#a8a29e'

  return (
    <section
      aria-label={`Stadt ${city.name}`}
      className="pointer-events-auto flex max-h-full flex-col overflow-hidden rounded-t-2xl border border-stone-300 bg-white/95 shadow-2xl shadow-stone-900/30 backdrop-blur md:rounded-xl dark:border-stone-700 dark:bg-stone-900/95 dark:shadow-black/50"
    >
      <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-stone-300 md:hidden dark:bg-stone-600" />
      <header
        className="relative flex shrink-0 items-start gap-3 border-b-4 border-double border-stone-200 px-4 py-3 dark:border-stone-700"
        style={{ backgroundImage: `linear-gradient(100deg, ${color}26, transparent 60%)` }}
      >
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">
            {city.isCapital && <Crown className="size-3.5 text-amber-500" />}
            {city.isCapital ? 'Hauptstadt' : 'Stadt'} · {owner ? owner.name : 'Neutral'}
          </p>
          <h2 className="truncate font-['Big_Shoulders_Display'] text-3xl font-black uppercase leading-none tracking-wider">
            {city.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-100"
        >
          <X className="size-5" />
        </button>
      </header>

      {!isYours ? (
        <div className="flex items-center gap-3 p-4 text-sm text-stone-600 dark:text-stone-300">
          <Lock className="size-5 shrink-0 text-stone-400" />
          Erobere die Stadt mit einer Landeinheit, um hier Einheiten zu produzieren.
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-stone-200 p-4 dark:border-stone-700">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              <Hammer className="size-3.5" /> In Produktion
            </h3>
            {prod && current ? (
              <>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="font-['Big_Shoulders_Display'] text-xl font-bold uppercase tracking-wide">{current.name}</span>
                  <span className="font-['IBM_Plex_Mono'] text-sm text-amber-700 dark:text-amber-400">
                    noch {prod.turnsRemaining} {prod.turnsRemaining === 1 ? 'Runde' : 'Runden'}
                  </span>
                </div>
                <div className="flex gap-0.5" aria-label={`Fortschritt ${prod.progress} von ${total}`}>
                  {Array.from({ length: total }, (_, i) => (
                    <span
                      key={i}
                      className={`h-2.5 flex-1 rounded-sm ${
                        i < prod.progress ? 'bg-gradient-to-b from-amber-400 to-amber-600' : 'bg-stone-200 dark:bg-stone-800'
                      }`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="rounded-md border border-dashed border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                Die Fabriken stehen still. Wähle unten, was gebaut werden soll.
              </p>
            )}
          </div>

          <ul className="divide-y divide-stone-200 dark:divide-stone-800">
            {buildable.map((t) => {
              const active = prod?.unitTypeId === t.id
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    // picking the type already in production must not reset its progress
                    onClick={() => !active && onSetProduction?.(t.id)}
                    aria-pressed={active}
                    className={`flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      active
                        ? 'bg-amber-50 dark:bg-amber-950/40'
                        : 'hover:bg-teal-50 dark:hover:bg-teal-950/40'
                    }`}
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 ${
                        active ? 'border-amber-500 bg-amber-500 text-white' : 'border-stone-300 text-stone-600 dark:border-stone-600 dark:text-stone-300'
                      }`}
                    >
                      <UnitIcon unitTypeId={t.id} domain={t.domain} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 font-semibold">
                        {t.name}
                        {t.factionId && (
                          <span className="rounded bg-teal-100 px-1 py-px text-[10px] font-bold uppercase text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
                            Sonder
                          </span>
                        )}
                      </span>
                      <span className="block font-['IBM_Plex_Mono'] text-[11px] text-stone-500 dark:text-stone-400">
                        {DOMAIN_LABEL[t.domain]} · ST {t.strength} · AB {t.defense} · BW {t.movement}
                        {t.range != null && ` · RW ${t.range}`}
                        {t.capacity > 0 && ` · LD ${t.capacity}`}
                      </span>
                    </span>
                    <span className="shrink-0 text-right font-['IBM_Plex_Mono'] text-sm">
                      {withBonus(t, faction, 'productionTurns') !== t.productionTurns && (
                        <span className="mr-1 text-xs text-stone-400 line-through">{t.productionTurns}</span>
                      )}
                      <span className={withBonus(t, faction, 'productionTurns') !== t.productionTurns ? 'font-semibold text-amber-700 dark:text-amber-400' : ''}>
                        {withBonus(t, faction, 'productionTurns')}
                      </span>
                      <span className="block text-[10px] uppercase text-stone-500">Runden</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
