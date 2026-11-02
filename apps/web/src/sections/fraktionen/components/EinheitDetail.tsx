import { useState } from 'react'
import { ArrowLeft, ArrowUpRight, Flag, FlagOff } from 'lucide-react'
import {
  attackTargetsDescription,
  CITY_DEFENSE,
  TERRAIN_DEFENSE,
  TERRAIN_LABEL,
} from '@dos/shared/game/rules'
import type { EinheitDetailProps, UnitType } from '../types'
import { FactionEmblem } from './FactionEmblem'
import { DOMAIN_LABEL, FACTION_HEX, bonusEffect } from './theme'
import { UnitIcon } from './unitIcons'
import { useFirstLoadedImage } from './useImageLoaded'

type NumericStat = 'strength' | 'defense' | 'hitPoints' | 'damage' | 'movement' | 'range' | 'capacity' | 'productionTurns'

const STATS: { key: NumericStat; label: string; unit?: string; note?: string }[] = [
  { key: 'strength', label: 'Stärke' },
  { key: 'defense', label: 'Abwehr' },
  { key: 'hitPoints', label: 'Trefferpunkte' },
  { key: 'damage', label: 'Schaden', unit: 'je Treffer' },
  { key: 'movement', label: 'Bewegung', unit: 'Felder' },
  { key: 'range', label: 'Reichweite', unit: 'Felder', note: 'Nur Lufteinheiten' },
  { key: 'capacity', label: 'Ladung', unit: 'Einheiten' },
  { key: 'productionTurns', label: 'Bauzeit', unit: 'Runden' },
]

function Blueprint({ unit, accent, imageUrls, label }: { unit: UnitType; accent: string; imageUrls: (string | null)[]; label: string }) {
  const image = useFirstLoadedImage(imageUrls)
  if (image) {
    return (
      <img
        key={image}
        src={image}
        alt={label}
        className="aspect-[4/3] w-full rounded-xl border-2 border-stone-900 object-cover shadow-2xl animate-in fade-in dark:border-stone-700"
      />
    )
  }
  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border-2 border-teal-900 bg-[#0d2f33] shadow-inner"
      style={{
        backgroundImage:
          'linear-gradient(rgba(94,234,212,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(94,234,212,.12) 1px, transparent 1px), linear-gradient(rgba(94,234,212,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(94,234,212,.05) 1px, transparent 1px)',
        backgroundSize: '60px 60px, 60px 60px, 12px 12px, 12px 12px',
      }}
      role="img"
      aria-label={`Bauplan ${unit.name} (Platzhalter)`}
    >
      {/* drafting circle */}
      <div className="absolute left-1/2 top-1/2 aspect-square h-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-teal-300/40" />
      <div className="absolute left-1/2 top-[8%] h-[84%] w-px -translate-x-1/2 bg-teal-300/20" />
      <div className="absolute left-[8%] top-1/2 h-px w-[84%] -translate-y-1/2 bg-teal-300/20" />
      <UnitIcon
        unitTypeId={unit.id}
        domain={unit.domain}
        className="absolute left-1/2 top-1/2 size-[38%] -translate-x-1/2 -translate-y-1/2 text-teal-100"
        strokeWidth={1}
      />
      {/* dimension line */}
      <div className="absolute bottom-[12%] left-[22%] right-[22%] flex items-center gap-2 text-teal-300/70">
        <span className="h-3 w-px bg-current" />
        <span className="h-px flex-1 bg-current" />
        <span className="font-['IBM_Plex_Mono'] text-[10px] tracking-widest">{unit.movement} FELD/RUNDE</span>
        <span className="h-px flex-1 bg-current" />
        <span className="h-3 w-px bg-current" />
      </div>
      {/* title block */}
      <div className="absolute right-3 top-3 border border-teal-300/50 px-2 py-1 font-['IBM_Plex_Mono'] text-[10px] uppercase leading-tight tracking-widest text-teal-200/80">
        Bauplan Nr. {unit.id.slice(0, 4).toUpperCase()}-{unit.productionTurns.toString().padStart(2, '0')}
        <br />
        {DOMAIN_LABEL[unit.domain]}
      </div>
      <div className="absolute bottom-3 left-3 size-3 rounded-full" style={{ background: accent }} />
    </div>
  )
}

