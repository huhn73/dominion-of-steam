import { Crown, Flame, Hammer, Lock, Shield, X } from 'lucide-react'
import { MAX_CITY_DAMAGE } from '@dos/shared/game/rules'
import type { City, Faction, Participant, Unit, UnitType } from '../types'
import type { ProductionOverview } from './selection'
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
  /** Units inside the city (own or visible enemies) */
  garrison?: { unit: Unit; type?: UnitType }[]
  /** Realm-wide stock and builds, shown in the production picker */
  overview?: ProductionOverview
  onSelectUnit?: (unitId: string) => void
  onSetProduction?: (unitTypeId: string) => void
  onClose?: () => void
}

const ORDER_LABEL: Record<Unit['order']['type'], string> = {
  none: 'kein Befehl',
  sentry: 'Wache',
  goto: 'marschiert',
  patrol: 'Patrouille',
  explore: 'Erkundung',
}

/** Up to two city names, the rest as „+N“ */
function cityList(names: string[]) {
  const shown = names.slice(0, 2).join(', ')
  return names.length > 2 ? `${shown}, +${names.length - 2}` : shown
}

const DOMAIN_LABEL: Record<UnitType['domain'], string> = { land: 'Land', sea: 'See', air: 'Luft' }

export function CityPanel({
  city,
  owner,
  isYours,
  buildable,
  faction,
  disabled,
  garrison = [],
  overview,
  onSelectUnit,
  onSetProduction,
  onClose,
}: CityPanelProps) {
  const prod = city.production
  const current = prod ? buildable.find((t) => t.id === prod.unitTypeId) : undefined
  const total = prod ? prod.progress + prod.turnsRemaining : 0
  /** Build time with faction bonus and the delay from damage */
  // Sample data from the design hand-over predates `damage`
  const damage = city.damage ?? 0
  const buildTurns = (t: UnitType) => (withBonus(t, faction, 'productionTurns') ?? t.productionTurns) + damage
  const color = owner ? PARTICIPANT_HEX[owner.color].base : '#a8a29e'

  const garrisonSection = garrison.length > 0 && (
    <div className="border-b border-stone-200 p-4 dark:border-stone-700">
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
        <Shield className="size-3.5" /> Garnison
        <span className="ml-auto font-['IBM_Plex_Mono'] normal-case tracking-normal">{garrison.length}</span>
      </h3>
      <ul className="space-y-1" aria-label="Garnison">
        {garrison.map(({ unit: u, type: t }) => (
          <li key={u.id}>
            <button
              type="button"
              onClick={() => onSelectUnit?.(u.id)}
              className="flex min-h-9 w-full items-center gap-2 rounded bg-stone-100 px-2 py-1 text-left hover:bg-teal-50 dark:bg-stone-800 dark:hover:bg-teal-950/40"
            >
              <UnitIcon unitTypeId={u.unitTypeId} domain={t?.domain} className="size-4 text-stone-500" />
              <span className="flex-1 text-sm">{t?.name}</span>
              {u.ownerId === city.ownerId && isYours && (
                <span className="text-[11px] uppercase tracking-wide text-teal-700 dark:text-teal-400">{ORDER_LABEL[u.order.type]}</span>
              )}
              <span className="font-['IBM_Plex_Mono'] text-xs text-stone-500">{u.hp}/{t?.hitPoints}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )

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
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex items-center gap-3 p-4 text-sm text-stone-600 dark:text-stone-300">
            <Lock className="size-5 shrink-0 text-stone-400" />
            Erobere die Stadt mit einer Landeinheit, um hier Einheiten zu produzieren.
          </div>
          {garrisonSection}
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
            {damage > 0 && (
              <p
                role="status"
                className="mt-3 flex items-center gap-2 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
              >
                <Flame className="size-4 shrink-0" />
                <span>
                  <strong>Beschädigt {damage}/{MAX_CITY_DAMAGE}</strong> · Bauzeiten +{damage}{' '}
                  {damage === 1 ? 'Runde' : 'Runden'}, heilt in Runden ohne Angriff
                </span>
              </p>
            )}
          </div>

          {garrisonSection}

          {overview && (
            <p className="flex items-center justify-between px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Bauauftrag
              <span className="font-['IBM_Plex_Mono'] normal-case tracking-normal">
                Reichsweit {overview.owned} {overview.owned === 1 ? 'Einheit' : 'Einheiten'} · {overview.building} im Bau
              </span>
            </p>
          )}
          <ul className="divide-y divide-stone-200 dark:divide-stone-800">
            {buildable.map((t) => {
              const active = prod?.unitTypeId === t.id
              const stock = overview?.byType.get(t.id) ?? { owned: 0, building: [] }
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
                        {DOMAIN_LABEL[t.domain]} · ST {t.strength} · AB {t.defense} · TP {t.hitPoints} · BW {t.movement}
                        {t.range != null && ` · RW ${t.range}`}
                        {t.capacity > 0 && ` · LD ${t.capacity}`}
                      </span>
                      {overview && (
                        <span className="block text-[11px] text-stone-500 dark:text-stone-400">
                          <span className={stock.owned === 0 ? 'opacity-60' : ''}>Bestand {stock.owned}</span>
                          {' · '}
                          <span className={stock.building.length > 0 ? 'font-semibold text-amber-700 dark:text-amber-400' : 'opacity-60'}>
                            {stock.building.length} im Bau
                          </span>
                          {stock.building.length > 0 && ` (${cityList(stock.building)})`}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-right font-['IBM_Plex_Mono'] text-sm">
                      {buildTurns(t) !== t.productionTurns && (
                        <span className="mr-1 text-xs text-stone-400 line-through">{t.productionTurns}</span>
                      )}
                      <span
                        className={
                          buildTurns(t) < t.productionTurns
                            ? 'font-semibold text-amber-700 dark:text-amber-400'
                            : buildTurns(t) > t.productionTurns
                              ? 'font-semibold text-rose-700 dark:text-rose-400'
                              : ''
                        }
                      >
                        {buildTurns(t)}
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
