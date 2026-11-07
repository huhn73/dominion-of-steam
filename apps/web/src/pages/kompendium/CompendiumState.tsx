import { Link } from 'react-router'
import { ApiRequestError } from '../../data/api'
import { PlaceholderPage } from '../PlaceholderPage'
import { routes } from '../../routes'
import type { MessageKey } from '@dos/shared/i18n'
import { useT } from '../../i18n'

export function CompendiumLoading() {
  const t = useT()
  return (
    <PlaceholderPage title={t('compendium.kicker')}>
      <p className="animate-pulse">{t('compendium.loading')}</p>
    </PlaceholderPage>
  )
}

export function CompendiumError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const t = useT()
  return (
    <PlaceholderPage title={t('compendium.unavailable')}>
      <p>
        {error instanceof ApiRequestError
          ? error.message
          : t('compendium.loadFailed')}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 min-h-11 rounded-md bg-gradient-to-b from-amber-400 to-amber-600 px-4 font-['Big_Shoulders_Display'] font-bold uppercase tracking-widest text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
      >
        {t('common.retry')}
      </button>
    </PlaceholderPage>
  )
}

export function CompendiumNotFound({ what }: { what: MessageKey }) {
  const t = useT()
  return (
    <PlaceholderPage title={t('compendium.notFound')}>
      <p>
        {t(what)}{' '}
        <Link to={routes.factions} className="text-teal-700 underline dark:text-teal-300">
          {t('compendium.toCompendium')}
        </Link>
      </p>
    </PlaceholderPage>
  )
}
