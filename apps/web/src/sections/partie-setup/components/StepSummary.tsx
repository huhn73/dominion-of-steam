import { formatNumber } from '@dos/shared/i18n'
import type { ReactNode } from 'react'
import { AlertTriangle, Pencil } from 'lucide-react'
import type {
  AiPersonality,
  Faction,
  Friend,
  MatchDraft,
  Player,
  SetupOptions,
} from '../types'
import { DIFFICULTY_LABEL, STEP, summaryWarnings } from './setup'
import { FactionEmblem } from './ui'
import { useLocale, useT } from '../../../i18n'

interface StepSummaryProps {
  draft: MatchDraft
  you: Player
  factions: Faction[]
  friends: Friend[]
  aiPersonalities: AiPersonality[]
  options: SetupOptions
  onEdit: (step: number) => void
}

function Block({ title, step, onEdit, children }: { title: string; step: number; onEdit: (s: number) => void; children: ReactNode }) {
  const t = useT()
  return (
    <section className="rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <header className="flex items-center justify-between border-b-4 border-double border-stone-200 px-5 py-2.5 dark:border-stone-800">
        <h3 className="font-['Big_Shoulders_Display'] text-lg font-bold uppercase tracking-widest">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="flex min-h-10 items-center gap-1 text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400"
        >
          <Pencil className="size-3.5" /> {t('partieSetup.change')}
        </button>
      </header>
      <dl className="divide-y divide-stone-100 px-5 dark:divide-stone-800">{children}</dl>
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 py-2.5">
      <dt className="text-sm text-stone-500 dark:text-stone-400">{label}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  )
}

export function StepSummary({ draft, you, factions, friends, aiPersonalities, options, onEdit }: StepSummaryProps) {
  const t = useT()
  const { locale } = useLocale()
  const size = options.mapSizes.find((s) => s.id === draft.map.size)
  const warnings = summaryWarnings(draft, size)
  const victory = options.victoryConditions.find((v) => v.id === draft.victoryCondition)
  const level = (id: string) => options.levels.find((l) => l.id === id)?.label
  const ownFaction = factions.find((f) => f.id === draft.factionId)
  const turnLimit =
    draft.mode === 'async'
      ? options.asyncTurnLimits.find((l) => l.hours === draft.asyncTurnLimitHours)?.label
      : options.liveTurnLimits.find((l) => l.minutes === draft.liveTurnLimitMinutes)?.label

  return (
    <div className="space-y-5">
      {warnings.length > 0 && (
        <ul className="space-y-2" aria-label={t('partieSetup.hints')}>
          {warnings.map((w) => (
            <li key={w.key} className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {t(w)}
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Block title={t('setup.step.rules')} step={STEP.rules} onEdit={onEdit}>
          <Row label={t('partieSetup.nameShort')}>{draft.name}</Row>
          <Row label={t('partieSetup.mode')}>{draft.mode === 'async' ? t('partieSetup.async') : t('partieSetup.live')}</Row>
          <Row label={draft.mode === 'async' ? t('partieSetup.asyncLimit') : t('partieSetup.liveLimit')}>{turnLimit && t(turnLimit)}</Row>
          <Row label={t('partieSetup.victory')}>
            {victory && t(victory.label)}
            {draft.victoryCondition === 'roundLimit' &&
              ` · ${draft.roundLimit === null ? t('partieSetup.withoutRoundLimit') : t('setup.rounds', { count: draft.roundLimit })}`}
          </Row>
          <Row label={t('lobby.details.duplicates')}>
            {draft.allowDuplicateFactions ? t('lobby.details.allowed') : t('lobby.details.notAllowed')}
          </Row>
        </Block>

        <Block title={t('setup.step.faction')} step={STEP.faction} onEdit={onEdit}>
          {ownFaction ? (
            <div className="flex items-center gap-3 py-3">
              <FactionEmblem faction={ownFaction} className="size-12" />
              <div>
                <p className="font-['Big_Shoulders_Display'] text-xl font-black uppercase tracking-wide">{ownFaction.name}</p>
                <p className="text-sm text-stone-500 dark:text-stone-400">{ownFaction.trait}</p>
              </div>
            </div>
          ) : (
            <Row label={t('partieSetup.faction')}>{t('partieSetup.notChosen')}</Row>
          )}
        </Block>

        <Block title={t('partieSetup.playersTitle', { count: draft.seats.length })} step={STEP.players} onEdit={onEdit}>
          {draft.seats.map((s, i) => {
            let label: ReactNode = t('partieSetup.seat.empty')
            if (s.kind === 'you') label = t('partieSetup.youName', { name: you.name })
            if (s.kind === 'friend') label = friends.find((f) => f.id === s.friendId)?.name
            if (s.kind === 'invite') label = t('partieSetup.seat.invite')
            if (s.kind === 'open') label = t('partieSetup.seat.open')
            if (s.kind === 'ai') {
              const p = aiPersonalities.find((x) => x.id === s.personalityId)
              label = t('partieSetup.aiSeat', { name: p?.name ?? '', difficulty: { key: DIFFICULTY_LABEL[s.difficulty] } })
            }
            if (s.kind === 'empty' && draft.fillEmptyWithAI) label = t('partieSetup.aiAtStart')
            return (
              <Row key={i} label={t('partieSetup.seatN', { n: i + 1 })}>
                {label}
              </Row>
            )
          })}
        </Block>

        <Block title={t('setup.step.map')} step={STEP.map} onEdit={onEdit}>
          <Row label={t('partieSetup.size')}>
            {size &&
              t('partieSetup.sizeLine', {
                size: { key: size.label },
                width: size.width,
                height: size.height,
                tiles: formatNumber(locale, size.width * size.height),
              })}
          </Row>
          <Row label={t('partieSetup.worldShape')}>
            {t(options.worldShapes.find((w) => w.id === (draft.map.worldShape ?? 'continent'))?.label ?? 'setup.shape.continent.label')}
          </Row>
          <Row label={t('partieSetup.landShare')}>{draft.map.landShare} %</Row>
          <Row label={t('partieSetup.neutralCities')}>
            {draft.map.neutralCities === 'low'
              ? t('partieSetup.few')
              : draft.map.neutralCities === 'high'
                ? t('partieSetup.many')
                : t('partieSetup.normal')}
          </Row>
          <Row label={t('partieSetup.terrain')}>{level(draft.map.terrain) && t(level(draft.map.terrain)!)}</Row>
          <Row label={t('partieSetup.seed')}>
            <span className="font-['IBM_Plex_Mono'] tracking-widest">{draft.map.seed}</span>
          </Row>
        </Block>

      </div>
    </div>
  )
}
