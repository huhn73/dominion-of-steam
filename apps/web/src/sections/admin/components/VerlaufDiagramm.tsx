import type { AdminDay } from '@dos/shared/admin'
import { formatDate } from '../../profil/components'

type Series = { key: 'registrations' | 'matchesStarted' | 'turns'; label: string; fill: string }

const SERIES: Series[] = [
  { key: 'registrations', label: 'Anmeldungen', fill: 'fill-teal-600 dark:fill-teal-400' },
  { key: 'matchesStarted', label: 'Neue Partien', fill: 'fill-amber-600 dark:fill-amber-400' },
  { key: 'turns', label: 'Züge (Menschen)', fill: 'fill-stone-600 dark:fill-stone-300' },
]

const HEIGHT = 80
const day = (date: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  formatDate(`${date}T12:00:00Z`, opts)

/** One small bar chart per series; one bar per day, the tooltip shows date and value */
function Balken({ days, series }: { days: AdminDay[]; series: Series }) {
  const values = days.map((d) => d[series.key])
  const total = values.reduce((a, b) => a + b, 0)
  const max = Math.max(1, ...values)
  const gap = days.length > 40 ? 0.15 : 0.25

  return (
    <figure className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <figcaption className="mb-3 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
          {series.label}
        </span>
        <span className="font-['IBM_Plex_Mono'] text-sm text-stone-600 dark:text-stone-300">
          Σ {total} · max {Math.max(...values, 0)}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${days.length} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="block h-24 w-full"
        role="img"
        aria-label={`${series.label} pro Tag, insgesamt ${total}`}
      >
        <line
          x1="0"
          x2={days.length}
          y1={HEIGHT}
          y2={HEIGHT}
          className="stroke-stone-300 dark:stroke-stone-700"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
        {days.map((d, i) => {
          const v = d[series.key]
          const h = v === 0 ? 0 : Math.max(2, (v / max) * HEIGHT)
          return (
            <rect
              key={d.date}
              x={i + gap / 2}
              y={HEIGHT - h}
              width={1 - gap}
              height={h}
              className={series.fill}
            >
              <title>{`${day(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}: ${v}`}</title>
            </rect>
          )
        })}
      </svg>
      <div className="mt-1 flex justify-between font-['IBM_Plex_Mono'] text-[11px] text-stone-500 dark:text-stone-400">
        <span>{day(days[0]!.date)}</span>
        <span>{day(days[Math.floor(days.length / 2)]!.date)}</span>
        <span>heute</span>
      </div>
    </figure>
  )
}

export function VerlaufDiagramm({ days }: { days: AdminDay[] }) {
  if (days.length === 0) return null
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {SERIES.map((s) => (
        <Balken key={s.key} days={days} series={s} />
      ))}
    </div>
  )
}
