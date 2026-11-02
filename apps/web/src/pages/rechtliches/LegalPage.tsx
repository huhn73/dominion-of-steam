import type { ReactNode } from 'react'
import { AuthLayout, linkClass } from '../anmeldung/AuthLayout'
import { useBack } from '../kompendium/useBack'
import { routes } from '../../routes'
import { STAND } from './anbieter'
import type { LegalPageId } from './LegalLinks'

/** Frame of the legal pages: the wide brass card with a back link and the date of the text */
export function LegalPage({
  id,
  title,
  children,
}: {
  id: LegalPageId
  title: string
  children: ReactNode
}) {
  // Back to where the reader came from; opened directly, "/" leads to the lobby or the login
  const back = useBack(routes.lobby)
  return (
    <AuthLayout
      title={title}
      width="2xl"
      legalPage={id}
      footer={
        <button type="button" onClick={back} className={linkClass}>
          Zurück
        </button>
      }
    >
      <div className="space-y-5 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        {children}
        <p className="text-xs text-stone-500 dark:text-stone-400">Stand: {STAND}</p>
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
