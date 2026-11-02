import { useEffect } from 'react'
import { DoorOpen, Flag, Info, Settings } from 'lucide-react'

export interface GameMenuProps {
  open: boolean
  onClose: () => void
  onOpenSettings?: () => void
  onExitGame?: () => void
  /** Opens the confirmation "Partie aufgeben?"; without it the item is disabled */
  onSurrender?: () => void
}

const itemClass =
  'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-stone-700 transition-colors hover:bg-teal-50 hover:text-teal-800 focus-visible:bg-teal-50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 dark:text-stone-200 dark:hover:bg-teal-950 dark:hover:text-teal-200 dark:focus-visible:bg-teal-950'

/** Vorläufiges Spielmenü, bis es gestaltet ist (siehe 01-shell.md, „Offene Punkte“) */
export function GameMenu({
  open,
  onClose,
  onOpenSettings,
  onExitGame,
  onSurrender,
}: GameMenuProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const select = (action?: () => void) => () => {
    onClose()
    action?.()
  }

  return (
    <div className="fixed inset-0 z-30" onClick={onClose} data-testid="game-menu-backdrop">
      <div
        role="menu"
        aria-label="Spielmenü"
        onClick={(e) => e.stopPropagation()}
        className="absolute right-2 top-[calc(3.5rem+env(safe-area-inset-top))] w-60 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xl shadow-stone-900/10 animate-in fade-in slide-in-from-top-2 sm:right-4 sm:top-[calc(4rem+env(safe-area-inset-top))] dark:border-stone-700 dark:bg-stone-900 dark:shadow-black/40"
      >
        <div className="py-1">
          <button type="button" role="menuitem" disabled className={itemClass}>
            <Info className="size-4" /> Partie-Details
            <span className="ml-auto font-['IBM_Plex_Mono'] text-[10px] uppercase">folgt</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={select(onOpenSettings)}
            className={itemClass}
          >
            <Settings className="size-4" /> Einstellungen
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!onSurrender}
            onClick={select(onSurrender)}
            className={`${itemClass} text-rose-700 dark:text-rose-400`}
          >
            <Flag className="size-4" /> Aufgeben
          </button>
        </div>
        <div className="border-t border-stone-200 py-1 dark:border-stone-700">
          <button type="button" role="menuitem" onClick={select(onExitGame)} className={itemClass}>
            <DoorOpen className="size-4" /> Zurück zur Lobby
          </button>
        </div>
      </div>
    </div>
  )
}
