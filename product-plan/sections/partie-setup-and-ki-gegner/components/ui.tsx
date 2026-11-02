import { useEffect, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import type { Faction } from '../types'
import { FACTION_HEX } from './setup'

/** Form block with a stamped heading */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-dashed border-stone-300 pt-5 first:border-0 first:pt-0 dark:border-stone-700">
      <legend className="sr-only">{label}</legend>
      <p aria-hidden className="mb-1 font-['Big_Shoulders_Display'] text-lg font-bold uppercase tracking-widest">
        {label}
      </p>
      {hint && <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">{hint}</p>}
      <div className={hint ? '' : 'mt-2'}>{children}</div>
    </fieldset>
  )
}

/** Large tappable option for a small set of choices */
export function OptionCard({
  selected,
  onSelect,
  disabled,
  title,
  description,
  aside,
}: {
  selected: boolean
  onSelect: () => void
  disabled?: boolean
  title: string
  description?: string
  aside?: ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`relative flex min-h-16 w-full items-start gap-3 rounded-lg border-2 p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-40 ${
        selected
          ? 'border-amber-500 bg-amber-50 ring-1 ring-inset ring-amber-500 dark:bg-amber-950/30'
          : 'border-stone-200 bg-white hover:border-teal-500 dark:border-stone-700 dark:bg-stone-900'
      }`}
    >
      <span
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? 'border-amber-500' : 'border-stone-300 dark:border-stone-600'
        }`}
      >
        {selected && <span className="size-2.5 rounded-full bg-amber-500" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        {description && <span className="mt-0.5 block text-sm text-stone-500 dark:text-stone-400">{description}</span>}
      </span>
      {aside}
    </button>
  )
}

/** Segmented control for 2–4 short options */
export function Segmented<T extends string | number | null>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-full flex-wrap rounded-lg border border-stone-300 bg-white p-1 sm:w-auto dark:border-stone-700 dark:bg-stone-900">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`min-h-10 flex-1 rounded-md px-4 text-sm font-semibold transition-colors sm:flex-none ${
            o.value === value
              ? 'bg-stone-900 text-amber-300 dark:bg-amber-500 dark:text-stone-950'
              : 'text-stone-600 hover:text-teal-700 dark:text-stone-300 dark:hover:text-teal-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 ${
          checked ? 'border-amber-600 bg-amber-500' : 'border-stone-300 bg-stone-200 dark:border-stone-600 dark:bg-stone-800'
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
      <span>
        <span className="block font-semibold">{label}</span>
        {description && <span className="block text-sm text-stone-500 dark:text-stone-400">{description}</span>}
      </span>
    </label>
  )
}

/** True once the image at `url` has loaded */
function useImageLoaded(url: string | null) {
  const [loaded, setLoaded] = useState<string | null>(null)
  useEffect(() => {
    if (!url) return
    const img = new Image()
    img.onload = () => setLoaded(url)
    img.src = url
    return () => {
      img.onload = null
    }
  }, [url])
  return !!url && loaded === url
}

/** Faction shield: real emblem if it exists, otherwise a placeholder in the faction color */
export function FactionEmblem({ faction, className = 'size-12' }: { faction: Faction; className?: string }) {
  const hasImage = useImageLoaded(faction.emblemUrl)
  if (hasImage && faction.emblemUrl) {
    return <img src={faction.emblemUrl} alt={`Wappen ${faction.name}`} className={`${className} object-contain`} />
  }
  const c = FACTION_HEX[faction.color]
  return (
    <svg viewBox="0 0 64 72" className={className} role="img" aria-label={`Wappen ${faction.name}`}>
      <path d="M32 2 L60 10 V34 C60 52 47 64 32 70 C17 64 4 52 4 34 V10 Z" fill="#b45309" />
      <path d="M32 6 L56 13 V34 C56 49 45 59 32 65 C19 59 8 49 8 34 V13 Z" fill={c.base} />
      <path d="M8 40 L32 26 L56 40 V46 L32 32 L8 46 Z" fill="#1c1917" opacity="0.28" />
      <text x="32" y="53" textAnchor="middle" fill="#fffbeb" style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 900, fontSize: 18 }}>
        {faction.shortName[0]}
      </text>
    </svg>
  )
}

/** Avatar or portrait with initials fallback */
export function Avatar({ name, url, color, className = 'size-11' }: { name: string; url: string | null; color?: string; className?: string }) {
  const hasImage = useImageLoaded(url)
  const initials = name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  if (hasImage && url) return <img src={url} alt="" className={`${className} rounded-full object-cover`} />
  return (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-full border-2 bg-stone-900 font-['Big_Shoulders_Display'] font-black text-stone-100`}
      style={{ borderColor: color ?? '#b45309' }}
    >
      {initials}
    </span>
  )
}

/** Dialog on desktop, bottom sheet on phones */
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Moves focus into the dialog, keeps Tab inside it and restores focus on close */
function useDialogFocus(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const root = ref.current
    if (!root) return
    // hidden elements (e.g. a file input behind a button) can't take focus
    const focusables = () => [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
    // prefer the first form field, otherwise the first button after the close button
    const first = focusables().find((el) => el.matches('input, select, textarea')) ?? focusables()[1] ?? focusables()[0]
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const head = items[0]
      const tail = items[items.length - 1]
      if (e.shiftKey && document.activeElement === head) {
        e.preventDefault()
        tail.focus()
      } else if (!e.shiftKey && document.activeElement === tail) {
        e.preventDefault()
        head.focus()
      }
    }
    root.addEventListener('keydown', onKey)
    return () => {
      root.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [ref])
}

export function Sheet({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const dialogRef = useRef<HTMLDivElement>(null)
  useDialogFocus(dialogRef)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/60 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-2xl bg-stone-50 shadow-2xl animate-in slide-in-from-bottom-6 sm:max-w-3xl sm:rounded-2xl dark:bg-stone-900"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-stone-300 sm:hidden dark:bg-stone-600" />
        <header className="flex items-center justify-between border-b-4 border-double border-stone-200 px-5 py-3 dark:border-stone-700">
          <h2 className="font-['Big_Shoulders_Display'] text-2xl font-black uppercase tracking-wide">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Schließen" className="flex size-11 items-center justify-center rounded-md text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800">
            <X className="size-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <footer className="border-t border-stone-200 px-5 py-3 dark:border-stone-700">{footer}</footer>}
      </div>
    </div>
  )
}
