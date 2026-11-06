import type { ReactNode } from 'react'
import { AuthLayout, linkClass } from '../anmeldung/AuthLayout'
import { Link } from 'react-router'
import { useMe } from '../../data/session'
import { routes } from '../../routes'
import { STAND } from './anbieter'
import type { LegalPageId } from './LegalLinks'

/** Frame of the legal pages: the wide brass card with a back link and the date of the text */
export function LegalPage({
  id,
  title,
  stand = STAND,
  children,
}: {
  /** Highlighted in the legal links; pages outside them (Neuigkeiten) leave it out */
  id?: LegalPageId
  title: string
  /** Date of the text; null hides the line */
  stand?: string | null
  children: ReactNode
}) {
  // A fixed way out instead of the history: moving between the legal pages would otherwise
  // lead back through all of them. While the session loads the lobby is the target, signed
  // out `RequireAuth` sends it on to the login anyway.
  const { data: me } = useMe()
  const exit =
    me === null
      ? { to: routes.login, label: 'Zur Anmeldung' }
      : { to: routes.lobby, label: 'Zur Lobby' }
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
        {children}
        {stand && <p className="text-xs text-stone-500 dark:text-stone-400">Stand: {stand}</p>}
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
