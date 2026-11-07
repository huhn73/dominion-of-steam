import { appVersion, type AppVersion as Version } from '../version'
import { ANBIETER } from '../pages/rechtliches/anbieter'

import { formatDate, translate, type Locale } from '@dos/shared/i18n'
import { useLocale } from '../i18n'

/** Tooltip: commit and build date when the image build provided them */
function details(locale: Locale, v: Version) {
  const parts = [
    v.commit && `Commit ${v.commit.slice(0, 7)}`,
    v.built &&
      !Number.isNaN(Date.parse(v.built)) &&
      translate(locale, 'shell.version.built', {
        date: formatDate(locale, v.built, { dateStyle: 'long' }),
      }),
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : translate(locale, 'shell.version.dev')
}

/**
 * The running version, small and muted next to the legal links („v0.9.0“). A release links to
 * its GitHub release, a build between releases to its commit; a local build has no link.
 */
export function AppVersion({ version = appVersion() }: { version?: Version }) {
  const { locale } = useLocale()
  const text = `v${version.label}`
  const href = version.isRelease
    ? `${ANBIETER.repo}/releases/tag/v${version.label}`
    : version.commit
      ? `${ANBIETER.repo}/commit/${version.commit}`
      : null
  const className =
    "font-['IBM_Plex_Mono'] text-[11px] tracking-wide text-stone-400 dark:text-stone-500"
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={details(locale, version)}
      aria-label={`Version ${version.label}`}
      className={`${className} inline-flex min-h-8 items-center underline-offset-4 hover:text-teal-700 hover:underline dark:hover:text-teal-300`}
    >
      {text}
    </a>
  ) : (
    <span
      title={details(locale, version)}
      aria-label={`Version ${version.label}`}
      className={className}
    >
      {text}
    </span>
  )
}
