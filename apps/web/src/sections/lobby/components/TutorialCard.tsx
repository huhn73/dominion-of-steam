import { CheckCircle2, GraduationCap, Play, RotateCcw } from 'lucide-react'
import type { LobbyTutorial } from '@dos/shared/lobby'
import { Sheet } from './shared'
import { useT } from '../../../i18n'

const primary =
  'flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 font-semibold text-stone-950 hover:bg-amber-400'
const secondary =
  'flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 font-semibold text-stone-600 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800'

/** Lobby card of the guided tutorial: start, continue or play again */
export function TutorialCard({
  tutorial,
  onStart,
}: {
  tutorial: LobbyTutorial
  onStart: (restart: boolean) => void
}) {
  const t = useT()
  const running = tutorial.status === 'running'
  return (
    <section
      aria-label={t('lobby.tutorial.region')}
      className="mb-10 flex flex-col gap-3 rounded-xl border border-teal-600/40 bg-teal-50 p-4 sm:flex-row sm:items-center dark:border-teal-700/60 dark:bg-teal-950/30"
    >
      {tutorial.completed ? (
        <CheckCircle2 className="size-7 shrink-0 text-teal-600 dark:text-teal-400" />
      ) : (
        <GraduationCap className="size-7 shrink-0 text-teal-600 dark:text-teal-400" />
      )}
      <div className="flex-1">
        <p className="font-['Big_Shoulders_Display'] text-xl font-black uppercase tracking-wide">
          {t('match.tutorialName')}
          {tutorial.completed && (
            <span className="ml-2 align-middle font-['Barlow'] text-sm font-semibold normal-case tracking-normal text-teal-700 dark:text-teal-300">
              {t('lobby.tutorial.completed')}
            </span>
          )}
        </p>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {running
            ? t('lobby.tutorial.continueAt', { step: Math.min(tutorial.step + 1, tutorial.total), total: tutorial.total })
            : t('lobby.tutorial.pitch')}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {running && (
          <button type="button" onClick={() => onStart(true)} className={secondary}>
            <RotateCcw className="size-4" /> {t('lobby.tutorial.restart')}
          </button>
        )}
        <button type="button" onClick={() => onStart(false)} className={primary}>
          <Play className="size-4" />
          {running ? t('lobby.tutorial.resume') : tutorial.completed ? t('lobby.tutorial.again') : t('lobby.tutorial.start')}
        </button>
      </div>
    </section>
  )
}

/** One-time offer for accounts without matches */
export function TutorialOffer({ onStart, onLater }: { onStart: () => void; onLater: () => void }) {
  const t = useT()
  return (
    <Sheet
      title={t('lobby.tutorial.offerTitle')}
      onClose={onLater}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onLater} className={secondary}>
            {t('lobby.tutorial.later')}
          </button>
          <button type="button" onClick={onStart} className={primary}>
            <Play className="size-4" /> {t('lobby.tutorial.start')}
          </button>
        </div>
      }
    >
      <p>
        {t('lobby.tutorial.offerText')}
      </p>
      <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
        {t('lobby.tutorial.offerHint')}
      </p>
    </Sheet>
  )
}
