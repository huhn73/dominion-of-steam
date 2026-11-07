import { Navigate, Outlet, useLocation } from 'react-router'
import { Cog } from 'lucide-react'
import { useMe } from '../data/session'
import { routes } from '../routes'
import { ApplyPlayerSettings } from '../settings/ApplyPlayerSettings'
import { SignedInAudio } from '../audio/AudioProvider'
import { ServerEvents } from '../data/events'
import { useT } from '../i18n'

/** Route guard: without a logged-in player go to the login page and come back afterwards */
export function RequireAuth() {
  const t = useT()
  const { data: me, isError, refetch } = useMe()
  const { pathname, search, hash } = useLocation()

  if (me === null) {
    const next = `${pathname}${search}${hash}`
    const to =
      next === routes.lobby ? routes.login : `${routes.login}?weiter=${encodeURIComponent(next)}`
    return <Navigate to={to} replace />
  }
  if (me)
    return (
      <>
        <ApplyPlayerSettings />
        <SignedInAudio />
        <ServerEvents key={me.id} />
        <Outlet />
      </>
    )

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-stone-100 px-4 font-['Barlow'] text-stone-600 dark:bg-stone-950 dark:text-stone-400">
      <Cog className="size-10 animate-spin text-amber-600 [animation-duration:3s] dark:text-amber-500" />
      {isError ? (
        <div role="alert" className="text-center">
          <p>{t('common.api.network')}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 min-h-11 rounded-md border border-stone-300 px-4 font-['IBM_Plex_Mono'] text-xs uppercase hover:border-teal-500 hover:text-teal-700 dark:border-stone-700 dark:hover:text-teal-300"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-widest">
          {t('common.loading')}
        </p>
      )}
    </div>
  )
}
