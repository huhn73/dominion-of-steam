import { Link } from 'react-router'
import { Sheet } from '../sections/lobby/components/shared'
import { useMarkNewsSeen, useUnseenNews } from '../data/news'
import { routes } from '../routes'
import { NewsList } from './NewsList'
import { useT } from '../i18n'

/**
 * „Neu in Dominion of Steam“: once after an update, the new features of every version the
 * player has not seen yet. Closing it in any way counts as seen. Only on menu pages, never in a
 * match (mounted in MenuLayout, below the router).
 */
export function NewsDialog() {
  const t = useT()
  const releases = useUnseenNews()
  const markSeen = useMarkNewsSeen()
  if (!releases.length) return null
  const close = () => markSeen.mutate(releases[0]!.version)
  return (
    <Sheet
      title={t('shell.news.title')}
      onClose={close}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to={routes.news}
            onClick={close}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-teal-700 underline-offset-4 hover:underline dark:text-teal-300"
          >
            {t('shell.news.all')}
          </Link>
          <button
            type="button"
            onClick={close}
            className="min-h-11 rounded-md bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            {t('shell.news.ok')}
          </button>
        </div>
      }
    >
      <NewsList releases={releases} />
    </Sheet>
  )
}
