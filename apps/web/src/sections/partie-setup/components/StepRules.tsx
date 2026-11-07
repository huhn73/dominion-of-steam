import { roundLimitForSize } from './setup'
import { Clock, Radio } from 'lucide-react'
import type { MatchDraft, SetupOptions } from '../types'
import { Field, OptionCard, Segmented, Toggle } from './ui'
import { useT } from '../../../i18n'

interface StepRulesProps {
  draft: MatchDraft
  options: SetupOptions
  onChange: (patch: Partial<MatchDraft>) => void
}

export function StepRules({ draft, options, onChange }: StepRulesProps) {
  const t = useT()
  return (
    <div className="space-y-6">
      <Field label={t('partieSetup.name')}>
        <input
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={t('partieSetup.namePlaceholder')}
          maxLength={40}
          className="h-12 w-full max-w-md rounded-lg border-2 border-stone-300 bg-white px-4 text-lg font-semibold placeholder:font-normal placeholder:text-stone-400 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900"
        />
      </Field>

      <Field label={t('partieSetup.mode')}>
        <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
          <OptionCard
            selected={draft.mode === 'async'}
            onSelect={() => onChange({ mode: 'async' })}
            title={t('partieSetup.async')}
            description={t('partieSetup.asyncHint')}
            aside={<Clock className="size-6 shrink-0 text-teal-600" />}
          />
          <OptionCard
            selected={draft.mode === 'live'}
            onSelect={() => onChange({ mode: 'live' })}
            title={t('partieSetup.live')}
            description={t('partieSetup.liveHint')}
            aside={<Radio className="size-6 shrink-0 text-teal-600" />}
          />
        </div>
        <div className="mt-4">
          {draft.mode === 'async' ? (
            <>
              <p className="mb-2 text-sm font-semibold text-stone-600 dark:text-stone-300">{t('partieSetup.asyncLimit')}</p>
              <Segmented
                label={t('partieSetup.asyncLimit')}
                value={draft.asyncTurnLimitHours}
                options={options.asyncTurnLimits.map((l) => ({ value: l.hours, label: t(l.label) }))}
                onChange={(v) => onChange({ asyncTurnLimitHours: v })}
              />
            </>
          ) : (
            <>
              <p className="mb-2 text-sm font-semibold text-stone-600 dark:text-stone-300">{t('partieSetup.liveLimit')}</p>
              <Segmented
                label={t('partieSetup.liveLimit')}
                value={draft.liveTurnLimitMinutes}
                options={options.liveTurnLimits.map((l) => ({ value: l.minutes, label: t(l.label) }))}
                onChange={(v) => onChange({ liveTurnLimitMinutes: v })}
              />
            </>
          )}
        </div>
      </Field>

      <Field label={t('partieSetup.victory')}>
        <div role="radiogroup" className="grid gap-3 lg:grid-cols-3">
          {options.victoryConditions.map((v) => (
            <OptionCard
              key={v.id}
              selected={draft.victoryCondition === v.id}
              onSelect={() => onChange({ victoryCondition: v.id })}
              title={t(v.label)}
              description={t(v.description)}
            />
          ))}
        </div>
        {draft.victoryCondition === 'roundLimit' && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-stone-600 dark:text-stone-300">{t('partieSetup.rounds')}</p>
            <Segmented
              label={t('partieSetup.rounds')}
              value={draft.roundLimit}
              options={options.roundLimits
                .filter((r) => r !== null)
                .map((r) => ({ value: r, label: `${r}` }))}
              onChange={(v) => onChange({ roundLimit: v })}
            />
            <p className="mt-2 text-xs text-stone-500">
              {t('partieSetup.recommended', {
                size: { key: options.mapSizes.find((s) => s.id === draft.map.size)?.label ?? 'setup.size.medium' },
                rounds: roundLimitForSize(options, draft.map.size) ?? '',
              })}
            </p>
          </div>
        )}
      </Field>

      <Field label={t('partieSetup.factions')}>
        <Toggle
          checked={draft.allowDuplicateFactions}
          onChange={(v) => onChange({ allowDuplicateFactions: v })}
          label={t('partieSetup.duplicates')}
          description={t('partieSetup.duplicatesHint')}
        />
      </Field>
    </div>
  )
}
