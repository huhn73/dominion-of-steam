import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Swords, X } from 'lucide-react'
import type { MatchDraft, PartieSetupProps } from '../types'
import { AiPicker, FriendPicker } from './Pickers'
import { STEP, STEPS, aiFactions, randomSeed, stepBlocker } from './setup'
import { StepFaction } from './StepFaction'
import { StepMap } from './StepMap'
import { StepPlayers } from './StepPlayers'
import { StepRules } from './StepRules'
import { StepSummary } from './StepSummary'
import { Sheet } from './ui'
import { useT } from '../../../i18n'

export function PartieSetup({
  you,
  factions,
  aiPersonalities,
  friends,
  options,
  draft: initialDraft,
  inviteLink,
  onRandomizeSeed,
  onCopyInviteLink,
  onShareInviteLink,
  onCreateMatch,
  onCancel,
}: PartieSetupProps) {
  const t = useT()
  const [draft, setDraft] = useState<MatchDraft>(initialDraft)
  const [step, setStep] = useState(0)
  const [visited, setVisited] = useState(0)
  const [picker, setPicker] = useState<{ kind: 'ai' | 'friend'; seat: number } | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const update = (patch: Partial<MatchDraft>) => setDraft((d) => ({ ...d, ...patch }))
  const blocker = stepBlocker(step, draft, aiPersonalities)
  const isLast = step === STEPS.length - 1
  // the summary must not hide problems from earlier steps
  const finalBlocker = isLast ? STEPS.map((_, i) => stepBlocker(i, draft, aiPersonalities)).find(Boolean) ?? null : blocker
  const dirty = JSON.stringify(draft) !== JSON.stringify(initialDraft)

  const goTo = (s: number) => {
    setStep(s)
    setVisited((v) => Math.max(v, s))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancel = () => {
    if (dirty) setConfirmCancel(true)
    else onCancel?.()
  }

  const setSeat = (index: number, seat: MatchDraft['seats'][number]) =>
    update({ seats: draft.seats.map((s, i) => (i === index ? seat : s)) })

  // seats other than the one being edited
  const otherSeats = picker ? draft.seats.filter((_, i) => i !== picker.seat) : draft.seats
  const blockedFactions = new Set<string>(
    draft.allowDuplicateFactions
      ? []
      : [...aiFactions(otherSeats, aiPersonalities).keys(), ...(draft.factionId ? [draft.factionId] : [])],
  )

  return (
    <div className="font-['Barlow'] text-stone-900 dark:text-stone-100">
      <div className="mx-auto max-w-5xl px-4 pb-8 pt-8 sm:px-6 sm:pt-12">
        {/* Heading */}
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-3 font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.3em] text-teal-700 dark:text-teal-400">
              <span className="h-px w-8 bg-current" /> {t('partieSetup.kicker')}
            </p>
            <h1 className="font-['Big_Shoulders_Display'] text-5xl font-black uppercase leading-[0.9] tracking-wide sm:text-6xl">
              {t('partieSetup.title')}
            </h1>
          </div>
          <span className="rotate-[-4deg] rounded border-[3px] border-double border-amber-600 px-3 py-1 font-['Big_Shoulders_Display'] text-sm font-black uppercase tracking-[0.25em] text-amber-700 dark:border-amber-500 dark:text-amber-400">
            {draft.name || t('partieSetup.unnamed')}
          </span>
        </header>

        {/* Progress: full stepper on desktop, compact bar on phones */}
        <nav aria-label={t('partieSetup.progress')} className="mb-8">
          <ol className="hidden grid-cols-5 gap-2 md:grid">
            {STEPS.map((label, i) => {
              const done = i < step
              const current = i === step
              const reachable = i <= visited
              return (
                <li key={label}>
                  <button
                    type="button"
                    disabled={!reachable || i === step}
                    onClick={() => goTo(i)}
                    aria-current={current ? 'step' : undefined}
                    className={`group flex w-full flex-col items-start gap-2 border-t-4 pt-3 text-left transition-colors disabled:cursor-default ${
                      current ? 'border-amber-500' : done ? 'border-teal-600' : 'border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    <span
                      className={`flex size-8 items-center justify-center rounded-full font-['IBM_Plex_Mono'] text-sm font-semibold ${
                        current
                          ? 'bg-amber-500 text-stone-950'
                          : done
                            ? 'bg-teal-600 text-white'
                            : 'border-2 border-stone-300 text-stone-400 dark:border-stone-700'
                      }`}
                    >
                      {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                    </span>
                    <span
                      className={`font-['Big_Shoulders_Display'] text-sm font-bold uppercase tracking-widest ${
                        current ? '' : reachable ? 'text-stone-600 group-hover:text-teal-700 dark:text-stone-300' : 'text-stone-400'
                      }`}
                    >
                      {t(label)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          <div className="md:hidden">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="font-['Big_Shoulders_Display'] text-xl font-black uppercase tracking-wide">{t(STEPS[step]!)}</span>
              <span className="font-['IBM_Plex_Mono'] text-xs text-stone-500">
                {t('partieSetup.stepOf', { step: step + 1, total: STEPS.length })}
              </span>
            </div>
            <div className="flex gap-1">
              {STEPS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  aria-label={t('partieSetup.toStep', { step: i + 1, label: { key: label } })}
                  disabled={i > visited}
                  onClick={() => goTo(i)}
                  className={`h-2 flex-1 rounded-full ${i < step ? 'bg-teal-600' : i === step ? 'bg-amber-500' : 'bg-stone-200 dark:bg-stone-800'}`}
                />
              ))}
            </div>
          </div>
        </nav>

        {/* Step content */}
        <div key={step} className="animate-in fade-in slide-in-from-right-2 duration-300">
          {step === STEP.rules && <StepRules draft={draft} options={options} onChange={update} />}
          {step === STEP.faction && <StepFaction draft={draft} factions={factions} aiPersonalities={aiPersonalities} onChange={update} />}
          {step === STEP.players && (
            <StepPlayers
              draft={draft}
              you={you}
              factions={factions}
              friends={friends}
              aiPersonalities={aiPersonalities}
              inviteLink={inviteLink}
              onChange={update}
              onPickFriend={(seat) => setPicker({ kind: 'friend', seat })}
              onPickAi={(seat) => setPicker({ kind: 'ai', seat })}
              onCopyInviteLink={onCopyInviteLink}
              onShareInviteLink={onShareInviteLink}
            />
          )}
          {step === STEP.map && (
            <StepMap
              draft={draft}
              options={options}
              onChange={update}
              onRandomizeSeed={() => update({ map: { ...draft.map, seed: onRandomizeSeed?.() ?? randomSeed() } })}
            />
          )}
          {step === STEP.summary && (
            <StepSummary
              draft={draft}
              you={you}
              factions={factions}
              friends={friends}
              aiPersonalities={aiPersonalities}
              options={options}
              onEdit={goTo}
            />
          )}
        </div>
      </div>

      {/* Footer: stays above the shell's mobile tab bar */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 border-t-4 border-double border-stone-300 bg-stone-50/95 backdrop-blur md:bottom-0 dark:border-stone-700 dark:bg-stone-900/95">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={handleCancel}
            aria-label={t('partieSetup.cancel')}
            className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-stone-500 hover:bg-stone-200 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            <X className="size-4" /> <span className="hidden sm:inline">{t('partieSetup.cancel')}</span>
          </button>
          {finalBlocker && (
            <p role="status" className="order-last w-full text-sm text-amber-700 sm:order-none sm:w-auto sm:flex-1 sm:text-right dark:text-amber-400">
              {t(finalBlocker)}
            </p>
          )}
          <div className="ml-auto flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                className="flex min-h-12 items-center gap-1.5 rounded-lg border-2 border-stone-300 px-4 font-semibold hover:border-teal-500 dark:border-stone-700"
              >
                <ArrowLeft className="size-4" /> {t('partieSetup.back')}
              </button>
            )}
            <button
              type="button"
              disabled={!!finalBlocker}
              onClick={() => (isLast ? onCreateMatch?.(draft) : goTo(step + 1))}
              className="flex min-h-12 items-center gap-2 rounded-lg bg-gradient-to-b from-amber-400 to-amber-600 px-5 font-['Big_Shoulders_Display'] text-lg font-black uppercase tracking-[0.15em] text-stone-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition hover:from-amber-300 hover:to-amber-500 disabled:from-stone-300 disabled:to-stone-400 disabled:text-stone-600 dark:disabled:from-stone-700 dark:disabled:to-stone-800 dark:disabled:text-stone-500"
            >
              {isLast ? (
                <>
                  <Swords className="size-5" /> {t('partieSetup.create')}
                </>
              ) : (
                <>
                  {t('partieSetup.next')} <ArrowRight className="size-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {picker?.kind === 'ai' && (
        <AiPicker
          personalities={aiPersonalities}
          factions={factions}
          usedIds={new Set(otherSeats.flatMap((s) => (s.kind === 'ai' ? [s.personalityId] : [])))}
          blockedFactionIds={blockedFactions}
          onPick={(id) => {
            setSeat(picker.seat, { kind: 'ai', personalityId: id, difficulty: 'normal' })
            setPicker(null)
          }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker?.kind === 'friend' && (
        <FriendPicker
          friends={friends}
          usedIds={new Set(otherSeats.flatMap((s) => (s.kind === 'friend' ? [s.friendId] : [])))}
          onPick={(id) => {
            setSeat(picker.seat, { kind: 'friend', friendId: id })
            setPicker(null)
          }}
          onClose={() => setPicker(null)}
        />
      )}

      {confirmCancel && (
        <Sheet
          title={t('partieSetup.cancelTitle')}
          onClose={() => setConfirmCancel(false)}
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                className="min-h-11 rounded-lg border-2 border-stone-300 px-4 font-semibold dark:border-stone-700"
              >
                {t('partieSetup.keepEditing')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmCancel(false)
                  onCancel?.()
                }}
                className="min-h-11 rounded-lg bg-rose-600 px-4 font-semibold text-white hover:bg-rose-500"
              >
                {t('partieSetup.discard')}
              </button>
            </div>
          }
        >
          <p className="text-stone-600 dark:text-stone-300">{t('partieSetup.lost', { name: draft.name || t('partieSetup.title') })}</p>
        </Sheet>
      )}
    </div>
  )
}
