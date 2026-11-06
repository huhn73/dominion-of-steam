import { useEffect, useRef, type ReactNode } from 'react'
import type { ControlSettings, DisplaySettings } from '@dos/shared/profile'
import { zoomSpeed } from '../sections/spielfeld/components/camera'

/**
 * Zoom steps per wheel event for „Zoom-Empfindlichkeit“ 0–100: 50 is the board's own behaviour
 * (one step per event), 0 every second event, 100 two steps per event.
 */
export const zoomStepsPerWheel = zoomSpeed

/** Delay between extra zoom steps, so the board has rendered the previous one */
const EXTRA_STEP_MS = 20

/**
 * Thin layer around the board components (which take no settings) that applies what can be
 * applied from outside:
 * - „Kampfanimationen“ off hides the explosion of the combat animation (CSS class)
 * - „Rechte Maustaste: Kontextmenü“ lets the browser's context menu through instead of the
 *   board's „Abbrechen“ (Esc still cancels)
 * - „Zoom-Empfindlichkeit“ scales mouse-wheel zooming by dropping or repeating wheel events
 * „Einheiten ziehen“, „Nachfrage beim Zugende“ and the pinch zoom are applied by the board itself
 * (prop `controls`).
 */
export function BoardSettingsLayer({
  display,
  controls,
  children,
}: {
  display: DisplaySettings
  controls: ControlSettings
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const latest = useRef(controls)
  useEffect(() => {
    latest.current = controls
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const own = new WeakSet<Event>()
    const timers = new Set<ReturnType<typeof setTimeout>>()
    let pending = 0
    // Capture phase on the layer: stopping here keeps the event away from React's handlers
    const onWheel = (e: WheelEvent) => {
      if (own.has(e)) return
      pending += zoomStepsPerWheel(latest.current.zoomSensitivity)
      const steps = Math.floor(pending)
      pending -= steps
      if (steps === 0) {
        e.stopPropagation()
        e.preventDefault()
        return
      }
      const target = e.target
      for (let i = 1; i < steps; i++) {
        const timer = setTimeout(() => {
          timers.delete(timer)
          const copy = new WheelEvent('wheel', {
            bubbles: true,
            cancelable: true,
            deltaX: e.deltaX,
            deltaY: e.deltaY,
            deltaMode: e.deltaMode,
            clientX: e.clientX,
            clientY: e.clientY,
          })
          own.add(copy)
          target?.dispatchEvent(copy)
        }, i * EXTRA_STEP_MS)
        timers.add(timer)
      }
    }
    const onContextMenu = (e: MouseEvent) => {
      if (latest.current.rightClick === 'contextMenu') e.stopPropagation()
    }
    el.addEventListener('wheel', onWheel, { capture: true, passive: false })
    el.addEventListener('contextmenu', onContextMenu, { capture: true })
    return () => {
      el.removeEventListener('wheel', onWheel, { capture: true })
      el.removeEventListener('contextmenu', onContextMenu, { capture: true })
      timers.forEach(clearTimeout)
    }
  }, [])

  return (
    <div
      ref={ref}
      data-testid="board-settings"
      className={`size-full ${display.combatAnimations ? '' : 'dos-no-combat-fx'}`}
    >
      {children}
    </div>
  )
}
