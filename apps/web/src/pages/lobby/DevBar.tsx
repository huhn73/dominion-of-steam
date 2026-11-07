import { useState } from 'react'
import { useNavigate } from 'react-router'
import { SETUP_OPTIONS } from '@dos/shared/setup'
import { useDevActions } from '../../data/match'
import { routes } from '../../routes'
import { useT } from '../../i18n'

const DEMO_MATCH_ID = 'demo'

/** Dev-Werkzeuge nur lokal bzw. mit VITE_DEV_TOOLS=true (Docker) */
export const devToolsEnabled = import.meta.env.DEV || import.meta.env.VITE_DEV_TOOLS === 'true'

/** Nur in der Entwicklung: Demo zurücksetzen und Mitspieler ihren Zug beenden lassen */
export function DevBar() {
  const navigate = useNavigate()
  const t = useT()
  const { resetDemo, passOthers, createSolo } = useDevActions()
  const [status, setStatus] = useState<string | null>(null)
  const [solo, setSolo] = useState({
    size: 'medium',
    opponents: 2,
    difficulty: 'normal',
    shape: 'continent',
  })
  const run = (label: string, action: () => Promise<unknown>) => () =>
    action().then(
      () => setStatus(`${label}: erledigt`),
      (e: Error) => setStatus(`${label}: ${e.message}`),
    )
  const startSolo = () =>
    createSolo(solo).then(
      ({ matchId }) => navigate(routes.match(matchId)),
      (e: Error) => setStatus(`Solo-Partie: ${e.message}`),
    )
  const buttonClass =
    'rounded border border-stone-300 px-3 py-1.5 font-["IBM_Plex_Mono"] text-xs uppercase hover:border-teal-500 hover:text-teal-700 dark:border-stone-700 dark:hover:text-teal-300'
  const selectClass =
    'rounded border border-stone-300 bg-transparent px-2 py-1.5 text-xs dark:border-stone-700 dark:bg-stone-900'

  return (
    <div className="mx-auto mb-10 max-w-7xl space-y-3 border-t-4 border-double border-stone-300 px-4 pt-4 font-['Barlow'] text-stone-700 sm:px-6 dark:border-stone-700 dark:text-stone-300">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-['IBM_Plex_Mono'] text-xs uppercase text-stone-500">Dev</span>
        <select
          aria-label="Kartengröße"
          className={selectClass}
          value={solo.size}
          onChange={(e) => setSolo({ ...solo, size: e.target.value })}
        >
          {SETUP_OPTIONS.mapSizes.map((s) => (
            <option key={s.id} value={s.id}>
              {t(s.label)}
            </option>
          ))}
        </select>
        <select
          aria-label="Weltform"
          className={selectClass}
          value={solo.shape}
          onChange={(e) => setSolo({ ...solo, shape: e.target.value })}
        >
          {SETUP_OPTIONS.worldShapes.map((w) => (
            <option key={w.id} value={w.id}>
              {t(w.label)}
            </option>
          ))}
        </select>
        <select
          aria-label="KI-Gegner"
          className={selectClass}
          value={solo.opponents}
          onChange={(e) => setSolo({ ...solo, opponents: Number(e.target.value) })}
        >
          {[1, 2, 3].map((n) => (
            <option key={n} value={n}>
              {n} KI-Gegner
            </option>
          ))}
        </select>
        <select
          aria-label="Schwierigkeit"
          className={selectClass}
          value={solo.difficulty}
          onChange={(e) => setSolo({ ...solo, difficulty: e.target.value })}
        >
          <option value="easy">Leicht</option>
          <option value="normal">Normal</option>
          <option value="hard">Schwer</option>
        </select>
        <button type="button" className={buttonClass} onClick={startSolo}>
          Neue Solo-Partie
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-['IBM_Plex_Mono'] text-xs uppercase text-stone-500">Demo</span>
        <button
          type="button"
          className={buttonClass}
          onClick={() => navigate(routes.match(DEMO_MATCH_ID))}
        >
          Demo-Partie öffnen
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={run('Demo zurückgesetzt', resetDemo)}
        >
          Demo zurücksetzen
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={run('Mitspieler', () => passOthers(DEMO_MATCH_ID))}
        >
          Mitspieler ziehen lassen
        </button>
        {status && <span className="text-xs text-stone-500">{status}</span>}
      </div>
    </div>
  )
}
