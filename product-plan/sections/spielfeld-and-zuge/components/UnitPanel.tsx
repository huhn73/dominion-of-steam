import { Check, Eye, Flag, Fuel, PackageOpen, PlaneTakeoff, Repeat, SkipForward, X, XCircle } from 'lucide-react'
import type { Faction, Participant, Unit, UnitType } from '../types'
import { PARTICIPANT_HEX } from './hex'
import { UnitIcon } from './unitIcons'

interface UnitPanelProps {
  unit: Unit
  type: UnitType
  owner?: Participant
  faction?: Faction
  isYours: boolean
  cargo: { unit: Unit; type?: UnitType }[]
  mode: 'normal' | 'patrol' | 'unload'
  patrolCount: number
  disabled?: boolean
  onSentry?: () => void
  onPatrolStart?: () => void
  onPatrolConfirm?: () => void
  onCancelMode?: () => void
  onCancelOrder?: () => void
  onSkip?: () => void
  onUnloadStart?: (cargoUnitId: string) => void
  /** Select an aircraft on a carrier so it can take off */
  onSelectCargo?: (cargoUnitId: string) => void
  onClose?: () => void
}

const ORDER_LABEL: Record<Unit['order']['type'], string> = {
  none: 'Kein Befehl',
  sentry: 'Auf Wache',
  goto: 'Marschiert',
  patrol: 'Patrouille',
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded border border-stone-200 bg-stone-50 px-2 py-1.5 dark:border-stone-700 dark:bg-stone-950/60">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">{label}</div>
      <div className="font-['IBM_Plex_Mono'] text-base font-semibold text-stone-900 dark:text-stone-100">
        {value}
        {sub && <span className="text-xs font-normal text-stone-500 dark:text-stone-400">{sub}</span>}
      </div>
    </div>
  )
}

