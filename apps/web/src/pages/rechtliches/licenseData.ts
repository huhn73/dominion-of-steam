// Shared data of the licence pages (German and English)
import license from '../../../../../LICENSE?raw'
import credits from '../../../../../public/audio/credits.json'

export { credits }

export interface Recording {
  title: string
  author: string
  source: string
  license: string
  license_url: string
}

/** The CC0 recordings the effects were cut from (public/audio/credits.json) */
export const SFX_RECORDINGS = credits.sfx_source_recordings as Recording[]

export const FONTS = ['Barlow', 'Big Shoulders Display', 'IBM Plex Mono']

/** The MIT text without the exception note, which is explained on the page itself */
export const mitText = license.split('\n---')[0]!.trim()

