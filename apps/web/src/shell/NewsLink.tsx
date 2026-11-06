import { Link } from 'react-router'
import { routes } from '../routes'

/** „Neuigkeiten“ next to the version in the footers */
export function NewsLink() {
  return (
    <Link
      to={routes.news}
      className="inline-flex min-h-8 items-center text-xs text-stone-500 underline-offset-4 hover:text-teal-700 hover:underline focus-visible:outline-2 focus-visible:outline-teal-500 dark:text-stone-400 dark:hover:text-teal-300"
    >
      Neuigkeiten
    </Link>
  )
}
