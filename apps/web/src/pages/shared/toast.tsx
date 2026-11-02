import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Check, X } from 'lucide-react'
import { ApiRequestError } from '../../data/api'
import { useAudio } from '../../audio/AudioProvider'

const INFO_TOAST_MS = 2500

export type ToastMessage = { kind: 'info' | 'error'; text: string }

/** Short confirmation (disappears by itself) or error message (stays until closed) */
export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const { sfx } = useAudio()
  useEffect(() => {
    if (toast?.kind !== 'info') return
    const timer = setTimeout(() => setToast(null), INFO_TOAST_MS)
    return () => clearTimeout(timer)
  }, [toast])
  const info = useCallback((text: string) => setToast({ kind: 'info', text }), [])
  /** Server message of an API error, otherwise `fallback` */
  const error = useCallback(
    (e: unknown, fallback = 'Das hat nicht geklappt. Versuche es noch einmal.') => {
      sfx('ui-error')
      setToast({ kind: 'error', text: e instanceof ApiRequestError ? e.message : fallback })
    },
    [sfx],
  )
  return { toast, setToast, info, error, close: () => setToast(null) }
}

/**
 * Share a link with the device's share menu; without the Web Share API it is copied instead.
 * Cancelling the share menu is not an error.
 */
export async function shareLink(
  link: string,
  { onCopied, onError }: { onCopied: () => void; onError: (text: string) => void },
) {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'Einladung zu Dominion of Steam', url: link })
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      onError('Teilen ist fehlgeschlagen. Kopiere den Link stattdessen.')
    }
    return
  }
  try {
    await navigator.clipboard.writeText(link)
    onCopied()
  } catch {
    onError('Der Link konnte nicht kopiert werden.')
  }
}

export function Toast({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  const error = toast.kind === 'error'
  return (
    <div
      role={error ? 'alert' : 'status'}
      className={`fixed left-1/2 top-20 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-lg border-2 px-4 py-3 font-['Barlow'] text-sm shadow-lg sm:top-24 ${
        error
          ? 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100'
          : 'border-teal-500 bg-stone-50 text-stone-900 dark:bg-stone-900 dark:text-stone-100'
      }`}
    >
      {error ? (
        <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-red-600" />
      ) : (
        <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-teal-600" />
      )}
      <p className="flex-1">{toast.text}</p>
      {error && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Meldung schließen"
          className="-m-1 rounded p-1 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-teal-500 dark:hover:bg-red-900"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  )
}
