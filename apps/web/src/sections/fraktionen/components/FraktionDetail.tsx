import { ArrowLeft, Castle, Sparkles } from 'lucide-react'
import type { FraktionDetailProps } from '../types'
import { FactionEmblem } from './FactionEmblem'
import { DOMAIN_LABEL, FACTION_HEX, bonusEffect } from './theme'
import { UnitIcon } from './unitIcons'
import { UnitRow } from './UnitRow'
import { unitImageCandidates, useFirstLoadedImage, useImageLoaded } from './useImageLoaded'

const STAT_LABEL = {
  movement: 'Bewegung',
  range: 'Reichweite',
  productionTurns: 'Bauzeit',
  strength: 'Stärke',
  defense: 'Abwehr',
} as const

export function FraktionDetail({ faction, unitTypes, onSelectUnitType, onBack }: FraktionDetailProps) {
  const c = FACTION_HEX[faction.color]
  const special = unitTypes.find((u) => u.id === faction.specialUnitTypeId) ?? null
  const general = unitTypes.filter((u) => u.factionId === null)
  const specialBonus = special ? bonusEffect(special, faction) : null
  const paragraphs = faction.history.split(/\n\s*\n/)
  const { bonus } = faction
  const hasHero = useImageLoaded(faction.heroImageUrl)
  const specialImage = useFirstLoadedImage(unitImageCandidates(special?.illustrationUrl))

  return (
    <div>
      {/* Hero */}
      <header className="relative overflow-hidden" style={{ background: `linear-gradient(120deg, ${c.deep} 0%, ${c.base} 130%)` }}>
        {hasHero && faction.heroImageUrl ? (
          <>
            <img
              src={faction.heroImageUrl}
              alt=""
              className="absolute inset-0 size-full object-cover object-right animate-in fade-in duration-700"
            />
            {/* keep the title readable: faction color on the left, image on the right */}
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(90deg, ${c.deep} 0%, ${c.deep}d9 35%, ${c.deep}33 70%, transparent 100%)` }}
            />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
          </>
        ) : (
          <>
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage: 'repeating-linear-gradient(-45deg, #000 0 2px, transparent 2px 14px)',
              }}
            />
            <div
              className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full border-[28px] border-dashed opacity-15"
              style={{ borderColor: c.light }}
            />
          </>
        )}
        <div
          className={`relative mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pb-14 ${hasHero ? 'flex min-h-[22rem] flex-col justify-between sm:min-h-[28rem]' : ''}`}
        >
          <button
            type="button"
            onClick={onBack}
            className="mb-8 flex min-h-11 items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/80 hover:text-white"
          >
            <ArrowLeft className="size-4" /> Zurück
          </button>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <FactionEmblem faction={faction} className="size-28 shrink-0 drop-shadow-2xl sm:size-36" />
            <div className="min-w-0 text-white">
              <p className="mb-2 font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.3em] text-white/70">Fraktion</p>
              <h1 className="font-['Big_Shoulders_Display'] text-5xl font-black uppercase leading-[0.9] tracking-wide sm:text-7xl">
                {faction.name}
              </h1>
              <p className="mt-3 text-lg italic text-white/85">„{faction.motto}“</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_22rem]">
        {/* History */}
        <section aria-labelledby="history-heading">
          <h2 id="history-heading" className="mb-4 font-['Big_Shoulders_Display'] text-3xl font-black uppercase tracking-wide">
            Geschichte
          </h2>
          <div className="space-y-4 text-[17px] leading-relaxed text-stone-700 dark:text-stone-300">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "first-letter:float-left first-letter:mr-2 first-letter:font-['Big_Shoulders_Display'] first-letter:text-6xl first-letter:font-black first-letter:leading-[0.8] first-letter:text-(color:--cap)"
                    : undefined
                }
                style={i === 0 ? ({ '--cap': c.base } as React.CSSProperties) : undefined}
              >
                {p}
              </p>
            ))}
          </div>
        </section>

        {/* Trait & playstyle */}
        <aside className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center gap-2 border-b-4 border-double border-stone-200 px-5 py-3 dark:border-stone-800">
              <Sparkles className="size-4 text-amber-600" />
              <h2 className="font-['Big_Shoulders_Display'] text-lg font-bold uppercase tracking-widest">Eigenheit</h2>
            </div>
            <div className="p-5">
              <p className="font-['Big_Shoulders_Display'] text-2xl font-black uppercase tracking-wide" style={{ color: c.base }}>
                {bonus.label}
              </p>
              <p className="mt-1 text-stone-700 dark:text-stone-300">{bonus.description}</p>
              <p className="mt-3 font-['IBM_Plex_Mono'] text-xs uppercase tracking-widest text-stone-500">
                {bonus.stat
                  ? `Wirkt auf ${bonus.domain ? `${DOMAIN_LABEL[bonus.domain]}einheiten` : 'alle Einheiten'} · ${STAT_LABEL[bonus.stat]}`
                  : 'Wirkt auf Städte, nicht auf Einheiten'}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <h2 className="mb-3 font-['Big_Shoulders_Display'] text-lg font-bold uppercase tracking-widest">Spielstil</h2>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {faction.playstyle.map((p) => (
                <span key={p} className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  {p}
                </span>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">{faction.playstyleSummary}</p>
          </div>
        </aside>

        {/* Units */}
        <section aria-labelledby="units-heading" className="lg:col-span-2">
          <h2 id="units-heading" className="mb-4 border-b-4 border-double border-stone-300 pb-3 font-['Big_Shoulders_Display'] text-3xl font-black uppercase tracking-wide dark:border-stone-700">
            Einheiten
          </h2>

          {special ? (
            <button
              type="button"
              onClick={() => onSelectUnitType?.(special.id, faction.id)}
              className="group relative mb-8 flex w-full flex-col gap-5 overflow-hidden rounded-xl border-2 bg-stone-950 p-6 text-left text-stone-100 transition hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 sm:flex-row sm:items-center"
              style={{ borderColor: c.base }}
            >
              <span
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `linear-gradient(${c.base}33 1px, transparent 1px), linear-gradient(90deg, ${c.base}33 1px, transparent 1px)`,
                  backgroundSize: '22px 22px',
                }}
              />
              {specialImage ? (
                <span
                  className="relative h-36 w-48 shrink-0 overflow-hidden rounded-lg border-4 shadow-lg"
                  style={{ borderColor: c.base }}
                >
                  <img
                    src={specialImage}
                    alt=""
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </span>
              ) : (
                <span
                  className="relative flex size-24 shrink-0 items-center justify-center rounded-full border-4 transition-transform group-hover:rotate-12"
                  style={{ borderColor: c.base, color: c.base }}
                >
                  <UnitIcon unitTypeId={special.id} domain={special.domain} className="size-11" strokeWidth={1.8} />
                </span>
              )}
              <span className="relative min-w-0 flex-1">
                <span className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.3em]" style={{ color: c.base }}>
                  Sondereinheit · {DOMAIN_LABEL[special.domain]}
                </span>
                <span className="block font-['Big_Shoulders_Display'] text-4xl font-black uppercase tracking-wide">{special.name}</span>
                <span className="mt-1 line-clamp-2 text-sm text-stone-400">{special.description}</span>
              </span>
              <span className="relative grid grid-cols-4 gap-2 font-['IBM_Plex_Mono'] sm:grid-cols-2">
                {(
                  [
                    ['ST', 'strength'],
                    ['AB', 'defense'],
                    ['BW', 'movement'],
                    ['BAU', 'productionTurns'],
                  ] as const
                ).map(([l, key]) => {
                  const changed = specialBonus?.stat === key ? specialBonus : null
                  return (
                    <span
                      key={l}
                      className={`flex flex-col items-center rounded border px-3 py-1 ${changed ? 'border-amber-500' : 'border-stone-700'}`}
                    >
                      <span className="text-[9px] tracking-widest text-stone-500">{l}</span>
                      {changed ? (
                        <span className="flex items-baseline gap-1">
                          <span className="text-xs text-stone-500 line-through">{changed.base}</span>
                          <span className="text-lg font-semibold text-amber-400">{changed.value}</span>
                        </span>
                      ) : (
                        <span className="text-lg font-semibold">{special[key]}</span>
                      )}
                    </span>
                  )
                })}
              </span>
            </button>
          ) : (
            <div className="mb-8 flex items-start gap-4 rounded-xl border-2 border-dashed border-stone-300 p-6 dark:border-stone-700">
              <Castle className="mt-1 size-8 shrink-0" style={{ color: c.base }} />
              <div>
                <p className="font-['Big_Shoulders_Display'] text-2xl font-black uppercase tracking-wide">Keine Sondereinheit</p>
                <p className="mt-1 text-stone-600 dark:text-stone-400">
                  Die Stärke der {faction.name} liegt nicht in einer besonderen Einheit. {faction.trait}
                </p>
              </div>
            </div>
          )}

          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-['Big_Shoulders_Display'] text-xl font-bold uppercase tracking-widest text-stone-600 dark:text-stone-400">
              Allgemeine Einheiten
            </h3>
            {bonus.stat && (
              <p className="flex items-center gap-1.5 text-xs text-stone-500">
                <span className="inline-block size-2.5 rounded-sm border border-amber-400 bg-amber-100 dark:bg-amber-900" />
                Durch „{bonus.label}“ veränderter Wert
              </p>
            )}
          </div>
          <ul className="grid gap-2 xl:grid-cols-2">
            {general.map((u) => (
              <li key={u.id}>
                <UnitRow
                  unit={u}
                  bonus={bonusEffect(u, faction)}
                  imageUrls={[...unitImageCandidates(u.variantIllustrationUrls[faction.id]), ...unitImageCandidates(u.illustrationUrl)]}
                  onSelect={() => onSelectUnitType?.(u.id, faction.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
