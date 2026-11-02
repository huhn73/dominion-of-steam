import { Clock, Radio } from 'lucide-react'
import type { MatchDraft, SetupOptions } from '../types'
import { Field, OptionCard, Segmented, Toggle } from './ui'

interface StepRulesProps {
  draft: MatchDraft
  options: SetupOptions
  onChange: (patch: Partial<MatchDraft>) => void
}

export function StepRules({ draft, options, onChange }: StepRulesProps) {
  return (
    <div className="space-y-6">
      <Field label="Name der Partie">
        <input
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="z. B. Die Kohleinseln"
          maxLength={40}
          className="h-12 w-full max-w-md rounded-lg border-2 border-stone-300 bg-white px-4 text-lg font-semibold placeholder:font-normal placeholder:text-stone-400 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900"
        />
      </Field>

      <Field label="Modus">
        <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
          <OptionCard
            selected={draft.mode === 'async'}
            onSelect={() => onChange({ mode: 'async' })}
            title="Asynchron"
            description="Jeder zieht, wann er Zeit hat. Du wirst benachrichtigt, wenn du am Zug bist."
            aside={<Clock className="size-6 shrink-0 text-teal-600" />}
          />
          <OptionCard
            selected={draft.mode === 'live'}
            onSelect={() => onChange({ mode: 'live' })}
            title="Live"
            description="Alle sind gleichzeitig online und ziehen nacheinander."
            aside={<Radio className="size-6 shrink-0 text-teal-600" />}
          />
        </div>
        <div className="mt-4">
          {draft.mode === 'async' ? (
            <>
              <p className="mb-2 text-sm font-semibold text-stone-600 dark:text-stone-300">Frist pro Zug</p>
              <Segmented
                label="Frist pro Zug"
                value={draft.asyncTurnLimitHours}
                options={options.asyncTurnLimits.map((t) => ({ value: t.hours, label: t.label }))}
                onChange={(v) => onChange({ asyncTurnLimitHours: v })}
              />
            </>
          ) : (
            <>
              <p className="mb-2 text-sm font-semibold text-stone-600 dark:text-stone-300">Zeitlimit pro Zug</p>
              <Segmented
                label="Zeitlimit pro Zug"
                value={draft.liveTurnLimitMinutes}
                options={options.liveTurnLimits.map((t) => ({ value: t.minutes, label: t.label }))}
                onChange={(v) => onChange({ liveTurnLimitMinutes: v })}
              />
            </>
          )}
        </div>
      </Field>

      <Field label="Siegbedingung">
        <div role="radiogroup" className="grid gap-3 lg:grid-cols-3">
          {options.victoryConditions.map((v) => (
            <OptionCard
              key={v.id}
              selected={draft.victoryCondition === v.id}
              onSelect={() => onChange({ victoryCondition: v.id })}
              title={v.label}
              description={v.description}
            />
          ))}
        </div>
        {draft.victoryCondition === 'roundLimit' && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-stone-600 dark:text-stone-300">Anzahl Runden</p>
            <Segmented
              label="Anzahl Runden"
              value={draft.roundLimit}
              options={options.roundLimits.map((r) => ({ value: r, label: `${r}` }))}
              onChange={(v) => onChange({ roundLimit: v })}
            />
          </div>
        )}
      </Field>

      <Field label="Fraktionen">
        <Toggle
          checked={draft.allowDuplicateFactions}
          onChange={(v) => onChange({ allowDuplicateFactions: v })}
          label="Doppelte Fraktionen erlauben"
          description="Mehrere Spieler oder KI-Gegner dürfen dieselbe Fraktion führen."
        />
      </Field>
    </div>
  )
}
