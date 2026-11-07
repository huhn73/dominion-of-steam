import { Link } from 'react-router'
import { routes } from '../../routes'
import type { MessageKey } from '@dos/shared/i18n'
import { useT } from '../../i18n'

export type LegalPageId = 'imprint' | 'privacy' | 'licenses'

const PAGES: { id: LegalPageId; label: MessageKey; href: string }[] = [
  { id: 'imprint', label: 'legal.imprint', href: routes.imprint },
  { id: 'privacy', label: 'legal.privacy', href: routes.privacy },
  { id: 'licenses', label: 'legal.licenses', href: routes.licenses },
]

/** Row of links to the legal pages; the current page is plain text */
export function LegalLinks({
  current,
  className = '',
}: {
  current?: LegalPageId
  className?: string
}) {
  const t = useT()
  return (
    <nav
      aria-label={t('legal.nav')}
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400 ${className}`}
    >
      {PAGES.map((page) =>
        page.id === current ? (
          <span
            key={page.id}
            aria-current="page"
            className="font-semibold text-stone-700 dark:text-stone-200"
          >
            {t(page.label)}
          </span>
        ) : (
          <Link
            key={page.id}
            to={page.href}
            className="inline-flex min-h-8 items-center underline-offset-4 hover:text-teal-700 hover:underline focus-visible:outline-2 focus-visible:outline-teal-500 dark:hover:text-teal-300"
          >
            {t(page.label)}
          </Link>
        ),
      )}
    </nav>
  )
}
