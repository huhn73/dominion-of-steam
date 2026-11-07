import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { Sheet } from './ui'
import {
  clampView,
  cropFromView,
  imageLayout,
  initialView,
  MAX_ZOOM,
  panView,
  type Crop,
  type CropView,
} from './cropMath'
import { useT } from '../../../i18n'

/**
 * Choose the round cut-out of a new avatar: drag (mouse, touch), zoom (slider, wheel, pinch,
 * +/−), arrow keys. Reports the square in pixels of the upright image; the server cuts and scales.
 */
export function AvatarCropper({
  file,
  onApply,
  onCancel,
}: {
  file: File
  onApply: (crop: Crop) => void
  onCancel: () => void
}) {
  // Created in the effect: StrictMode runs cleanups once on mount, a memoised URL would be revoked
  const t = useT()
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  const stageRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState(288)
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null)
  const [view, setView] = useState<CropView | null>(null)
  const [failed, setFailed] = useState(false)
  const pointers = useRef(new Map<number, { x: number; y: number }>())

  // Stage width follows the layout (narrow phones)
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => el.clientWidth > 0 && setStage(el.clientWidth)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const update = (fn: (v: CropView, w: number, h: number) => CropView) =>
    setView((v) => (v && natural ? fn(v, natural.width, natural.height) : v))
  const zoomTo = (zoom: number) => update((v, w, h) => clampView({ ...v, zoom }, w, h))
  const zoomBy = (factor: number) =>
    update((v, w, h) => clampView({ ...v, zoom: v.zoom * factor }, w, h))

  // Wheel zoom needs a non-passive listener to keep the page from scrolling
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoomBy(Math.exp(-e.deltaY * 0.0015))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  })

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const map = pointers.current
    const last = map.get(e.pointerId)
    if (!last) return
    if (map.size >= 2) {
      // Pinch: the change of distance between the first two fingers
      const [a, b] = [...map.entries()].slice(0, 2)
      const other = a![0] === e.pointerId ? b![1] : a![1]
      const before = Math.hypot(last.x - other.x, last.y - other.y)
      const after = Math.hypot(e.clientX - other.x, e.clientY - other.y)
      if (before > 0) zoomBy(after / before)
    } else {
      const dx = e.clientX - last.x
      const dy = e.clientY - last.y
      update((v, w, h) => panView(v, dx, dy, stage, w, h))
    }
    map.set(e.pointerId, { x: e.clientX, y: e.clientY })
  }
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => pointers.current.delete(e.pointerId)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = 12
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    if (moves[e.key]) {
      const [dx, dy] = moves[e.key]!
      update((v, w, h) => panView(v, dx, dy, stage, w, h))
    } else if (e.key === '+' || e.key === '=') zoomBy(1.15)
    else if (e.key === '-') zoomBy(1 / 1.15)
    else return
    e.preventDefault()
  }

  const layout = view && natural ? imageLayout(view, stage, natural.width, natural.height) : null

  return (
    <Sheet
      title={t('profile.crop.title')}
      onClose={onCancel}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-lg border-2 border-stone-300 px-4 font-semibold dark:border-stone-700"
          >
            {t('profile.cancel')}
          </button>
          <button
            type="button"
            disabled={!view || !natural}
            onClick={() =>
              view && natural && onApply(cropFromView(view, natural.width, natural.height))
            }
            className="min-h-11 rounded-lg bg-amber-500 px-5 font-semibold text-stone-950 hover:bg-amber-400 disabled:opacity-40"
          >
            {t('profile.crop.apply')}
          </button>
        </div>
      }
    >
      <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">
        {t('profile.crop.hint')}
      </p>
      <div
        ref={stageRef}
        role="application"
        aria-label={t('profile.crop.area')}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="relative mx-auto aspect-square w-full max-w-72 cursor-grab touch-none overflow-hidden rounded-lg bg-stone-900 select-none outline-none focus-visible:ring-4 focus-visible:ring-amber-400 active:cursor-grabbing"
      >
        {url && (
          <img
            src={url}
            alt={t('profile.crop.preview')}
            draggable={false}
            onLoad={(e) => {
              const { naturalWidth: width, naturalHeight: height } = e.currentTarget
              if (!width || !height) return setFailed(true)
              setNatural({ width, height })
              setView(initialView(width, height))
            }}
            onError={() => setFailed(true)}
            className="pointer-events-none absolute max-w-none"
            style={
              layout
                ? { width: layout.width, height: layout.height, left: layout.left, top: layout.top }
                : { opacity: 0 }
            }
          />
        )}
        <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(12,10,9,0.6)] ring-2 ring-amber-300/80" />
      </div>
      {failed && (
        <p className="mt-3 text-sm font-semibold text-rose-600">
          {t('profile.crop.broken')}
        </p>
      )}
      <div className="mx-auto mt-4 flex max-w-72 items-center gap-3">
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.25)}
          aria-label={t('profile.crop.zoomOut')}
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-stone-600 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          <ZoomOut className="size-5" />
        </button>
        <input
          type="range"
          aria-label={t('profile.crop.zoom')}
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={view?.zoom ?? 1}
          disabled={!view}
          onChange={(e) => zoomTo(Number(e.target.value))}
          className="min-w-0 flex-1 accent-amber-500"
        />
        <button
          type="button"
          onClick={() => zoomBy(1.25)}
          aria-label={t('profile.crop.zoomIn')}
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-stone-600 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          <ZoomIn className="size-5" />
        </button>
      </div>
    </Sheet>
  )
}
