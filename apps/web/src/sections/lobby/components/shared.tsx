import { useEffect, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import type { Faction, Participant } from '../types'
import { FACTION_HEX } from './format'
import { useT } from '../../../i18n'

// Typography: Big Shoulders Display (headings), Barlow (body), IBM Plex Mono (numbers, codes)
// Emblem, avatar and sheet mirror the ones in the other sections so each section stays exportable on its own.

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
  const t = useT()
  const hasImage = useImageLoaded(faction.emblemUrl)
  if (hasImage && faction.emblemUrl) {
    return <img src={faction.emblemUrl} alt={t('lobby.emblem', { name: faction.name })} className={`${className} object-contain`} />
  }
  const c = FACTION_HEX[faction.color]
  return (
    <svg viewBox="0 0 64 72" className={className} role="img" aria-label={t('lobby.emblem', { name: faction.name })}>
      <path d="M32 2 L60 10 V34 C60 52 47 64 32 70 C17 64 4 52 4 34 V10 Z" fill="#b45309" />
      <path d="M32 6 L56 13 V34 C56 49 45 59 32 65 C19 59 8 49 8 34 V13 Z" fill={c.base} />
      <path d="M8 40 L32 26 L56 40 V46 L32 32 L8 46 Z" fill="#1c1917" opacity="0.28" />
      <text x="32" y="53" textAnchor="middle" fill="#fffbeb" style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 900, fontSize: 18 }}>
        {faction.shortName[0]}
      </text>
    </svg>
  )
}

export function Avatar({ name, url, color, className = 'size-10' }: { name: string; url: string | null; color?: string; className?: string }) {
  const hasImage = useImageLoaded(url)
  const initials = name
    .split(/[\s-]+/)
    .filter((p) => p.length > 0 && p !== 'für')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  if (hasImage && url) return <img src={url} alt="" className={`${className} shrink-0 rounded-full object-cover`} />
  return (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-full border-2 bg-stone-900 font-['Big_Shoulders_Display'] text-sm font-black text-stone-100`}
      style={{ borderColor: color ?? '#78716c' }}
    >
      {initials}
    </span>
  )
}

/** Avatar ring in faction color with AI badge and "your turn" marker */
export function ParticipantChip({
  participant,
  faction,
  isCurrent,
  size = 'size-9',
}: {
  participant: Participant
  faction?: Faction
  isCurrent?: boolean
  size?: string
}) {
  const t = useT()
  const color = faction ? FACTION_HEX[faction.color].base : undefined
  const out = participant.status !== 'active'
  return (
    <span className={`relative inline-flex ${out ? 'opacity-40 grayscale' : ''}`} title={`${participant.name}${faction ? ` · ${faction.shortName}` : ''}${out ? ` · ${t('lobby.eliminated')}` : ''}`}>
      <Avatar name={participant.name} url={participant.avatarUrl} color={color} className={size} />
      {participant.isAI && (
        <span className="absolute -bottom-1 -right-1 rounded-sm bg-stone-700 px-1 font-['IBM_Plex_Mono'] text-[8px] font-bold leading-tight text-stone-100 ring-2 ring-white dark:ring-stone-900">
          {t('lobby.aiBadge')}
        </span>
      )}
      {isCurrent && <span className="absolute -inset-1 animate-pulse rounded-full border-2 border-amber-400" />}
    </span>
  )
}

/** Coarse territory map: water, neutral land and participant territories */
export function MiniMap({
  rows,
  participants,
  factions,
  className = '',
}: {
  rows: string[]
  participants: Participant[]
  factions: Faction[]
  className?: string
}) {
  if (rows.length === 0) return null
  const w = rows[0].length
  const h = rows.length
  const colorOf = (i: number) => {
    const f = factions.find((x) => x.id === participants[i]?.factionId)
    return f ? FACTION_HEX[f.color].base : '#a8a29e'
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <rect width={w} height={h} fill="#164e4a" />
      {rows.flatMap((row, y) =>
        [...row].map((ch, x) => {
          if (ch === '~') return (x + y) % 5 === 0 ? <rect key={`${x}-${y}`} x={x + 0.3} y={y + 0.45} width={0.4} height={0.1} fill="#5eead4" opacity={0.25} /> : null
          const fill = ch === '.' ? '#d6c49a' : colorOf(Number(ch))
          return <rect key={`${x}-${y}`} x={x + 0.04} y={y + 0.04} width={0.92} height={0.92} rx={0.15} fill={fill} />
        }),
      )}
    </svg>
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
  const t = useT()
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
        className="flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-2xl bg-stone-50 text-stone-900 shadow-2xl animate-in slide-in-from-bottom-6 sm:max-w-2xl sm:rounded-2xl dark:bg-stone-900 dark:text-stone-100"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-stone-300 sm:hidden dark:bg-stone-600" />
        <header className="flex items-center justify-between gap-4 border-b-4 border-double border-stone-200 px-5 py-3 dark:border-stone-700">
          <h2 className="truncate font-['Big_Shoulders_Display'] text-2xl font-black uppercase tracking-wide">{title}</h2>
          <button type="button" onClick={onClose} aria-label={t('lobby.close')} className="flex size-11 shrink-0 items-center justify-center rounded-md text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800">
            <X className="size-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <footer className="border-t border-stone-200 px-5 py-3 dark:border-stone-700">{footer}</footer>}
      </div>
    </div>
  )
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
      {children}
    </span>
  )
}

export function SectionHeading({ title, count, children }: { title: string; count?: number; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b-4 border-double border-stone-300 pb-2 dark:border-stone-700">
      <h2 className="flex items-baseline gap-3 font-['Big_Shoulders_Display'] text-3xl font-black uppercase tracking-wide">
        {title}
        {count != null && <span className="font-['IBM_Plex_Mono'] text-base font-semibold text-stone-400">{count}</span>}
      </h2>
      {children}
    </div>
  )
}
