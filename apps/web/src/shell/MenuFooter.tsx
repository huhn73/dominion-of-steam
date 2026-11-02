import { LegalLinks } from '../pages/rechtliches/LegalLinks'
import { AppVersion } from './AppVersion'

/** Slim footer under the menu pages: copyright with the version, and the legal links */
export function MenuFooter() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50/60 dark:border-stone-800 dark:bg-stone-900/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-4 text-xs text-stone-500 sm:flex-row sm:justify-between sm:px-6 dark:text-stone-400">
        <p className="flex items-center gap-2">
          © 2026 Dominion of Steam <AppVersion />
        </p>
        <LegalLinks />
      </div>
    </footer>
  )
}
