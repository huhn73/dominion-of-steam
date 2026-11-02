import type { ReactNode } from 'react'

export function PlaceholderPage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <h1 className="font-['Big_Shoulders_Display'] text-4xl font-black uppercase tracking-wide">
        {title}
      </h1>
      <div className="mt-2 text-stone-600 dark:text-stone-400">{children}</div>
    </div>
  )
}
