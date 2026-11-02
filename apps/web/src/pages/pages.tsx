import { Link } from 'react-router'
import { PlaceholderPage } from './PlaceholderPage'
import { routes } from '../routes'

export function NotFoundPage() {
  return (
    <PlaceholderPage title="Nicht gefunden">
      <p>
        Diese Seite gibt es nicht.{' '}
        <Link to={routes.lobby} className="text-teal-700 underline dark:text-teal-300">
          Zur Lobby
        </Link>
      </p>
    </PlaceholderPage>
  )
}
