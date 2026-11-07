import type { ReactNode } from 'react'
import { ADMIN_RANGES, type AdminRange, type AdminStats } from '@dos/shared/admin'
import { percent, Segmented } from '../../profil/components'
import { formatNumber } from '@dos/shared/i18n'
import { KontenListe, PartienListe } from './Listen'
import { VerlaufDiagramm } from './VerlaufDiagramm'
import { useLocale, useT } from '../../../i18n'

export interface NutzungsuebersichtProps {
  stats: AdminStats
  range: AdminRange
  onRangeChange: (range: AdminRange) => void
  /** A new range is loading (the previous numbers stay visible) */
  loading?: boolean
}

type Tile = { label: string; value: ReactNode; hint?: string }

const h2 =
  "mb-4 border-b-4 border-double border-stone-300 pb-2 font-['Big_Shoulders_Display'] text-3xl font-black uppercase tracking-wide dark:border-stone-700"

function Kacheln({ label, tiles }: { label: string; tiles: Tile[] }) {
  return (
    <dl aria-label={label} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
        >
          <dt className="text-[11px] font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
            {t.label}
          </dt>
          <dd>
            <span className="font-['IBM_Plex_Mono'] text-3xl font-semibold">{t.value}</span>
            {t.hint && (
              <span className="mt-1 block text-xs text-stone-500 dark:text-stone-400">
                {t.hint}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** Nutzungsübersicht für Admins: Kennzahlen, Verlauf und die letzten Konten und Partien */
export function Nutzungsuebersicht({
  stats,
  range,
  onRangeChange,
  loading,
}: NutzungsuebersichtProps) {
  const t = useT()
  const { locale } = useLocale()
  const { accounts: a, matches: m } = stats
  const last = t('admin.lastDays', { count: range })

  const kontoTiles: Tile[] = [
    { label: t('admin.tile.accounts'), value: a.total },
    { label: t('admin.tile.verified'), value: a.verified, hint: `${percent(a.verified, a.total)} %` },
    { label: t('admin.tile.new'), value: a.new, hint: last },
    { label: t('admin.tile.active24'), value: a.active24h },
    { label: t('admin.tile.active'), value: a.activeRange, hint: last },
  ]
  const partieTiles: Tile[] = [
    { label: t('admin.tile.running'), value: m.running, hint: t('admin.tile.waiting', { count: m.waiting }) },
    {
      label: t('admin.tile.finished'),
      value: m.finished,
      hint:
        m.avgRoundsFinished == null
          ? undefined
          : t('admin.tile.avgRounds', { rounds: formatNumber(locale, m.avgRoundsFinished) }),
    },
    { label: t('admin.tile.new'), value: m.newInRange, hint: last },
    { label: t('admin.tile.liveAsync'), value: `${m.live} / ${m.async}` },
    { label: t('admin.tile.soloMulti'), value: `${m.solo} / ${m.multiplayer}` },
  ]

  return (
    <div className="font-['Barlow'] text-stone-900 dark:text-stone-100">
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.3em] text-stone-500 dark:text-stone-400">
              {t('admin.kicker')}
            </p>
            <h1 className="font-['Big_Shoulders_Display'] text-5xl font-black uppercase leading-none tracking-wide">
              {t('admin.title')}
            </h1>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
              {t('admin.excluded')}
            </p>
          </div>
          <div aria-busy={loading} className={loading ? 'opacity-60' : undefined}>
            <Segmented
              label={t('admin.range')}
              value={range}
              options={ADMIN_RANGES.map((r) => ({ value: r, label: t('admin.days', { count: r }) }))}
              onChange={onRangeChange}
            />
          </div>
        </header>

        <section aria-labelledby="admin-konten">
          <h2 id="admin-konten" className={h2}>
            {t('admin.accounts')}
          </h2>
          <Kacheln label={t('admin.accounts')} tiles={kontoTiles} />
        </section>

        <section aria-labelledby="admin-partien">
          <h2 id="admin-partien" className={h2}>
            {t('admin.matches')}
          </h2>
          <Kacheln label={t('admin.matches')} tiles={partieTiles} />
        </section>

        <section aria-labelledby="admin-verlauf">
          <h2 id="admin-verlauf" className={h2}>
            {t('admin.history')}
          </h2>
          <VerlaufDiagramm days={stats.daily} />
        </section>

        <section aria-labelledby="admin-letzte-konten">
          <h2 id="admin-letzte-konten" className={h2}>
            {t('admin.recentPlayers')}
          </h2>
          <KontenListe players={stats.recentPlayers} />
        </section>

        <section aria-labelledby="admin-letzte-partien">
          <h2 id="admin-letzte-partien" className={h2}>
            {t('admin.recentMatches')}
          </h2>
          <PartienListe matches={stats.recentMatches} />
        </section>
      </div>
    </div>
  )
}
