import type { ComponentType } from 'react'
import { useT } from '../i18n'

export interface NavigationItem {
  label: string
  href: string
  isActive?: boolean
  icon?: ComponentType<{ className?: string }>
  /** e.g. number of matches where it's the player's turn */
  badge?: number
}

export interface MainNavProps {
  items: NavigationItem[]
  onNavigate?: (href: string) => void
  /** 'top' for the desktop header, 'tabbar' for the fixed mobile bottom bar */
  variant?: 'top' | 'tabbar'
  className?: string
}

function Badge({ count, className = '' }: { count: number; className?: string }) {
  return (
    <span
      className={`flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-500 px-1 font-['IBM_Plex_Mono'] text-[10px] font-semibold text-stone-950 ${className}`}
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}

export function MainNav({ items, onNavigate, variant = 'top', className = '' }: MainNavProps) {
  const t = useT()
  if (variant === 'tabbar') {
    return (
      <nav
        aria-label={t('shell.mainNav')}
        className={`fixed inset-x-0 bottom-0 z-20 border-t-4 border-double border-stone-300 bg-stone-50/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-stone-700 dark:bg-stone-900/95 ${className}`}
      >
        <ul className="flex h-16">
          {items.map(({ label, href, isActive, icon: Icon, badge }) => (
            <li key={href} className="flex-1">
              <button
                type="button"
                onClick={() => onNavigate?.(href)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex h-full w-full flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-500 ${
                  isActive
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-stone-500 active:text-teal-700 dark:text-stone-400 dark:active:text-teal-300'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-x-6 top-0 h-0.5 rounded-b bg-amber-500" />
                )}
                <span className="relative">
                  {Icon && <Icon className="size-5" />}
                  {!!badge && <Badge count={badge} className="absolute -right-3 -top-2" />}
                </span>
                <span className="font-['Big_Shoulders_Display'] text-xs font-bold uppercase tracking-wider">
                  {label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    )
  }

  return (
    <nav aria-label={t('shell.mainNav')} className={className}>
      <ul className="flex h-full items-stretch gap-1">
        {items.map(({ label, href, isActive, icon: Icon, badge }) => (
          <li key={href}>
            <button
              type="button"
              onClick={() => onNavigate?.(href)}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex h-full items-center gap-2 px-3 font-['Big_Shoulders_Display'] text-base font-bold uppercase tracking-widest transition-colors focus-visible:outline-2 focus-visible:outline-teal-500 ${
                isActive
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-stone-600 hover:text-teal-700 dark:text-stone-300 dark:hover:text-teal-300'
              }`}
            >
              {Icon && <Icon className="size-4" />}
              {label}
              {!!badge && <Badge count={badge} />}
              <span
                className={`absolute inset-x-2 bottom-0 h-[3px] rounded-t transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600'
                    : 'bg-transparent group-hover:bg-teal-500/40'
                }`}
              />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
