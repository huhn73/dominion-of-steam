import { Link } from 'react-router'
import { ApiRequestError } from '../../data/api'
import { PlaceholderPage } from '../PlaceholderPage'
import { routes } from '../../routes'

export function CompendiumLoading() {
  return (
    <PlaceholderPage title="Kompendium">
      <p className="animate-pulse">Lade Fraktionen und Einheiten …</p>
    </PlaceholderPage>
  )
}

export function CompendiumError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <PlaceholderPage title="Kompendium nicht verfügbar">
      <p>
        {error instanceof ApiRequestError
          ? error.message
          : 'Die Daten konnten nicht geladen werden.'}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 min-h-11 rounded-md bg-gradient-to-b from-amber-400 to-amber-600 px-4 font-['Big_Shoulders_Display'] font-bold uppercase tracking-widest text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
      >
        Erneut versuchen
      </button>
    </PlaceholderPage>
  )
}

export function CompendiumNotFound({ what }: { what: string }) {
  return (
    <PlaceholderPage title="Nicht gefunden">
      <p>
        {what} gibt es nicht.{' '}
        <Link to={routes.factions} className="text-teal-700 underline dark:text-teal-300">
          Zum Kompendium
        </Link>
      </p>
    </PlaceholderPage>
  )
}
