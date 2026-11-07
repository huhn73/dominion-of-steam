import { useMemo, useState } from 'react'
import { ChevronDown, Filter, Layers, Plane, Shield, Ship, X } from 'lucide-react'
import type { FraktionenUndEinheitenProps, UnitDomain } from '../types'
import { FactionEmblem } from './FactionEmblem'
import { FACTION_HEX } from './theme'
import { UnitRow } from './UnitRow'
import type { MessageKey } from '@dos/shared/i18n'
import { unitImageCandidates, unitThumbUrl, useImageLoaded, useVariantCycle } from './useImageLoaded'
import { useT } from '../../../i18n'

type DomainFilter = 'all' | UnitDomain
/** 'all', 'general' or a faction id (its special units) */
type OriginFilter = string

/** Faction hero image in the card's color band, once it exists */
function CardImage({ url, deep }: { url: string | null; deep: string }) {
  const loaded = useImageLoaded(url)
  if (!loaded || !url) return null
  return (
    <>
      <img src={url} alt="" className="absolute inset-0 size-full object-cover object-right animate-in fade-in" />
      <span className="absolute inset-0" style={{ background: `linear-gradient(0deg, ${deep}e6 0%, ${deep}40 60%, transparent 100%)` }} />
    </>
  )
}

const DOMAIN_FILTERS: { value: DomainFilter; label: MessageKey; icon: typeof Shield }[] = [
  { value: 'all', label: 'compendium.filter.all', icon: Layers },
  { value: 'land', label: 'compendium.domain.land', icon: Shield },
  { value: 'sea', label: 'compendium.domain.sea', icon: Ship },
  { value: 'air', label: 'compendium.domain.air', icon: Plane },
]

