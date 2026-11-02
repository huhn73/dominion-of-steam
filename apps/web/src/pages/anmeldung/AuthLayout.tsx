import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Cog, Eye, EyeOff } from 'lucide-react'
import { LegalLinks, type LegalPageId } from '../rechtliches/LegalLinks'

/**
 * Full-page frame of the login, register and legal pages: wordmark, a riveted brass card and
 * the legal links underneath. `width` widens the card for text pages.
 */
export function AuthLayout({
  title,
  children,
  footer,
  width = 'md',
  legalPage,
}: {
  title: string
  children: ReactNode
  footer?: ReactNode
  width?: 'md' | '2xl'
  /** The legal page being shown: its own link is rendered as plain text */
  legalPage?: LegalPageId
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-stone-100 px-4 py-10 font-['Barlow'] text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      {/* Hintergrund: warmes Messinglicht und feine Diagonalschraffur */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(217,119,6,0.16),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.12),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(120,113,108,0.07)_0_1px,transparent_1px_14px)] dark:bg-[repeating-linear-gradient(135deg,rgba(214,211,209,0.04)_0_1px,transparent_1px_14px)]"
      />

      <div
        className={`relative flex w-full flex-col items-center ${width === '2xl' ? 'max-w-2xl' : 'max-w-md'}`}
      >
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex size-16 items-center justify-center rounded-full border-4 border-double border-amber-600 bg-stone-900 text-amber-400 shadow-lg shadow-amber-900/20 dark:border-amber-500">
            <Cog className="size-9 animate-spin [animation-duration:24s] motion-reduce:animate-none" />
          </span>
          <p className="font-['Big_Shoulders_Display'] text-3xl font-black uppercase leading-none tracking-[0.12em] sm:text-4xl dark:text-amber-50">
            Dominion of Steam
          </p>
          <p className="font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
            Eroberung im Dieselzeitalter
          </p>
        </div>

        <main className="relative w-full rounded-lg border border-stone-300 bg-white shadow-xl shadow-stone-900/10 dark:border-stone-700 dark:bg-stone-900 dark:shadow-black/40">
          {[
            'left-2.5 top-2.5',
            'right-2.5 top-2.5',
            'bottom-2.5 left-2.5',
            'bottom-2.5 right-2.5',
          ].map((pos) => (
            <span
              key={pos}
              aria-hidden
              className={`absolute ${pos} size-1.5 rounded-full bg-amber-600/70 shadow-[inset_0_-1px_0_rgba(0,0,0,0.3)] dark:bg-amber-500/60`}
            />
          ))}
          <div className="border-b-4 border-double border-stone-200 px-6 pb-4 pt-6 sm:px-8 dark:border-stone-700">
            <h1 className="font-['Big_Shoulders_Display'] text-2xl font-black uppercase tracking-wider">
              {title}
            </h1>
          </div>
          <div className="px-6 py-6 sm:px-8">{children}</div>
        </main>

        {footer && (
          <div className="mt-6 text-center text-sm text-stone-600 dark:text-stone-400">
            {footer}
          </div>
        )}
        <LegalLinks current={legalPage} className="mt-6" />
      </div>
    </div>
  )
}

export const linkClass =
  'inline-flex min-h-11 items-center font-semibold text-teal-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-teal-500 dark:text-teal-300'

type FieldProps = {
  id: string
  label: string
  error?: string
  hint?: string
} & InputHTMLAttributes<HTMLInputElement>

export function Field({ id, label, error, hint, type, ...input }: FieldProps) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  const describedBy = error ? `${id}-fehler` : hint ? `${id}-hinweis` : undefined
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-11 w-full rounded-md border bg-stone-50 px-3 text-base text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-600 ${
            isPassword ? 'pr-12' : ''
          } ${error ? 'border-rose-500 dark:border-rose-500' : 'border-stone-300 dark:border-stone-700'}`}
          {...input}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Passwort verbergen' : 'Passwort anzeigen'}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-stone-500 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-teal-500 dark:text-stone-400 dark:hover:text-teal-300"
          >
            {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-fehler`} className="mt-1.5 text-sm text-rose-700 dark:text-rose-400">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hinweis`} className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="rounded-md border border-rose-200 border-l-4 border-l-rose-600 bg-rose-50 px-3 py-2.5 text-sm text-rose-800 dark:border-rose-900 dark:border-l-rose-500 dark:bg-rose-950/50 dark:text-rose-200"
    >
      {message}
    </div>
  )
}

export function SubmitButton({
  busy,
  label,
  busyLabel,
}: {
  busy: boolean
  label: string
  busyLabel: string
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-b from-amber-400 to-amber-600 px-4 font-['Big_Shoulders_Display'] text-lg font-bold uppercase tracking-widest text-stone-950 shadow-sm transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-wait disabled:opacity-70"
    >
      {busy && <Cog className="size-5 animate-spin" />}
      {busy ? busyLabel : label}
    </button>
  )
}
