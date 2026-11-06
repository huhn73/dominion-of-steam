import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, ChevronUp, GraduationCap, LogOut, SkipForward } from 'lucide-react'
import type { TutorialView } from '@dos/shared/game'

const DONE_FLASH_MS = 1800

interface TutorialPanelProps {
  tutorial: TutorialView
  /** Commands are being sent: buttons wait */
  busy?: boolean
  onNext: () => void
  onSkip: () => void
  onLeave: () => void
}

/**
 * Guided step of the tutorial match: not blocking, the player acts on the board meanwhile.
 * Text steps are confirmed with „Weiter“, action steps move on by themselves.
 */
export function TutorialPanel({ tutorial, busy, onNext, onSkip, onLeave }: TutorialPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [flash, setFlash] = useState(false)
  const lastStep = useRef({ step: tutorial.step, manual: tutorial.current?.manual ?? true })
  useEffect(() => {
    const last = lastStep.current
    if (tutorial.step === last.step) return
    lastStep.current = { step: tutorial.step, manual: tutorial.current?.manual ?? true }
    // An action step fulfilled: short confirmation, the panel opens again („Weiter“ needs none)
    if (tutorial.step < last.step || last.manual) return
    setCollapsed(false)
    setFlash(true)
    const timer = setTimeout(() => setFlash(false), DONE_FLASH_MS)
    return () => clearTimeout(timer)
  }, [tutorial.step])

  const step = tutorial.current
  if (!step) return null
  const progress = `${tutorial.step + 1}/${tutorial.total}`

  return (
    <section
      aria-label="Tutorial"
      className="pointer-events-auto w-full rounded-xl border border-teal-700/60 bg-stone-950/95 text-stone-100 shadow-2xl backdrop-blur"
    >
      <header className="flex items-center gap-2 px-3 py-2">
        <GraduationCap className="size-5 shrink-0 text-teal-300" />
        <div className="min-w-0 flex-1">
          <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-widest text-teal-300">
            Tutorial · Schritt {progress}
          </p>
          <h2 className="truncate font-['Big_Shoulders_Display'] text-lg font-black uppercase leading-tight tracking-wider">
            {step.title}
          </h2>
        </div>
        {flash && (
          <span
            role="status"
            className="flex items-center gap-1 rounded bg-teal-600 px-2 py-0.5 text-xs font-bold text-white animate-in fade-in"
          >
            <Check className="size-3.5" /> Geschafft!
          </span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Tutorial aufklappen' : 'Tutorial einklappen'}
          className="flex size-9 shrink-0 items-center justify-center rounded-md text-stone-300 hover:bg-stone-800"
        >
          {collapsed ? <ChevronDown className="size-5" /> : <ChevronUp className="size-5" />}
        </button>
      </header>
      {!collapsed && (
        <>
          <div
            className="h-1 bg-stone-800"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={tutorial.total}
            aria-valuenow={tutorial.step}
            aria-label="Fortschritt"
          >
            <div
              className="h-full bg-teal-500 transition-[width] duration-500"
              style={{ width: `${(tutorial.step / tutorial.total) * 100}%` }}
            />
          </div>
          <p className="max-h-[30vh] overflow-y-auto px-3 py-2 text-sm leading-relaxed text-stone-200 md:max-h-none">
            {step.text}
          </p>
          <footer className="flex items-center gap-1 border-t border-stone-800 px-3 py-2">
            {step.manual ? (
              <button
                type="button"
                onClick={onNext}
                disabled={busy}
                className="min-h-10 rounded-md bg-amber-500 px-4 text-sm font-bold uppercase tracking-wider text-stone-950 hover:bg-amber-400 disabled:opacity-50"
              >
                Weiter
              </button>
            ) : (
              <span className="text-xs italic text-stone-400">Wartet auf deine Aktion</span>
            )}
            <span className="flex-1" />
            {!step.manual && (
              <button
                type="button"
                onClick={onSkip}
                disabled={busy}
                className="flex min-h-10 items-center gap-1 rounded-md px-2 text-xs font-semibold text-stone-300 hover:bg-stone-800 disabled:opacity-50"
              >
                <SkipForward className="size-4" /> Überspringen
              </button>
            )}
            <button
              type="button"
              onClick={onLeave}
              className="flex min-h-10 items-center gap-1 rounded-md px-2 text-xs font-semibold text-stone-300 hover:bg-stone-800"
            >
              <LogOut className="size-4" /> Beenden
            </button>
          </footer>
        </>
      )}
    </section>
  )
}
