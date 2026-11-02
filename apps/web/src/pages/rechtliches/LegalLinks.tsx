import { Link } from 'react-router'
import { routes } from '../../routes'

export type LegalPageId = 'imprint' | 'privacy' | 'licenses'

const PAGES: { id: LegalPageId; label: string; href: string }[] = [
  { id: 'imprint', label: 'Impressum', href: routes.imprint },
  { id: 'privacy', label: 'Datenschutz', href: routes.privacy },
  { id: 'licenses', label: 'Lizenzen', href: routes.licenses },
]

/** Row of links to the legal pages; the current page is plain text */
export function LegalLinks({
  current,
  className = '',
}: {
  current?: LegalPageId
  className?: string
}) {
  return (
    <nav
      aria-label="Rechtliches"
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400 ${className}`}
    >
      {PAGES.map((page) =>
        page.id === current ? (
          <span
            key={page.id}
            aria-current="page"
            className="font-semibold text-stone-700 dark:text-stone-200"
          >
            {page.label}
          </span>
        ) : (
          <Link
            key={page.id}
            to={page.href}
            className="inline-flex min-h-8 items-center underline-offset-4 hover:text-teal-700 hover:underline focus-visible:outline-2 focus-visible:outline-teal-500 dark:hover:text-teal-300"
          >
            {page.label}
          </Link>
        ),
      )}
    </nav>
  )
}
