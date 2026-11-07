import { Link } from 'react-router'
import { PlaceholderPage } from './PlaceholderPage'
import { routes } from '../routes'
import { useT } from '../i18n'

export function NotFoundPage() {
  const t = useT()
  return (
    <PlaceholderPage title={t('legal.notFound')}>
      <p>
        {t('legal.notFoundText')}{' '}
        <Link to={routes.lobby} className="text-teal-700 underline dark:text-teal-300">
          {t('legal.toLobby')}
        </Link>
      </p>
    </PlaceholderPage>
  )
}
