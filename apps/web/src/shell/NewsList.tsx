import type { ReleaseNotes } from '@dos/shared/news'
import { formatDate, type Locale } from '@dos/shared/i18n'
import { useLocale, useT } from '../i18n'

export const releaseDate = (locale: Locale, iso: string) =>
  formatDate(locale, `${iso}T12:00:00`, { dateStyle: 'long' })

/** The releases with their new features, one sentence each (hint and page „Neuigkeiten“) */
export function NewsList({ releases }: { releases: readonly ReleaseNotes[] }) {
  const t = useT()
  const { locale } = useLocale()
  return (
    <div className="space-y-6">
      {releases.map((release) => (
        <section key={release.version} aria-labelledby={`news-${release.version}`}>
          <h3
            id={`news-${release.version}`}
            className="flex flex-wrap items-baseline gap-x-3 border-b border-stone-200 pb-1 dark:border-stone-700"
          >
            <span className="font-['Big_Shoulders_Display'] text-xl font-bold uppercase tracking-wider text-stone-900 dark:text-amber-50">
              {t('shell.news.version', { version: release.version })}
            </span>
            <span className="font-['IBM_Plex_Mono'] text-xs text-stone-500 dark:text-stone-400">
              {releaseDate(locale, release.date)}
            </span>
          </h3>
          {release.items.length ? (
            <ul className="mt-3 space-y-3">
              {release.items.map((item) => (
                <li key={item.title} className="text-sm leading-relaxed">
                  <span className="font-semibold text-stone-900 dark:text-stone-100">
                    {item.title}:
                  </span>{' '}
                  <span className="text-stone-700 dark:text-stone-300">{item.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
              {t('shell.news.fixesOnly')}
            </p>
          )}
        </section>
      ))}
    </div>
  )
}
