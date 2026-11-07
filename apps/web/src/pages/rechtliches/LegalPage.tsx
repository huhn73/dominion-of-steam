import type { ReactNode } from 'react'
import { AuthLayout, linkClass } from '../anmeldung/AuthLayout'
import { Link } from 'react-router'
import { useMe } from '../../data/session'
import { routes } from '../../routes'
import { STAND } from './anbieter'
import { formatDate } from '@dos/shared/i18n'
import type { LegalPageId } from './LegalLinks'
import { useLocale, useT } from '../../i18n'

/** Frame of the legal pages: the wide brass card with a back link and the date of the text */
export function LegalPage({
  id,
  title,
  stand = STAND,
  translation = false,
  children,
}: {
  /** Highlighted in the legal links; pages outside them (Neuigkeiten) leave it out */
  id?: LegalPageId
  title: string
  /** Date of the text (ISO); null hides the line */
  stand?: string | null
  /** A translation: shows that the German text is binding */
  translation?: boolean
  children: ReactNode
}) {
  // A fixed way out instead of the history: moving between the legal pages would otherwise
  // lead back through all of them. While the session loads the lobby is the target, signed
  // out `RequireAuth` sends it on to the login anyway.
  const t = useT()
  const { locale } = useLocale()
  const { data: me } = useMe()
  const exit =
    me === null
      ? { to: routes.login, label: t('legal.toLogin') }
      : { to: routes.lobby, label: t('legal.toLobby') }
  return (
    <AuthLayout
      title={title}
      width="2xl"
      legalPage={id}
      footer={
        <Link to={exit.to} className={linkClass}>
          {exit.label}
        </Link>
      }
    >
      <div className="space-y-5 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        {translation && (
          <p
            role="note"
            lang="en"
            className="rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-xs dark:border-stone-700 dark:bg-stone-950"
          >
            {t('legal.translationNotice')}
          </p>
        )}
        {children}
        {stand && (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {t('legal.stand', {
              date: formatDate(locale, `${stand}T12:00:00`, { dateStyle: 'long' }),
            })}
          </p>
        )}
      </div>
    </AuthLayout>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-['Big_Shoulders_Display'] text-xl font-bold uppercase tracking-wider text-stone-900 dark:text-amber-50">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`${linkClass} min-h-0`}>
      {children}
    </a>
  )
}
