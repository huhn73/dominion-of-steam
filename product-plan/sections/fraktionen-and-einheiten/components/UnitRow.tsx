import { ArrowRight, ChevronRight } from 'lucide-react'
import type { Faction, UnitType } from '../types'
import { DOMAIN_LABEL, FACTION_HEX, type BonusEffect } from './theme'
import { UnitIcon } from './unitIcons'
import { useFirstLoadedImage } from './useImageLoaded'

interface UnitRowProps {
  unit: UnitType
  /** Faction the unit belongs to, for the special unit badge */
  owner?: Faction
  /** Bonus effect to show next to the base value */
  bonus?: BonusEffect | null
  /** Illustration candidates in order of preference; the first existing one replaces the icon */
  imageUrls?: (string | null)[]
  onSelect?: () => void
}

const STATS = [
  { key: 'strength', label: 'ST', title: 'Stärke' },
  { key: 'defense', label: 'AB', title: 'Abwehr' },
  { key: 'movement', label: 'BW', title: 'Bewegung' },
  { key: 'productionTurns', label: 'BAU', title: 'Bauzeit in Runden' },
] as const

export function UnitRow({ unit, owner, bonus, imageUrls = [], onSelect }: UnitRowProps) {
  const color = owner ? FACTION_HEX[owner.color] : null
  const image = useFirstLoadedImage(imageUrls)

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-stone-200 bg-white px-4 py-3 text-left transition hover:-translate-y-px hover:border-teal-500 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 sm:flex-nowrap dark:border-stone-800 dark:bg-stone-900 dark:hover:border-teal-500"
    >
      {image ? (
        <img
          src={image}
          alt=""
          className="h-12 w-16 shrink-0 rounded-md border-2 border-stone-900 object-cover dark:border-stone-700"
          style={color ? { borderColor: color.base } : undefined}
        />
      ) : (
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-full border-[3px] border-amber-700 bg-stone-900 text-amber-300 dark:border-amber-600"
          style={color ? { borderColor: color.base, color: color.base } : undefined}
        >
          <UnitIcon unitTypeId={unit.id} domain={unit.domain} className="size-5" strokeWidth={2.2} />
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-['Big_Shoulders_Display'] text-lg font-extrabold uppercase leading-none tracking-wider">
            {unit.name}
          </span>
          {owner && color && (
            <span
              className="rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: color.base, color: '#1c1917' }}
            >
              Sondereinheit · {owner.shortName}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400">
          {DOMAIN_LABEL[unit.domain]}
          {unit.capacity > 0 && ` · Ladung ${unit.capacity} ${unit.cargoDomain === 'air' ? 'Flugzeuge' : 'Landeinheiten'}`}
          {unit.range != null && ` · Reichweite ${unit.range}`}
        </span>
      </span>

      <span className="flex w-full items-center gap-1.5 sm:w-auto">
        {[...STATS, ...(bonus?.stat === 'range' ? [{ key: 'range', label: 'RW', title: 'Reichweite' } as const] : [])].map((s) => {
          const changed = bonus?.stat === s.key ? bonus : null
          return (
            <span
              key={s.key}
              title={s.title}
              className={`flex min-w-14 flex-1 flex-col items-center rounded border px-2 py-1 sm:flex-none ${
                changed
                  ? 'border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/40'
                  : 'border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950/50'
              }`}
            >
              <span className="text-[9px] font-bold tracking-widest text-stone-500 dark:text-stone-400">{s.label}</span>
              <span className="flex items-center gap-0.5 font-['IBM_Plex_Mono'] text-sm font-semibold">
                {changed ? (
                  <>
                    <span className="text-xs text-stone-400 line-through">{changed.base}</span>
                    <ArrowRight className="size-3 text-amber-600" />
                    <span className="text-amber-700 dark:text-amber-400">{changed.value}</span>
                  </>
                ) : (
                  (unit[s.key] ?? '–')
                )}
              </span>
            </span>
          )
        })}
        <ChevronRight className="hidden size-5 shrink-0 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-teal-600 sm:block dark:text-stone-600" />
      </span>
    </button>
  )
}
