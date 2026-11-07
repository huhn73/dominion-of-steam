import { ArrowRight, ChevronRight } from 'lucide-react'
import type { Faction, UnitType } from '../types'
import { DOMAIN_LABEL, FACTION_HEX, type BonusEffect } from './theme'
import { UnitIcon } from './unitIcons'
import { useFirstLoadedImage, useLoadedImages } from './useImageLoaded'
import { useT } from '../../../i18n'

interface UnitRowProps {
  unit: UnitType
  /** Faction the unit belongs to, for the special unit badge */
  owner?: Faction
  /** Bonus effect to show next to the base value */
  bonus?: BonusEffect | null
  /** Illustration candidates in order of preference; the first existing one replaces the icon */
  imageUrls?: (string | null | undefined)[]
  /** Faction looks to cross-fade between instead of `imageUrls` (frame in the faction color) */
  variants?: UnitImageVariant[]
  /** Index into `variants` shown now; the list advances it for all rows at once */
  activeVariant?: number
  onSelect?: () => void
}

export interface UnitImageVariant {
  url: string
  color: string
}

const STATS = [
  { key: 'strength', label: 'compendium.abbr.strength', title: 'compendium.stat.strength' },
  { key: 'defense', label: 'compendium.abbr.defense', title: 'compendium.stat.defense' },
  { key: 'hitPoints', label: 'compendium.abbr.hitPoints', title: 'compendium.stat.hitPoints' },
  { key: 'damage', label: 'compendium.abbr.damage', title: 'compendium.title.damage' },
  { key: 'movement', label: 'compendium.abbr.movement', title: 'compendium.stat.movement' },
  { key: 'productionTurns', label: 'compendium.abbr.productionTurns', title: 'compendium.title.productionTurns' },
] as const

const FRAME = 'relative h-18 w-24 shrink-0 overflow-hidden rounded-md border-2 border-stone-900 dark:border-stone-700'

/** Faction looks stacked in one frame; the active one is opaque, the others fade out */
function VariantImages({ variants, active }: { variants: UnitImageVariant[]; active: number }) {
  const loaded = useLoadedImages(variants.map((v) => v.url))
  const current = variants[active]
  if (!current || !loaded.includes(current.url)) return null
  return (
    <span
      data-testid="unit-variants"
      className={`${FRAME} transition-[border-color] duration-[1500ms]`}
      style={{ borderColor: current.color }}
    >
      {variants.map((v, i) =>
        loaded.includes(v.url) ? (
          <img
            key={v.url}
            src={v.url}
            alt=""
            className={`absolute inset-0 size-full object-cover transition-opacity duration-[1500ms] ${i === active ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : null,
      )}
    </span>
  )
}

export function UnitRow({ unit, owner, bonus, imageUrls = [], variants, activeVariant = 0, onSelect }: UnitRowProps) {
  const t = useT()
  const color = owner ? FACTION_HEX[owner.color] : null
  const image = useFirstLoadedImage(variants ? [] : imageUrls)
  const variantImages = variants ? <VariantImages variants={variants} active={activeVariant} /> : null
  const meta = [
    t(DOMAIN_LABEL[unit.domain]),
    unit.capacity > 0 &&
      t('compendium.cargo', {
        count: unit.capacity,
        kind: { key: unit.cargoDomain === 'air' ? 'compendium.unit.aircraft' : 'compendium.domainUnits.land' },
      }),
    unit.range != null && t('compendium.rangeN', { count: unit.range }),
  ].filter((part): part is string => !!part)

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group @container flex w-full flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border border-stone-200 bg-white px-4 py-3 text-left transition hover:-translate-y-px hover:border-teal-500 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-teal-500"
    >
      {variantImages ??
        (image ? (
          <img src={image} alt="" className={`${FRAME} object-cover`} style={color ? { borderColor: color.base } : undefined} />
        ) : (
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-full border-[3px] border-amber-700 bg-stone-900 text-amber-300 dark:border-amber-600"
            style={color ? { borderColor: color.base, color: color.base } : undefined}
          >
            <UnitIcon unitTypeId={unit.id} domain={unit.domain} className="size-6" strokeWidth={2.2} />
          </span>
        ))}

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 break-words font-['Big_Shoulders_Display'] text-lg font-extrabold uppercase leading-none tracking-wider hyphens-auto">
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
        <span className="mt-1 flex flex-wrap gap-x-1.5 text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400">
          {meta.map((part, i) => (
            <span key={part} className="whitespace-nowrap">
              {i > 0 && '· '}
              {part}
            </span>
          ))}
        </span>
      </span>

      <span className="flex w-full items-center gap-1.5 @2xl:w-auto">
        {[...STATS, ...(bonus?.stat === 'range' ? [{ key: 'range', label: 'compendium.abbr.range', title: 'compendium.stat.range' } as const] : [])].map((s) => {
          const changed = bonus?.stat === s.key ? bonus : null
          return (
            <span
              key={s.key}
              title={t(s.title)}
              className={`flex min-w-12 flex-1 flex-col items-center rounded border px-2 py-1 @2xl:min-w-14 @2xl:flex-none ${
                changed
                  ? 'border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/40'
                  : 'border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950/50'
              }`}
            >
              <span className="text-[9px] font-bold tracking-widest text-stone-500 dark:text-stone-400">{t(s.label)}</span>
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
        <ChevronRight className="hidden size-5 shrink-0 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-teal-600 @2xl:block dark:text-stone-600" />
      </span>
    </button>
  )
}
