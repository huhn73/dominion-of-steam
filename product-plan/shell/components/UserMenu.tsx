import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut, Settings, User } from 'lucide-react'

export interface ShellUser {
  name: string
  avatarUrl?: string
}

export interface UserMenuProps {
  user: ShellUser
  onLogout?: () => void
  onOpenProfile?: () => void
  onOpenSettings?: () => void
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function UserMenu({ user, onLogout, onOpenProfile, onOpenSettings }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const select = (action?: () => void) => () => {
    setOpen(false)
    action?.()
  }

  const itemClass =
    'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-stone-700 transition-colors hover:bg-teal-50 hover:text-teal-800 focus-visible:bg-teal-50 focus-visible:outline-none dark:text-stone-200 dark:hover:bg-teal-950 dark:hover:text-teal-200 dark:focus-visible:bg-teal-950'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Benutzermenü für ${user.name}`}
        className="flex items-center gap-1.5 rounded-full p-0.5 focus-visible:outline-2 focus-visible:outline-teal-500"
      >
        <span className="flex size-9 items-center justify-center overflow-hidden rounded-full border-2 border-amber-600 bg-stone-200 font-['Big_Shoulders_Display'] text-sm font-bold text-stone-700 dark:border-amber-500 dark:bg-stone-800 dark:text-amber-200">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            initials(user.name)
          )}
        </span>
        <ChevronDown
          className={`hidden size-4 text-stone-500 transition-transform sm:block dark:text-stone-400 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xl shadow-stone-900/10 dark:border-stone-700 dark:bg-stone-900 dark:shadow-black/40"
        >
          <div className="border-b-4 border-double border-stone-200 px-4 py-3 dark:border-stone-700">
            <p className="font-['Big_Shoulders_Display'] text-base font-bold uppercase tracking-wider text-stone-900 dark:text-amber-50">
              {user.name}
            </p>
          </div>
          <div className="py-1">
            <button type="button" role="menuitem" onClick={select(onOpenProfile)} className={itemClass}>
              <User className="size-4" /> Profil
            </button>
            <button type="button" role="menuitem" onClick={select(onOpenSettings)} className={itemClass}>
              <Settings className="size-4" /> Einstellungen
            </button>
          </div>
          <div className="border-t border-stone-200 py-1 dark:border-stone-700">
            <button type="button" role="menuitem" onClick={select(onLogout)} className={itemClass}>
              <LogOut className="size-4" /> Abmelden
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
