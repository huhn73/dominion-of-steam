import type { DictShape } from '../dict'
import type { de } from '../de'
import common from './common.json'
import shell from './shell.json'
import match from './match.json'
import account from './account.json'
import auth from './auth.json'
import lobby from './lobby.json'
import settings from './settings.json'
import profile from './profile.json'
import admin from './admin.json'
import legal from './legal.json'

export const en: DictShape<typeof de> = { common, shell, match, account, auth, lobby, settings, profile, admin, legal }
