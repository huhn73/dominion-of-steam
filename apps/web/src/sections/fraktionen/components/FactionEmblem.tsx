import type { Faction } from '../types'
import { FACTION_HEX } from './theme'
import { useImageLoaded } from './useImageLoaded'

interface FactionEmblemProps {
  faction: Pick<Faction, 'id' | 'name' | 'color' | 'emblemUrl'>
  className?: string
}

/** Heraldic shield placeholder in the faction color, or the real emblem if one exists */
export function FactionEmblem({ faction, className = 'size-16' }: FactionEmblemProps) {
  const hasImage = useImageLoaded(faction.emblemUrl)
  if (hasImage && faction.emblemUrl) {
    return <img src={faction.emblemUrl} alt={`Wappen ${faction.name}`} className={`${className} object-contain`} />
  }
  const c = FACTION_HEX[faction.color]
  const initial = faction.name
    .split(/\s+/)
    .find((w) => w.length > 3)?.[0]
    ?.toUpperCase()
  const gradId = `emblem-${faction.id}`

  return (
    <svg viewBox="0 0 64 72" className={className} role="img" aria-label={`Wappen ${faction.name}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c.base} />
          <stop offset="1" stopColor={c.deep} />
        </linearGradient>
      </defs>
      {/* brass rim */}
      <path d="M32 2 L60 10 V34 C60 52 47 64 32 70 C17 64 4 52 4 34 V10 Z" fill="#b45309" />
      <path d="M32 6 L56 13 V34 C56 49 45 59 32 65 C19 59 8 49 8 34 V13 Z" fill={`url(#${gradId})`} />
      {/* chevron and rivets */}
      <path d="M8 40 L32 26 L56 40 V46 L32 32 L8 46 Z" fill="#1c1917" opacity="0.28" />
      {[14, 32, 50].map((x) => (
        <circle key={x} cx={x} cy={14} r="1.6" fill="#fde68a" opacity="0.8" />
      ))}
      {/* cog ring */}
      <circle cx="32" cy="48" r="8.5" fill="none" stroke="#fef3c7" strokeWidth="2.5" strokeDasharray="3 2.2" opacity="0.85" />
      <text
        x="32"
        y="53"
        textAnchor="middle"
        fill="#fffbeb"
        style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 900, fontSize: 14 }}
      >
        {initial}
      </text>
    </svg>
  )
}
