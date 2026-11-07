import {
  Castle,
  Crown,
  Factory,
  Flag,
  Globe,
  GraduationCap,
  Hourglass,
  Landmark,
  Medal,
  Skull,
  Trophy,
  Users,
} from 'lucide-react'
import type { ProfileBadge } from '@dos/shared/profile'
import { useLocale, useT } from '../../../i18n'
import { formatDate } from './format'

const ICONS: Record<ProfileBadge['icon'], typeof Trophy> = {
  trophy: Trophy,
  medal: Medal,
  crown: Crown,
  flag: Flag,
  graduation: GraduationCap,
  castle: Castle,
  factory: Factory,
  globe: Globe,
  landmark: Landmark,
  hourglass: Hourglass,
  skull: Skull,
  users: Users,
}

/** Badges of a profile: earned ones in brass with the date, open ones greyed with the progress */
export function Abzeichen({ badges }: { badges: ProfileBadge[] }) {
  const t = useT()
  const { locale } = useLocale()
  const earned = badges.filter((b) => b.earnedAt).length
  return (
    <section aria-labelledby="badges-heading">
      <h2
        id="badges-heading"
        className="mb-4 flex items-baseline justify-between border-b-4 border-double border-stone-300 pb-2 font-['Big_Shoulders_Display'] text-3xl font-black uppercase tracking-wide dark:border-stone-700"
      >
        {t('badges.heading')}
        <span className="font-['IBM_Plex_Mono'] text-sm font-normal normal-case tracking-normal text-stone-500">
          {t('badges.count', { earned, total: badges.length })}
        </span>
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {badges.map((b) => {
          const Icon = ICONS[b.icon]
          const done = !!b.earnedAt
          return (
            <li
              key={b.id}
              aria-label={t(`badges.${b.id}.name`)}
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                done
                  ? 'border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30'
                  : 'border-stone-200 bg-white opacity-70 dark:border-stone-800 dark:bg-stone-900'
              }`}
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 ${
                  done
                    ? 'border-amber-500 bg-stone-900 text-amber-300'
                    : 'border-stone-300 text-stone-400 dark:border-stone-700'
                }`}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold leading-tight">{t(`badges.${b.id}.name`)}</span>
                <span className="block text-xs text-stone-500 dark:text-stone-400">
                  {t(`badges.${b.id}.hint`)}
                </span>
                <span className="mt-1 block font-['IBM_Plex_Mono'] text-[11px] text-stone-500">
                  {done
                    ? t('badges.earnedOn', { date: formatDate(locale, b.earnedAt!) })
                    : b.target > 1 && t('badges.progress', { value: b.progress, target: b.target })}
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
