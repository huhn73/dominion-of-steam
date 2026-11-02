import { Copy, Dices } from 'lucide-react'
import type { MapSettings, MatchDraft, SetupOptions } from '../types'
import { roundLimitAfterSizeChange, victoryConditionAfterShapeChange } from './setup'
import { Field, Segmented } from './ui'

const FOOTPRINT_MIN = 16
const FOOTPRINT_MAX = 56

/** Side of the footprint square: tile counts span two orders of magnitude, so a log scale */
function footprintSide(tiles: number, min: number, max: number) {
  if (max <= min) return FOOTPRINT_MAX
  const t = (Math.log(tiles) - Math.log(min)) / (Math.log(max) - Math.log(min))
  return Math.round(FOOTPRINT_MIN + (FOOTPRINT_MAX - FOOTPRINT_MIN) * Math.max(0, Math.min(1, t)))
}

interface StepMapProps {
  draft: MatchDraft
  options: SetupOptions
  onChange: (patch: Partial<MatchDraft>) => void
  onRandomizeSeed: () => void
}

export function StepMap({ draft, options, onChange, onRandomizeSeed }: StepMapProps) {
  const map = draft.map
  const setMap = (patch: Partial<MapSettings>) => onChange({ map: { ...map, ...patch } })
  const tileCounts = options.mapSizes.map((s) => s.width * s.height)
  const minTiles = Math.min(...tileCounts)
  const maxTiles = Math.max(...tileCounts)
  const ls = options.landShare
  const landPct = ((map.landShare - ls.min) / (ls.max - ls.min)) * 100

  return (
    <div className="space-y-6">
      <Field label="Kartengröße">
        <div role="radiogroup" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {options.mapSizes.map((s) => {
            const selected = map.size === s.id
            const tooMany = draft.seats.length > s.recommendedPlayers[1]
            const tiles = s.width * s.height
            const side = footprintSide(tiles, minTiles, maxTiles)
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() =>
                  onChange({
                    map: { ...map, size: s.id },
                    roundLimit: roundLimitAfterSizeChange(draft, options, s.id),
                  })
                }
                className={`flex flex-col items-start rounded-lg border-2 p-4 text-left transition ${
                  selected
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                    : 'border-stone-200 bg-white hover:border-teal-500 dark:border-stone-700 dark:bg-stone-900'
                }`}
              >
                {/* scaled footprint */}
                <span className="mb-3 flex h-14 w-full items-end">
                  <span
                    className={`rounded-sm border-2 ${selected ? 'border-amber-600 bg-amber-200/60 dark:bg-amber-700/40' : 'border-stone-400 bg-stone-100 dark:border-stone-600 dark:bg-stone-800'}`}
                    style={{ width: side, height: side }}
                  />
                </span>
                <span className="font-['Big_Shoulders_Display'] text-xl font-black uppercase tracking-wide">{s.label}</span>
                <span className="font-['IBM_Plex_Mono'] text-xs text-stone-500">
                  {s.width}×{s.height} · {tiles.toLocaleString('de-DE')} Felder
                </span>
                <span className={`mt-1 text-xs font-semibold ${tooMany ? 'text-amber-700 dark:text-amber-400' : 'text-teal-700 dark:text-teal-400'}`}>
                  {s.recommendedPlayers[0]}–{s.recommendedPlayers[1]} Spieler
                </span>
                <span className="text-xs text-stone-500">Rundenlimit {s.defaultRoundLimit}</span>
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="Weltform" hint="Kontinent: eine große Landmasse mit Buchten. Inseln: jede Hauptstadt auf eigener Insel, dazwischen neutrale Inseln. Archipel: viele kleine Inseln, Seewege entscheiden. Für Inseln und Archipel schlägt der Assistent die Siegbedingung „Vorherrschaft“ vor.">
        <Segmented
          label="Weltform"
          value={map.worldShape ?? 'continent'}
          options={options.worldShapes.map((w) => ({ value: w.id, label: w.label }))}
          onChange={(v) =>
            onChange({
              map: { ...map, worldShape: v },
              victoryCondition: victoryConditionAfterShapeChange(draft, v),
            })
          }
        />
      </Field>

      <Field label="Landanteil" hint={map.worldShape === 'archipelago' ? 'Der Landanteil bestimmt die Inselgröße. Ein Archipel wirkt mit 20 bis 30 % Land; darüber wachsen die Inseln zusammen, die Hauptstädte bleiben getrennt.' : map.worldShape === 'islands' ? 'Der Landanteil bestimmt die Inselgröße; ab etwa 50 % wachsen die Inseln zusammen, die Hauptstädte bleiben getrennt.' : undefined}>
        <div className="max-w-xl">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-teal-700 dark:text-teal-400">{ls.minLabel}</span>
            <span className="font-['IBM_Plex_Mono'] text-2xl font-semibold">{map.landShare} %</span>
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-500">{ls.maxLabel}</span>
          </div>
          <input
            type="range"
            min={ls.min}
            max={ls.max}
            step={ls.step}
            value={map.landShare}
            onChange={(e) => setMap({ landShare: Number(e.target.value) })}
            aria-label="Landanteil in Prozent"
            className="h-3 w-full cursor-pointer appearance-none rounded-full accent-amber-500"
            style={{ background: `linear-gradient(90deg, #14b8a6 0%, #d6a64a ${landPct}%, #d6d3d1 ${landPct}%)` }}
          />
        </div>
      </Field>

      <div className="grid gap-6 border-t border-dashed border-stone-300 pt-5 sm:grid-cols-2 dark:border-stone-700">
        <div>
          <p className="mb-2 font-['Big_Shoulders_Display'] text-lg font-bold uppercase tracking-widest">Neutrale Städte</p>
          <Segmented
            label="Neutrale Städte"
            value={map.neutralCities}
            options={options.levels.map((l) => ({ value: l.id, label: l.id === 'low' ? 'Wenige' : l.id === 'high' ? 'Viele' : l.label }))}
            onChange={(v) => setMap({ neutralCities: v })}
          />
        </div>
        <div>
          <p className="mb-2 font-['Big_Shoulders_Display'] text-lg font-bold uppercase tracking-widest">Gebirge & Wald</p>
          <Segmented
            label="Gebirge und Wald"
            value={map.terrain}
            options={options.levels.map((l) => ({ value: l.id, label: l.label }))}
            onChange={(v) => setMap({ terrain: v })}
          />
        </div>
      </div>

      <Field label="Kartencode" hint="Gleicher Code und gleiche Einstellungen ergeben dieselbe Welt. Teile ihn, um eine Karte erneut zu spielen.">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={map.seed}
            onChange={(e) => setMap({ seed: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })}
            aria-label="Kartencode"
            maxLength={16}
            className="h-12 w-full rounded-lg border-2 border-stone-300 bg-white px-4 font-['IBM_Plex_Mono'] text-lg tracking-[0.2em] focus:border-amber-500 focus:outline-none sm:max-w-xs dark:border-stone-700 dark:bg-stone-900"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRandomizeSeed}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 font-semibold text-amber-300 hover:bg-stone-800 sm:flex-none dark:bg-stone-800 dark:hover:bg-stone-700"
            >
              <Dices className="size-4" /> Neu würfeln
            </button>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(map.seed).catch(() => {})}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border-2 border-stone-300 px-4 font-semibold hover:border-teal-500 sm:flex-none dark:border-stone-700"
            >
              <Copy className="size-4" /> Kopieren
            </button>
          </div>
        </div>
      </Field>
    </div>
  )
}