export function FraktionenUndEinheiten({ factions, unitTypes, onSelectFaction, onSelectUnitType }: FraktionenUndEinheitenProps) {
  const t = useT()
  const [domain, setDomain] = useState<DomainFilter>('all')
  const [origin, setOrigin] = useState<OriginFilter>('all')

  const factionById = useMemo(() => new Map(factions.map((f) => [f.id, f])), [factions])
  const filtered = unitTypes.filter(
    (u) =>
      (domain === 'all' || u.domain === domain) &&
      (origin === 'all' || (origin === 'general' ? u.factionId === null : u.factionId === origin)),
  )
  const isFiltered = domain !== 'all' || origin !== 'all'
  // General units cross-fade through the factions' looks, all rows in step
  const cycleFaction = factions[useVariantCycle(factions.length)]
  const variantsOf = (u: (typeof unitTypes)[number]) =>
    factions
      .filter((f) => u.variantIllustrationUrls[f.id])
      .map((f) => ({
        factionId: f.id,
        url: unitThumbUrl(u.variantIllustrationUrls[f.id]!),
        color: FACTION_HEX[f.color].base,
      }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Title */}
      <header className="mb-10 max-w-3xl">
        <p className="mb-2 flex items-center gap-3 font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.3em] text-teal-700 dark:text-teal-400">
          <span className="h-px w-8 bg-current" /> {t('compendium.kicker')}
        </p>
        <h1 className="font-['Big_Shoulders_Display'] text-5xl font-black uppercase leading-[0.9] tracking-wide sm:text-7xl">
          {t('compendium.titleFactions')} <span className="text-amber-600 dark:text-amber-500">&amp;</span> {t('compendium.titleUnits')}
        </h1>
        <p className="mt-4 text-lg text-stone-600 dark:text-stone-400">
          {t('compendium.intro', { count: factions.length })}
        </p>
      </header>

      {/* Factions */}
      <section aria-labelledby="factions-heading" className="mb-16">
        <h2 id="factions-heading" className="sr-only">
          {t('compendium.factions')}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {factions.map((f, i) => {
            const c = FACTION_HEX[f.color]
            return (
              <li
                key={f.id}
                className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both"
                style={{ animationDelay: `${i * 70}ms`, animationDuration: '500ms' }}
              >
                <button
                  type="button"
                  onClick={() => onSelectFaction?.(f.id)}
                  className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-stone-800 dark:bg-stone-900"
                >
                  <span
                    className="relative flex h-28 items-end justify-between px-5 pb-0"
                    style={{ background: `linear-gradient(135deg, ${c.base}, ${c.deep})` }}
                  >
                    <CardImage url={f.heroImageUrl} deep={c.deep} />
                    {/* rivet strip */}
                    <span
                      className="absolute inset-x-0 top-2 h-1.5 opacity-40"
                      style={{ backgroundImage: 'radial-gradient(circle, #fef3c7 1.5px, transparent 2px)', backgroundSize: '14px 6px' }}
                    />
                    <span className="relative mb-[-1.75rem] drop-shadow-lg transition-transform group-hover:-rotate-3 group-hover:scale-105">
                      <FactionEmblem faction={f} className="size-20" />
                    </span>
                    <span className="relative mb-3 font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-[0.25em] text-white/80">
                      {f.bonus.label}
                    </span>
                  </span>
                  <span className="flex flex-1 flex-col px-5 pb-5 pt-9">
                    <span className="font-['Big_Shoulders_Display'] text-2xl font-black uppercase leading-none tracking-wide">
                      {f.name}
                    </span>
                    <span className="mt-1.5 text-sm italic text-stone-500 dark:text-stone-400">„{f.motto}“</span>
                    <span className="mt-4 border-t border-dashed border-stone-200 pt-3 text-sm text-stone-700 dark:border-stone-700 dark:text-stone-300">
                      {f.trait}
                    </span>
                    <span className="mt-auto flex flex-wrap gap-1.5 pt-4">
                      {f.playstyle.map((p) => (
                        <span
                          key={p}
                          className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                        >
                          {p}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 transition-transform group-hover:scale-x-100" style={{ background: c.base }} />
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Units */}
      <section aria-labelledby="units-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b-4 border-double border-stone-300 pb-4 dark:border-stone-700">
          <div>
            <h2 id="units-heading" className="font-['Big_Shoulders_Display'] text-4xl font-black uppercase tracking-wide">
              {t('compendium.units')}
            </h2>
            <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-widest text-stone-500" aria-live="polite">
              {t('compendium.typesCount', { shown: filtered.length, total: unitTypes.length })}
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div role="radiogroup" aria-label={t('compendium.domainFilter')} className="flex flex-1 rounded-lg border border-stone-300 bg-white p-1 sm:flex-none dark:border-stone-700 dark:bg-stone-900">
              {DOMAIN_FILTERS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={domain === value}
                  onClick={() => setDomain(value)}
                  className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-semibold transition-colors sm:flex-none ${
                    domain === value
                      ? 'bg-stone-900 text-amber-300 dark:bg-amber-500 dark:text-stone-950'
                      : 'text-stone-600 hover:text-teal-700 dark:text-stone-300 dark:hover:text-teal-300'
                  }`}
                >
                  <Icon className="size-4" />
                  {t(label)}
                </button>
              ))}
            </div>

            <label className="relative flex min-h-12 flex-1 items-center sm:flex-none">
              <span className="sr-only">{t('compendium.origin')}</span>
              <Filter className="pointer-events-none absolute left-3 size-4 text-stone-500" />
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="h-12 w-full appearance-none rounded-lg border border-stone-300 bg-white pl-9 pr-9 text-sm font-semibold text-stone-800 focus-visible:outline-2 focus-visible:outline-teal-500 sm:w-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
              >
                <option value="all">{t('compendium.allOrigins')}</option>
                <option value="general">{t('compendium.generalUnits')}</option>
                {factions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {t('compendium.specialUnitsOf', { name: f.name })}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 size-4 text-stone-500" />
            </label>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-stone-300 px-6 py-14 text-center dark:border-stone-700">
            <p className="font-['Big_Shoulders_Display'] text-2xl font-black uppercase tracking-wide">{t('compendium.noneFound')}</p>
            <p className="mt-1 max-w-sm text-sm text-stone-500 dark:text-stone-400">
              {t('compendium.noneFoundHint')}
            </p>
            <button
              type="button"
              onClick={() => {
                setDomain('all')
                setOrigin('all')
              }}
              className="mt-5 flex min-h-11 items-center gap-1.5 rounded-lg bg-amber-500 px-4 font-semibold text-stone-950 hover:bg-amber-400"
            >
              <X className="size-4" /> Filter zurücksetzen
            </button>
          </div>
        ) : (
          <ul className="grid gap-2 xl:grid-cols-2">
            {filtered.map((u) => {
              const variants = variantsOf(u)
              return (
                <li key={u.id}>
                  <UnitRow
                    unit={u}
                    owner={u.factionId ? factionById.get(u.factionId) : undefined}
                    imageUrls={unitImageCandidates(u.illustrationUrl)}
                    variants={variants.length > 0 ? variants : undefined}
                    activeVariant={Math.max(0, variants.findIndex((v) => v.factionId === cycleFaction?.id))}
                    onSelect={() => onSelectUnitType?.(u.id)}
                  />
                </li>
              )
            })}
          </ul>
        )}
        {isFiltered && filtered.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setDomain('all')
              setOrigin('all')
            }}
            className="mt-4 text-sm font-semibold text-teal-700 underline-offset-4 hover:underline dark:text-teal-400"
          >
            {t('compendium.resetFilter')}
          </button>
        )}
      </section>
    </div>
  )
}
