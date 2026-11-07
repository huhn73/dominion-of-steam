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
import setup from './setup.json'
import partieSetup from './partieSetup.json'
import game from './game.json'
import compendium from './compendium.json'
import board from './board.json'
import city from './city.json'
import unit from './unit.json'
import tutorial from './tutorial.json'
import compendiumData from '../../compendium/data.json'
import events from './events.json'
import commands from './commands.json'
import errors from './errors.json'
import mail from './mail.json'
import notify from './notify.json'

/** Names from the compendium, so events can name units and factions by id */
const units: Record<string, string> = Object.fromEntries(compendiumData.unitTypes.map((u) => [u.id, u.name]))
const factions: Record<string, string> = Object.fromEntries(
  compendiumData.factions.map((f) => [f.id, f.shortName]),
)

/** German texts, the source for all other languages (one JSON file per area) */
export const de = { units, factions, common, shell, match, account, auth, lobby, settings, profile, admin, legal, setup, partieSetup, game, compendium, board, city, unit, tutorial, events, commands, errors, mail, notify }
