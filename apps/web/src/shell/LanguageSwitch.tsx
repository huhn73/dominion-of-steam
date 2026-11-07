import { LOCALES } from '@dos/shared/i18n'
import { useChangeLocale } from '../data/session'
import { languageChoiceEnabled, useLocale, useT } from '../i18n'

/** Small DE · EN switch under the login and legal cards (visitors without an account) */
export function LanguageSwitch() {
  const { locale } = useLocale()
  const changeLocale = useChangeLocale()
  const t = useT()
  if (!languageChoiceEnabled) return null
  return (
    <div
      role="group"
      aria-label={t('common.language.label')}
      className="flex items-center gap-1 font-['IBM_Plex_Mono'] text-[11px] uppercase tracking-[0.15em]"
    >
      {LOCALES.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden className="text-stone-400">·</span>}
          <button
            type="button"
            lang={l}
            aria-pressed={l === locale}
            title={t(`common.language.${l}`)}
            onClick={() => void changeLocale(l)}
            className={`min-h-11 px-1 ${l === locale ? 'font-semibold text-amber-700 dark:text-amber-400' : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'}`}
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  )
}
