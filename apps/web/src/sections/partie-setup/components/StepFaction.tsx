import { Bot, Check } from 'lucide-react'
import type { AiPersonality, Faction, MatchDraft } from '../types'
import { FACTION_HEX, aiFactions } from './setup'
import { FactionEmblem } from './ui'
import { useT } from '../../../i18n'

interface StepFactionProps {
  draft: MatchDraft
  factions: Faction[]
  aiPersonalities: AiPersonality[]
  onChange: (patch: Partial<MatchDraft>) => void
}

export function StepFaction({ draft, factions, aiPersonalities, onChange }: StepFactionProps) {
  const t = useT()
  const taken = aiFactions(draft.seats, aiPersonalities)

  return (
    <div role="radiogroup" aria-label={t('partieSetup.yourFaction')} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {factions.map((f) => {
        const c = FACTION_HEX[f.color]
        const ai = taken.get(f.id)
        const locked = !!ai && !draft.allowDuplicateFactions
        const selected = draft.factionId === f.id
        return (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={locked}
            onClick={() => onChange({ factionId: f.id })}
            className={`group relative flex flex-col overflow-hidden rounded-xl border-2 bg-white text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed dark:bg-stone-900 ${
              selected ? 'shadow-xl' : 'border-stone-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-stone-800'
            } ${locked ? 'opacity-50 grayscale' : ''}`}
            style={selected ? { borderColor: c.base } : undefined}
          >
            <span className="relative flex h-24 items-end px-4" style={{ background: `linear-gradient(135deg, ${c.base}, ${c.deep})` }}>
              <span className="mb-[-1.5rem] drop-shadow-lg">
                <FactionEmblem faction={f} className="size-16" />
              </span>
              {selected && (
                <span className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white text-stone-900 shadow">
                  <Check className="size-5" strokeWidth={3} />
                </span>
              )}
            </span>
            <span className="flex flex-1 flex-col px-4 pb-4 pt-8">
              <span className="font-['Big_Shoulders_Display'] text-2xl font-black uppercase leading-none tracking-wide">{f.name}</span>
              <span className="mt-1 text-sm italic text-stone-500 dark:text-stone-400">„{f.motto}“</span>
              <span className="mt-3 border-t border-dashed border-stone-200 pt-3 text-sm dark:border-stone-700">{f.trait}</span>
              {ai && (
                <span className="mt-3 flex items-center gap-1.5 rounded-md bg-stone-100 px-2 py-1.5 text-xs font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                  <Bot className="size-3.5" />
                  {locked ? t('partieSetup.aiLocked', { name: ai.name }) : t('partieSetup.aiAlso', { name: ai.name })}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
