import { useEffect, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import type { Faction } from '../types'
import { FACTION_HEX } from './format'

// Mirrors the controls of the other sections so this section stays exportable on its own.

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

export function FactionEmblem({ faction, className = 'size-6' }: { faction: Faction; className?: string }) {
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

export function Avatar({ name, url, className = 'size-10', ring = '#b45309' }: { name: string; url: string | null; className?: string; ring?: string }) {
  const hasImage = useImageLoaded(url)
  const initials = name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  if (hasImage && url) return <img src={url} alt="" className={`${className} shrink-0 rounded-full border-4 object-cover`} style={{ borderColor: ring }} />
  return (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-full border-4 bg-stone-900 font-['Big_Shoulders_Display'] font-black text-stone-100`}
      style={{ borderColor: ring }}
    >
      {initials || '?'}
    </span>
  )
}

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
        className="flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-2xl bg-stone-50 text-stone-900 shadow-2xl animate-in slide-in-from-bottom-6 sm:max-w-lg sm:rounded-2xl dark:bg-stone-900 dark:text-stone-100"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-stone-300 sm:hidden dark:bg-stone-600" />
        <header className="flex items-center justify-between gap-4 border-b-4 border-double border-stone-200 px-5 py-3 dark:border-stone-700">
          <h2 className="truncate font-['Big_Shoulders_Display'] text-2xl font-black uppercase tracking-wide">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Schließen" className="flex size-11 shrink-0 items-center justify-center rounded-md text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800">
            <X className="size-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <footer className="border-t border-stone-200 px-5 py-3 dark:border-stone-700">{footer}</footer>}
      </div>
    </div>
  )
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
  disabled,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
  disabled?: boolean
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-full flex-wrap rounded-lg border border-stone-300 bg-white p-1 sm:w-auto dark:border-stone-700 dark:bg-stone-900">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={`min-h-10 flex-1 rounded-md px-3.5 text-sm font-semibold transition-colors disabled:opacity-40 sm:flex-none ${
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

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? 'border-amber-600 bg-amber-500' : 'border-stone-300 bg-stone-200 dark:border-stone-600 dark:bg-stone-800'
      }`}
    >
      <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

/** Labelled row with a control on the right */
export function SettingRow({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-stone-200 py-4 last:border-0 dark:border-stone-800">
      <div className="min-w-0 flex-1 basis-60">
        <p className="font-semibold">{title}</p>
        {description && <p className="text-sm text-stone-500 dark:text-stone-400">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export function Slider({ value, onChange, label, disabled }: { value: number; onChange: (v: number) => void; label: string; disabled?: boolean }) {
  return (
    <div className={`flex w-full items-center gap-3 sm:w-72 ${disabled ? 'opacity-40' : ''}`}>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2.5 flex-1 cursor-pointer appearance-none rounded-full accent-amber-500 disabled:cursor-not-allowed"
        style={{ background: `linear-gradient(90deg, #f59e0b ${value}%, #d6d3d1 ${value}%)` }}
      />
      <span className="w-12 text-right font-['IBM_Plex_Mono'] text-sm font-semibold">{value} %</span>
    </div>
  )
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const { label, hint, ...rest } = props
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <input
        {...rest}
        className="h-12 w-full rounded-lg border-2 border-stone-300 bg-white px-4 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-950"
      />
      {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
    </label>
  )
}