export function EinheitDetail({
  unitType: unit,
  faction,
  factions,
  initialVariantFactionId,
  unitTypes,
  onSelectFaction,
  onBack,
}: EinheitDetailProps) {
  const variantFactions = factions.filter((f) => unit.variantIllustrationUrls[f.id])
  const [variantId, setVariantId] = useState<string | null>(
    variantFactions.some((f) => f.id === initialVariantFactionId)
      ? initialVariantFactionId!
      : (variantFactions[0]?.id ?? null),
  )
  const variant = variantFactions.find((f) => f.id === variantId) ?? null
  const accentFaction = faction ?? variant
  const accent = accentFaction ? FACTION_HEX[accentFaction.color].base : '#f59e0b'
  const max = (key: NumericStat) => Math.max(1, ...unitTypes.map((u) => u[key] ?? 0))
  const imageUrls = [variant ? unit.variantIllustrationUrls[variant.id] : null, unit.illustrationUrl]
  // special units use their own faction's bonus, general units the bonus of the selected variant
  const bonus = accentFaction ? bonusEffect(unit, accentFaction) : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 flex min-h-11 items-center gap-2 text-sm font-semibold uppercase tracking-widest text-stone-500 hover:text-teal-700 dark:text-stone-400 dark:hover:text-teal-300"
      >
        <ArrowLeft className="size-4" /> Zurück
      </button>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <div>
          <Blueprint
            unit={unit}
            accent={accent}
            imageUrls={imageUrls}
            label={variant ? `${unit.name} in der Ausführung von ${variant.name}` : unit.name}
          />
          {variantFactions.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
                Ausführung · eigenes Aussehen, Werte mit Fraktionsbonus
              </p>
              <div role="tablist" aria-label="Ausführung nach Fraktion" className="flex flex-wrap gap-1.5">
                {variantFactions.map((f) => {
                  const active = f.id === variantId
                  const c = FACTION_HEX[f.color]
                  return (
                    <button
                      key={f.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setVariantId(f.id)}
                      className={`flex min-h-11 items-center gap-2 rounded-lg border-2 py-1 pl-1 pr-3 text-sm font-semibold transition ${
                        active
                          ? 'bg-white shadow-md dark:bg-stone-900'
                          : 'border-transparent text-stone-500 hover:bg-white hover:text-stone-800 dark:hover:bg-stone-900 dark:hover:text-stone-100'
                      }`}
                      style={active ? { borderColor: c.base } : undefined}
                    >
                      <FactionEmblem faction={f} className="size-8" />
                      {f.shortName}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.3em] text-teal-700 dark:text-teal-400">
            {DOMAIN_LABEL[unit.domain]}einheit
          </p>
          <h1 className="font-['Big_Shoulders_Display'] text-5xl font-black uppercase leading-[0.9] tracking-wide sm:text-6xl">
            {unit.name}
          </h1>

          {faction ? (
            <button
              type="button"
              onClick={() => onSelectFaction?.(faction.id)}
              className="group mt-4 flex min-h-11 items-center gap-3 rounded-lg border-2 py-1.5 pl-1.5 pr-3 text-left transition hover:shadow-md"
              style={{ borderColor: accent }}
            >
              <FactionEmblem faction={faction} className="size-10" />
              <span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">Sondereinheit von</span>
                <span className="font-semibold">{faction.name}</span>
              </span>
              <ArrowUpRight className="size-4 text-stone-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-teal-600" />
            </button>
          ) : (
            <p className="mt-4 inline-block rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-stone-600 dark:bg-stone-800 dark:text-stone-300">
              Allgemeine Einheit · alle Fraktionen
            </p>
          )}

          <p className="mt-5 text-[17px] leading-relaxed text-stone-700 dark:text-stone-300">{unit.description}</p>

          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-stone-600 dark:text-stone-400">
            {unit.canCaptureCities ? (
              <>
                <Flag className="size-4 text-teal-600" /> Kann Städte erobern
              </>
            ) : (
              <>
                <FlagOff className="size-4 text-stone-400" /> Kann keine Städte erobern
              </>
            )}
          </p>
        </div>
      </div>

      {/* Stats */}
      <section aria-labelledby="stats-heading" className="mt-12">
        <h2 id="stats-heading" className="mb-4 border-b-4 border-double border-stone-300 pb-3 font-['Big_Shoulders_Display'] text-3xl font-black uppercase tracking-wide dark:border-stone-700">
          Typenschild
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {STATS.map((s) => {
            const changed = bonus?.stat === s.key ? bonus : null
            const value = changed ? changed.value : unit[s.key]
            const pct = value == null ? 0 : Math.min(100, (value / max(s.key)) * 100)
            return (
              <div
                key={s.key}
                className={`rounded-lg border bg-white p-4 dark:bg-stone-900 ${
                  changed ? 'border-amber-400 dark:border-amber-600' : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                <dt className="text-[11px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">{s.label}</dt>
                <dd>
                  {changed && <span className="mr-1.5 font-['IBM_Plex_Mono'] text-lg text-stone-400 line-through">{changed.base}</span>}
                  <span className={`font-['IBM_Plex_Mono'] text-3xl font-semibold ${changed ? 'text-amber-700 dark:text-amber-400' : ''}`}>{value ?? '–'}</span>
                  {value != null && s.unit && (
                    <span className="ml-1 text-xs text-stone-500">
                      {s.key === 'capacity' && unit.capacity > 0 ? (unit.cargoDomain === 'air' ? 'Flugzeuge' : 'Landeinheiten') : s.unit}
                    </span>
                  )}
                  <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  {value == null && s.note && <span className="mt-1.5 block text-[11px] text-stone-400">{s.note}</span>}
                </dd>
              </div>
            )
          })}
        </dl>
        <p className="mt-2 text-xs text-stone-500">
          Balken im Verhältnis zum höchsten Wert aller Einheitentypen.
          {bonus && accentFaction && ` Hervorgehoben: durch „${accentFaction.bonus.label}“ (${accentFaction.shortName}) veränderter Wert.`}
        </p>
      </section>

      {/* Combat rules */}
      <section aria-labelledby="combat-heading" className="mt-12">
        <h2 id="combat-heading" className="mb-4 border-b-4 border-double border-stone-300 pb-3 font-['Big_Shoulders_Display'] text-3xl font-black uppercase tracking-wide dark:border-stone-700">
          Gefecht
        </h2>
        <dl className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <dt className="text-[11px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">Greift an</dt>
            <dd className="mt-1 text-stone-700 dark:text-stone-300">{attackTargetsDescription(unit)}</dd>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <dt className="text-[11px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">Abwehrbonus</dt>
            <dd className="mt-1 text-stone-700 dark:text-stone-300">
              {unit.domain === 'land'
                ? (Object.keys(TERRAIN_DEFENSE) as (keyof typeof TERRAIN_DEFENSE)[])
                    .filter((t) => TERRAIN_DEFENSE[t] > 0)
                    .map((t) => `${TERRAIN_LABEL[t]} +${TERRAIN_DEFENSE[t]}`)
                    .join(' · ')
                : 'Kein Geländebonus'}
              {` · Stadt +${CITY_DEFENSE}`}
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-stone-500">
          Ein Angriff läuft in Runden, bis eine Seite keine Trefferpunkte mehr hat; je Runde trifft entweder der Angreifer
          oder der Verteidiger mit seinem Schadenswert, die Trefferchance ergibt sich aus Stärke gegen Abwehr samt Boni. Ein
          Angriff kostet einen Bewegungspunkt. Wer eine Einheit vernichtet, rückt auf ihr Feld nach. Grenadiere, Panzerwagen
          und Dampfkoloss erobern Städte und werden dabei verbraucht; ein unbeschädigter Panzer hinterlässt Grenadiere. Jeder
          Angriff auf eine Stadt verzögert dort die Produktion.
        </p>
      </section>

      {/* Tactics */}
      {unit.tactics.length > 0 && (
        <section aria-labelledby="tactics-heading" className="mt-12">
          <h2 id="tactics-heading" className="mb-4 border-b-4 border-double border-stone-300 pb-3 font-['Big_Shoulders_Display'] text-3xl font-black uppercase tracking-wide dark:border-stone-700">
            Taktik
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {unit.tactics.map((t, i) => (
              <li key={i} className="flex gap-4 rounded-lg bg-teal-50 p-5 dark:bg-teal-950/40">
                <span className="font-['IBM_Plex_Mono'] text-3xl font-semibold leading-none text-teal-600 dark:text-teal-400">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-stone-700 dark:text-stone-300">{t}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
