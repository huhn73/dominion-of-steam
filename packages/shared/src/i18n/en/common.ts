import type { DictShape } from '../dict'
import type { common as de } from '../de/common'

export const common: DictShape<typeof de> = {
  appName: 'Dominion of Steam',
  language: {
    label: 'Language',
    hint: 'Applies to the game, e-mails and notifications.',
    de: 'Deutsch',
    en: 'English',
  },
  api: {
    network: 'The server cannot be reached.',
    unknown: 'Unknown error.',
  },
}
