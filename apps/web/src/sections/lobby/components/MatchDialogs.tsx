import type { ReactNode } from 'react'
import { Flag } from 'lucide-react'
import type { Faction, Match } from '../types'
import { Rich, useT } from '../../../i18n'
import { FactionEmblem, Sheet } from './shared'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-stone-500 dark:text-stone-400">{label}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  )
}

export function MatchDetailsSheet({ match, factions, onClose }: { match: Match; factions: Faction[]; onClose: () => void }) {
  const t = useT()
  const { rules, map } = match
  return (
    <Sheet title={match.name} onClose={onClose}>
      <div className="grid gap-6 sm:grid-cols-2">
        <section>
          <h3 className="mb-1 font-['Big_Shoulders_Display'] text-lg font-bold uppercase tracking-widest">{t('lobby.details.rules')}</h3>
          <dl className="divide-y divide-stone-200 dark:divide-stone-800">
            <Row label={t('lobby.details.mode')}>{rules.mode === 'live' ? t('lobby.live') : t('lobby.async')}</Row>
            <Row label={rules.mode === 'live' ? t('lobby.details.timeLimit') : t('lobby.details.deadline')}>{t(rules.turnLimitLabel)}</Row>
            <Row label={t('lobby.details.victory')}>{t(rules.victoryCondition)}</Row>
            <Row label={t('lobby.details.duplicates')}>
              {rules.allowDuplicateFactions ? t('lobby.details.allowed') : t('lobby.details.notAllowed')}
            </Row>
          </dl>
        </section>
        <section>
          <h3 className="mb-1 font-['Big_Shoulders_Display'] text-lg font-bold uppercase tracking-widest">{t('lobby.details.map')}</h3>
          <dl className="divide-y divide-stone-200 dark:divide-stone-800">
            <Row label={t('lobby.details.size')}>
              {t(map.sizeLabel)} · {map.width}×{map.height}
            </Row>
            {map.worldShape && map.worldShape !== 'continent' && (
              <Row label={t('lobby.details.worldShape')}>
                {map.worldShape === 'islands' ? t('lobby.details.islands') : t('lobby.details.archipelago')}
              </Row>
            )}
            <Row label={t('lobby.details.landShare')}>{map.landShare} %</Row>
            <Row label={t('lobby.details.seed')}>
              <span className="font-['IBM_Plex_Mono'] tracking-widest">{map.seed}</span>
            </Row>
          </dl>
        </section>
      </div>
      <section className="mt-6">
        <h3 className="mb-2 font-['Big_Shoulders_Display'] text-lg font-bold uppercase tracking-widest">{t('lobby.details.players')}</h3>
        <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 dark:divide-stone-800 dark:border-stone-800">
          {match.participants.map((p) => {
            const f = factions.find((x) => x.id === p.factionId)
            return (
              <li key={p.id} className={`flex items-center gap-3 px-3 py-2.5 ${p.status !== 'active' ? 'opacity-50' : ''}`}>
                {f && <FactionEmblem faction={f} className="size-7" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {p.name}
                    {p.isYou && <span className="font-normal text-stone-500"> {t('lobby.details.you')}</span>}
                  </span>
                  <span className="block text-xs text-stone-500">
                    {f?.shortName}
                    {p.isAI &&
                      p.aiDifficulty &&
                      ` · ${t('lobby.details.ai', { difficulty: t(`common.difficulty.${p.aiDifficulty}`) })}`}{' '}
                    · {t(`lobby.status.${p.status}`)}
                  </span>
                </span>
                <span className="text-right font-['IBM_Plex_Mono'] text-sm">
                  {p.cityCount}
                  <span className="block text-[10px] uppercase text-stone-500">{t('lobby.details.cities')}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </Sheet>
  )
}

export function SurrenderSheet({ match, onConfirm, onClose }: { match: Match; onConfirm: () => void; onClose: () => void }) {
  const t = useT()
  return (
    <Sheet
      title={t('lobby.surrender.title')}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg border-2 border-stone-300 px-4 font-semibold dark:border-stone-700">
            {t('lobby.surrender.keepFighting')}
          </button>
          <button type="button" onClick={onConfirm} className="flex min-h-11 items-center gap-2 rounded-lg bg-rose-600 px-4 font-semibold text-white hover:bg-rose-500">
            <Flag className="size-4" /> {t('lobby.surrender.confirm')}
          </button>
        </div>
      }
    >
      <p className="text-stone-700 dark:text-stone-300">
        <Rich text={t('lobby.surrender.text', { round: match.round })} name={<strong>{match.name}</strong>} />
      </p>
    </Sheet>
  )
}
