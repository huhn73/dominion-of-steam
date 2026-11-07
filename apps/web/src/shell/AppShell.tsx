import type { ComponentType, ReactNode } from 'react'
import { ArrowLeft, Cog, Menu } from 'lucide-react'
import { MainNav, type NavigationItem } from './MainNav'
import { UserMenu, type ShellUser } from './UserMenu'
import { useT } from '../i18n'

export interface GameHeader {
  /** e.g. "Runde 14" */
  title: string
  /** e.g. "Dein Zug" or "Warte auf Gegner" */
  status?: string
  isYourTurn?: boolean
}

export interface AppShellProps {
  children: ReactNode
  navigationItems: NavigationItem[]
  user?: ShellUser
  /** 'menu' shows the full navigation, 'game' shows a minimal full-screen header */
  mode?: 'menu' | 'game'
  gameHeader?: GameHeader
  onNavigate?: (href: string) => void
  onLogout?: () => void
  onOpenProfile?: () => void
  onOpenSettings?: () => void
  onOpenLegal?: () => void
  onOpenAdmin?: () => void
  onExitGame?: () => void
  onOpenGameMenu?: () => void
  logo?: ComponentType<{ className?: string }>
  /** Extra controls in the header, left of the user menu (e.g. the mute button) */
  headerExtra?: ReactNode
  /** Footer under the content (menu mode only), e.g. the legal links */
  footer?: ReactNode
}

export function AppShell({
  children,
  navigationItems,
  user,
  mode = 'menu',
  gameHeader,
  onNavigate,
  onLogout,
  onOpenProfile,
  onOpenSettings,
  onOpenLegal,
  onOpenAdmin,
  onExitGame,
  onOpenGameMenu,
  logo: Logo = Cog,
  headerExtra,
  footer,
}: AppShellProps) {
  const t = useT()
  const userMenu = user && (
    <UserMenu
      user={user}
      onLogout={onLogout}
      onOpenProfile={onOpenProfile}
      onOpenSettings={onOpenSettings}
      onOpenLegal={onOpenLegal}
      onOpenAdmin={onOpenAdmin}
    />
  )

  if (mode === 'game') {
    return (
      <div className="flex h-dvh flex-col bg-stone-100 font-['Barlow'] text-stone-900 dark:bg-stone-950 dark:text-stone-100">
        <header className="relative z-20 flex h-12 shrink-0 items-center gap-2 border-b-4 border-double border-stone-300 bg-stone-50/95 px-2 pt-[env(safe-area-inset-top)] backdrop-blur sm:h-14 sm:px-4 dark:border-stone-700 dark:bg-stone-900/95">
          <button
            type="button"
            onClick={onExitGame}
            aria-label={t('shell.backToLobby')}
            className="flex size-9 items-center justify-center rounded-md text-stone-600 transition-colors hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-teal-500 dark:text-stone-300 dark:hover:bg-teal-950 dark:hover:text-teal-300"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div className="flex min-w-0 flex-1 items-baseline gap-3">
            <span className="min-w-0 truncate font-['Big_Shoulders_Display'] text-lg font-bold uppercase tracking-wider sm:text-xl">
              {gameHeader?.title}
            </span>
            {gameHeader?.status && (
              <span
                className={`flex min-w-0 shrink-[2] items-center gap-1.5 truncate font-['IBM_Plex_Mono'] text-xs uppercase ${
                  gameHeader.isYourTurn
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                {gameHeader.isYourTurn && (
                  <span className="size-2 shrink-0 animate-pulse rounded-full bg-amber-500" />
                )}
                <span className="truncate">{gameHeader.status}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenGameMenu}
            aria-label={t('shell.gameMenu')}
            className="flex size-9 items-center justify-center rounded-md text-stone-600 transition-colors hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-teal-500 dark:text-stone-300 dark:hover:bg-teal-950 dark:hover:text-teal-300"
          >
            <Menu className="size-5" />
          </button>
          {headerExtra}
          {userMenu}
        </header>

        <main className="relative min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-stone-100 font-['Barlow'] text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <header className="sticky top-0 z-20 border-b-4 border-double border-stone-300 bg-stone-50/95 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-stone-700 dark:bg-stone-900/95">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:h-16 sm:px-6">
          <button
            type="button"
            onClick={() => onNavigate?.(navigationItems[0]?.href ?? '/')}
            className="flex shrink-0 items-center gap-2 focus-visible:outline-2 focus-visible:outline-teal-500"
          >
            <span className="flex size-9 items-center justify-center rounded-full border-2 border-amber-600 bg-stone-900 text-amber-400 shadow-inner dark:border-amber-500">
              <Logo className="size-5" />
            </span>
            <span className="font-['Big_Shoulders_Display'] text-xl font-black uppercase leading-none tracking-[0.12em] text-stone-900 dark:text-amber-50">
              <span className="hidden lg:inline">Dominion of Steam</span>
              <span className="lg:hidden">DoS</span>
            </span>
          </button>

          <MainNav
            items={navigationItems}
            onNavigate={onNavigate}
            className="hidden flex-1 md:flex"
          />

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            {headerExtra}
            {userMenu}
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <main className="flex-1">{children}</main>
        {footer}
      </div>

      <MainNav items={navigationItems} onNavigate={onNavigate} variant="tabbar" className="md:hidden" />
    </div>
  )
}
