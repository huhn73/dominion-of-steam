import type { ReactNode } from 'react'
import { Flag } from 'lucide-react'
import type { Faction, Match } from '../types'
import { DIFFICULTY_LABEL } from './format'
import { FactionEmblem, Sheet } from './shared'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-stone-500 dark:text-stone-400">{label}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  )
}

const STATUS_LABEL = { active: 'Im Spiel', eliminated: 'Ausgeschieden', surrendered: 'Aufgegeben' } as const

export function MatchDetailsSheet({ match, factions, onClose }: { match: Match; factions: Faction[]; onClose: () => void }) {
  const { rules, map } = match
  return (
    <Sheet title={match.name} onClose={onClose}>
      <div className="grid gap-6 sm:grid-cols-2">
        <section>
          <h3 className="mb-1 font-['Big_Shoulders_Display'] text-lg font-bold uppercase tracking-widest">Regeln</h3>
          <dl className="divide-y divide-stone-200 dark:divide-stone-800">
            <Row label="Modus">{rules.mode === 'live' ? 'Live' : 'Asynchron'}</Row>
            <Row label={rules.mode === 'live' ? 'Zeitlimit' : 'Frist pro Zug'}>{rules.turnLimitLabel}</Row>
            <Row label="Siegbedingung">{rules.victoryCondition}</Row>
            <Row label="Doppelte Fraktionen">{rules.allowDuplicateFactions ? 'Erlaubt' : 'Nicht erlaubt'}</Row>
          </dl>
        </section>
        <section>
          <h3 className="mb-1 font-['Big_Shoulders_Display'] text-lg font-bold uppercase tracking-widest">Karte</h3>
          <dl className="divide-y divide-stone-200 dark:divide-stone-800">
            <Row label="Größe">
              {map.sizeLabel} · {map.width}×{map.height}
            </Row>
            {map.worldShape && map.worldShape !== 'continent' && (
              <Row label="Weltform">{map.worldShape === 'islands' ? 'Inseln' : 'Archipel'}</Row>
            )}
            <Row label="Landanteil">{map.landShare} %</Row>
            <Row label="Kartencode">
              <span className="font-['IBM_Plex_Mono'] tracking-widest">{map.seed}</span>
            </Row>
          </dl>
        </section>
      </div>
      <section className="mt-6">
        <h3 className="mb-2 font-['Big_Shoulders_Display'] text-lg font-bold uppercase tracking-widest">Spieler</h3>
        <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 dark:divide-stone-800 dark:border-stone-800">
          {match.participants.map((p) => {
            const f = factions.find((x) => x.id === p.factionId)
            return (
              <li key={p.id} className={`flex items-center gap-3 px-3 py-2.5 ${p.status !== 'active' ? 'opacity-50' : ''}`}>
                {f && <FactionEmblem faction={f} className="size-7" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {p.name}
                    {p.isYou && <span className="font-normal text-stone-500"> (du)</span>}
                  </span>
                  <span className="block text-xs text-stone-500">
                    {f?.shortName}
                    {p.isAI && p.aiDifficulty && ` · KI ${DIFFICULTY_LABEL[p.aiDifficulty]}`} · {STATUS_LABEL[p.status]}
                  </span>
                </span>
                <span className="text-right font-['IBM_Plex_Mono'] text-sm">
                  {p.cityCount}
                  <span className="block text-[10px] uppercase text-stone-500">Städte</span>
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </Sheet>
  )
}

export function SurrenderSheet({ match, onConfirm, onClose }: { match: Match; onConfirm: () => void; onClose: () => void }) {
  return (
    <Sheet
      title="Partie aufgeben?"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg border-2 border-stone-300 px-4 font-semibold dark:border-stone-700">
            Weiterkämpfen
          </button>
          <button type="button" onClick={onConfirm} className="flex min-h-11 items-center gap-2 rounded-lg bg-rose-600 px-4 font-semibold text-white hover:bg-rose-500">
            <Flag className="size-4" /> Aufgeben
          </button>
        </div>
      }
    >
      <p className="text-stone-700 dark:text-stone-300">
        Du verlässt <strong>{match.name}</strong> in Runde {match.round}. Eine KI auf Stufe „Normal“ übernimmt deine Fraktion, damit die Partie für die anderen
        ausgeglichen bleibt. Die Partie zählt für dich als Niederlage.
      </p>
    </Sheet>
  )
}
