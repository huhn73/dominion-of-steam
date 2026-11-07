import type { DictShape } from '../dict'
import type { de } from '../de'
import { common } from './common'

export const en: DictShape<typeof de> = { common }
