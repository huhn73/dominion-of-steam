import { ApiRequestError } from '../../data/api'
import { PlaceholderPage } from '../PlaceholderPage'
import { useT } from '../../i18n'

/** Loading and error state of the profile and settings pages */
export function PageState({
  title,
  loadingText,
  error,
  fallback,
  onRetry,
}: {
  title: string
  loadingText: string
  error?: unknown
  fallback: string
  onRetry: () => void
}) {
  const t = useT()
  if (!error)
    return (
      <PlaceholderPage title={title}>
        <p className="animate-pulse">{loadingText}</p>
      </PlaceholderPage>
    )
  return (
    <PlaceholderPage title={title}>
      <p role="alert">{error instanceof ApiRequestError ? error.message : fallback}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 min-h-11 rounded-md bg-gradient-to-b from-amber-400 to-amber-600 px-4 font-['Big_Shoulders_Display'] font-bold uppercase tracking-widest text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
      >
        {t('common.retry')}
      </button>
    </PlaceholderPage>
  )
}