function OrderButton({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
}: {
  icon: typeof Eye
  label: string
  onClick?: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-md border px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200'
          : 'border-stone-300 bg-white text-stone-700 hover:border-teal-500 hover:text-teal-700 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:hover:text-teal-300'
      }`}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}

export function UnitPanel({
  unit,
  type,
  owner,
  faction,
  isYours,
  cargo,
  mode,
  patrolCount,
  disabled,
  onSentry,
  onPatrolStart,
  onPatrolConfirm,
  onCancelMode,
  onCancelOrder,
  onSkip,
  onUnloadStart,
  onSelectCargo,
  onClose,
}: UnitPanelProps) {
  const color = PARTICIPANT_HEX[owner?.color ?? 'amber']

  return (
    <section
      aria-label={`Einheit ${type.name}`}
      className="pointer-events-auto overflow-hidden rounded-t-2xl border border-stone-300 bg-white/95 shadow-2xl shadow-stone-900/30 backdrop-blur md:rounded-xl dark:border-stone-700 dark:bg-stone-900/95 dark:shadow-black/50"
    >
      <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-stone-300 md:hidden dark:bg-stone-600" />
      <header className="flex items-center gap-3 border-b-4 border-double border-stone-200 px-4 py-3 dark:border-stone-700">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-full border-[3px]"
          style={{ background: color.base, borderColor: isYours ? '#b45309' : '#1c1917' }}
        >
          <UnitIcon unitTypeId={type.id} domain={type.domain} className="size-5 text-white" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-['Big_Shoulders_Display'] text-xl font-black uppercase leading-tight tracking-wider">
            {type.name}
          </h2>
          <p className="truncate text-xs text-stone-500 dark:text-stone-400">
            {owner?.name}
            {faction && <> · {faction.name}</>}
            {type.factionId && <span className="ml-1.5 rounded bg-amber-100 px-1 py-px text-[10px] font-bold uppercase text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">Sondereinheit</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          className="flex size-11 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-100"
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-4 gap-1.5">
          <Stat label="Stärke" value={type.strength} />
          <Stat label="Abwehr" value={type.defense} />
          <Stat label="Bewegung" value={isYours ? unit.movesLeft : type.movement} sub={isYours ? `/${type.movement}` : undefined} />
          <Stat label="Zustand" value={`${unit.health}`} sub="%" />
        </div>

        {type.range != null && unit.fuel != null && (
          <div className="flex items-center gap-2 text-sm">
            <Fuel className={`size-4 ${unit.fuel <= type.range / 2 ? 'text-rose-500' : 'text-stone-500'}`} />
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
              <div
                className={`h-full rounded-full ${unit.fuel <= type.range / 2 ? 'bg-rose-500' : 'bg-teal-500'}`}
                style={{ width: `${(unit.fuel / type.range) * 100}%` }}
              />
            </div>
            <span className="font-['IBM_Plex_Mono'] text-xs">
              {unit.fuel}/{type.range}
            </span>
          </div>
        )}

        {isYours && (
          <p className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
            <span className="font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">{ORDER_LABEL[unit.order.type]}</span>
            {unit.order.type === 'goto' && <span>· noch {unit.order.turnsRemaining} Runden bis zum Ziel</span>}
            {unit.order.type === 'patrol' && <span>· {unit.order.waypoints.length} Wegpunkte</span>}
          </p>
        )}

        {type.capacity > 0 && (
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">Ladung</h3>
              <span className="font-['IBM_Plex_Mono'] text-xs text-stone-500">
                {cargo.length}/{type.capacity}
              </span>
            </div>
            {cargo.length === 0 ? (
              <p className="rounded border border-dashed border-stone-300 px-3 py-2 text-sm text-stone-500 dark:border-stone-700">
                {type.cargoDomain === 'air'
                  ? 'Leer. Lass Flugzeuge auf dem Träger landen, um sie aufzutanken und mitzunehmen.'
                  : 'Leer. Ziehe Landeinheiten auf den Frachter, um sie zu laden.'}
              </p>
            ) : (
              <ul className="space-y-1">
                {cargo.map(({ unit: c, type: ct }) => {
                  return (
                    <li key={c.id} className="flex items-center gap-2 rounded bg-stone-100 px-2 py-1 dark:bg-stone-800">
                      <UnitIcon unitTypeId={c.unitTypeId} domain={ct?.domain} className="size-4 text-stone-500" />
                      <span className="flex-1 text-sm">{ct?.name}</span>
                      <span className="font-['IBM_Plex_Mono'] text-xs text-stone-500">{c.health} %</span>
                      {isYours && (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => (type.cargoDomain === 'air' ? onSelectCargo?.(c.id) : onUnloadStart?.(c.id))}
                          className="flex min-h-9 items-center gap-1 rounded px-2 text-xs font-semibold uppercase text-teal-700 hover:bg-teal-50 disabled:opacity-40 dark:text-teal-300 dark:hover:bg-teal-950"
                        >
                          {type.cargoDomain === 'air' ? (
                            <>
                              <PlaneTakeoff className="size-4" /> Starten
                            </>
                          ) : (
                            <>
                              <PackageOpen className="size-4" /> Ausladen
                            </>
                          )}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {isYours && mode === 'patrol' && (
          <div className="rounded-md border border-teal-400 bg-teal-50 p-3 text-sm dark:bg-teal-950/60">
            <p className="mb-2 text-teal-900 dark:text-teal-100">
              Tippe auf der Karte die Wegpunkte der Patrouille an ({patrolCount} gesetzt).
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancelMode}
                className="min-h-11 flex-1 rounded-md border border-stone-300 bg-white text-sm font-semibold dark:border-stone-600 dark:bg-stone-800"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={onPatrolConfirm}
                disabled={patrolCount < 1}
                className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-md bg-teal-600 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-40"
              >
                <Check className="size-4" /> Bestätigen
              </button>
            </div>
          </div>
        )}

        {isYours && mode === 'unload' && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-teal-400 bg-teal-50 p-3 text-sm text-teal-900 dark:bg-teal-950/60 dark:text-teal-100">
            Tippe auf ein markiertes Landfeld zum Ausladen.
            <button type="button" onClick={onCancelMode} className="min-h-9 rounded px-2 font-semibold underline">
              Abbrechen
            </button>
          </div>
        )}

        {isYours && mode === 'normal' && (
          <div className="flex gap-1.5">
            <OrderButton icon={Eye} label="Wache" onClick={onSentry} active={unit.order.type === 'sentry'} disabled={disabled} />
            <OrderButton icon={Repeat} label="Patrouille" onClick={onPatrolStart} active={unit.order.type === 'patrol'} disabled={disabled} />
            <OrderButton icon={XCircle} label="Aufheben" onClick={onCancelOrder} disabled={disabled || unit.order.type === 'none'} />
            <OrderButton icon={SkipForward} label="Überspringen" onClick={onSkip} disabled={disabled || !unit.needsOrders} />
          </div>
        )}

        {isYours && mode === 'normal' && unit.order.type === 'none' && !disabled && (
          <p className="flex items-start gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <Flag className="mt-px size-3.5 shrink-0" />
            <span>
              Ziel antippen oder Einheit ziehen. Ziele außerhalb der Reichweite werden zum Mehrrunden-Marsch.
              <span className="hidden md:inline"> Rechtsklick oder Esc bricht ab.</span>
            </span>
          </p>
        )}
      </div>
    </section>
  )
}
