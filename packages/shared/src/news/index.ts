import type { Locale } from '../i18n/locale'
/**
 * What each version brought for players, one sentence per new feature. Shown once after an
 * update (hint after login) and on the page „Neuigkeiten“. Newest version first; every release
 * needs an entry here (`pnpm release`, test in `__tests__/news.test.ts`), an empty `items` list
 * for a release without anything players would notice.
 */
export interface NewsText {
  title: string
  /** One sentence, ending with a full stop */
  text: string
}

/** One new feature in every language of the game */
export type NewsItem = Record<Locale, NewsText>

export interface ReleaseNotes {
  /** x.y.z, as in package.json */
  version: string
  /** ISO date of the release */
  date: string
  items: NewsItem[]
}

export const NEWS: readonly ReleaseNotes[] = [
  {
    version: '0.12.0',
    date: '2026-11-07',
    items: [
      {
        de: {
          title: 'Gelände',
          text: 'Wald, Hügel und Gebirge halten Panzerwagen und Dampfkoloss für den Rest der Runde auf und geben ihnen nur auf Hügeln Deckung, Landeinheiten sehen von Hügeln und Gebirge zwei Felder weit, und Tauchboote sind im Flachwasser für alle sichtbar.',
        },
        en: {
          title: 'Terrain',
          text: 'Forest, hills and mountains stop Armoured Cars and the Steam Colossus for the rest of the round and give them cover only on hills, land units see two tiles from hills and mountains, and Submersibles are visible to everyone in shallows.',
        },
      },
    ],
  },
  {
    version: '0.11.0',
    date: '2026-11-07',
    items: [
      {
        de: {
          title: 'Neuigkeiten',
          text: 'Nach einem Update zeigt dir das Spiel einmal, was neu ist, und unten auf jeder Seite führt „Neuigkeiten“ zu allen bisherigen Änderungen.',
        },
        en: {
          title: 'News',
          text: 'After an update the game shows you once what is new, and “News” at the bottom of every page leads to all changes so far.',
        },
      },
      {
        de: {
          title: 'Profilbild zuschneiden',
          text: 'Beim Hochladen wählst du den runden Ausschnitt deines Profilbilds selbst; auch große Handyfotos bis 10 MB gehen, gespeichert wird ein kleines Bild ohne Standortdaten.',
        },
        en: {
          title: 'Cropping your profile picture',
          text: 'When uploading, you choose the round crop of your profile picture yourself; even large phone photos up to 10 MB work, and a small picture without location data is stored.',
        },
      },
      {
        de: {
          title: 'Englisch',
          text: 'Das Spiel gibt es jetzt auch auf Englisch: Die Sprache richtet sich nach deinem Browser, lässt sich unter Einstellungen → Darstellung und auf der Anmeldeseite wechseln und gilt auch für E-Mails und Benachrichtigungen.',
        },
        en: {
          title: 'English',
          text: 'The game is now available in English: the language follows your browser, can be switched under Settings → Display and on the login page, and also applies to e-mails and notifications.',
        },
      },
      {
        de: {
          title: 'Freunde',
          text: 'Unter „Freunde“ suchst du Mitspieler, schickst Freundschaftsanfragen und verwaltest deine Freundesliste; Freunde lädst du im Partie-Setup direkt ein.',
        },
        en: {
          title: 'Friends',
          text: 'Under “Friends” you find players, send friend requests and manage your friends list; you invite friends directly in the match setup.',
        },
      },
      {
        de: {
          title: 'Profile anderer Spieler',
          text: 'Ein Klick auf einen Spielernamen zeigt dessen Bilanz, Partieverlauf und Abzeichen, und den Verlauf filterst du jetzt über alle Partien.',
        },
        en: {
          title: 'Other players’ profiles',
          text: 'A click on a player’s name shows their record, match history and badges, and the history filter now covers all matches.',
        },
      },
      {
        de: {
          title: 'Abzeichen',
          text: 'Zwölf Abzeichen von der Feuertaufe bis zum Feldmarschall zeigen im Profil, was du erreicht hast, mit Fortschritt und einer Nachricht beim Erreichen.',
        },
        en: {
          title: 'Badges',
          text: 'Twelve badges from Baptism of Fire to Field Marshal show in your profile what you have achieved, with progress and a message when you earn one.',
        },
      },
    ],
  },
  {
    version: '0.10.1',
    date: '2026-11-06',
    items: [
      {
        de: {
          title: 'Alles in Echtzeit',
          text: 'Lobby, Warteraum und Partie aktualisieren sich sofort, wenn Mitspieler ziehen oder beitreten, ohne dass du neu laden musst.',
        },
        en: {
          title: 'Everything in real time',
          text: 'Lobby, waiting room and match update at once when other players move or join, without you having to reload.',
        },
      },
      {
        de: {
          title: 'Kein Warten auf die KI',
          text: 'Dein Zugende kommt sofort zurück, die KI-Gegner ziehen danach im Hintergrund, und die Kopfzeile zeigt, wer gerade am Zug ist.',
        },
        en: {
          title: 'No waiting for the AI',
          text: 'Your end of turn comes back at once, the AI opponents then move in the background, and the header shows who is on the move.',
        },
      },
      {
        de: {
          title: 'Spielfeld nach deinem Geschmack',
          text: 'In den Einstellungen legst du fest, ob Ziehen Einheiten bewegt oder die Karte verschiebt, ob beim Zugende nach Einheiten ohne Befehl gefragt wird und wie empfindlich der Zoom reagiert, auch beim Zoomen mit zwei Fingern.',
        },
        en: {
          title: 'A board to your taste',
          text: 'In the settings you decide whether dragging moves units or pans the map, whether ending your turn asks about units without orders, and how sensitive the zoom is, including two-finger zoom.',
        },
      },
      {
        de: {
          title: 'Klügere KI',
          text: 'KI-Gegner greifen verteidigte Einheiten gemeinsam an und merken sich Feinde, die im Nebel verschwunden sind.',
        },
        en: {
          title: 'Smarter AI',
          text: 'AI opponents attack defended units together and remember enemies that have vanished into the fog.',
        },
      },
    ],
  },
  {
    version: '0.10.0',
    date: '2026-11-06',
    items: [
      {
        de: {
          title: 'Tutorial „Erste Schritte“',
          text: 'Eine geführte Mini-Partie zeigt dir Schritt für Schritt Bewegen, Erobern, Produzieren und Kämpfen.',
        },
        en: {
          title: 'Tutorial “First Steps”',
          text: 'A guided mini match shows you moving, capturing, producing and fighting step by step.',
        },
      },
      {
        de: {
          title: 'Kompendium mit Ausführungen',
          text: 'Im Kompendium siehst du bei jeder Einheit, wie die Fraktionen sie abwandeln, und die Sondereinheiten mit eigenem Bild.',
        },
        en: {
          title: 'Compendium with versions',
          text: 'For every unit, the compendium shows how the factions vary it, and the special units with their own picture.',
        },
      },
      {
        de: {
          title: 'Schöne Link-Vorschau',
          text: 'Teilst du einen Link zum Spiel in Messengern oder Teams, erscheint eine Vorschau mit Titelbild.',
        },
        en: {
          title: 'Nice link preview',
          text: 'When you share a link to the game in messengers or Teams, a preview with a title picture appears.',
        },
      },
    ],
  },
  {
    version: '0.9.0',
    date: '2026-11-03',
    items: [
      {
        de: {
          title: 'Dominion of Steam ist da',
          text: 'Erobere mit einer von vier Fraktionen Städte auf prozedural erzeugten Kontinenten und Inseln unter Kriegsnebel, zu Land, zu Wasser und in der Luft.',
        },
        en: {
          title: 'Dominion of Steam is here',
          text: 'Capture cities with one of four factions on procedurally generated continents and islands under the fog of war, on land, at sea and in the air.',
        },
      },
      {
        de: {
          title: 'Gegen Menschen und KI',
          text: 'Spiele live oder asynchron mit Freunden oder gegen KI-Gegner in drei Schwierigkeitsstufen mit eigenen Persönlichkeiten.',
        },
        en: {
          title: 'Against humans and AI',
          text: 'Play live or asynchronously with friends or against AI opponents in three difficulty levels with their own personalities.',
        },
      },
      {
        de: {
          title: 'Siegbedingungen für Inselwelten',
          text: 'Auf Inseln und Archipelen gewinnt auch, wer fünf Runden lang die Mehrheit der Städte hält, und KI-Gegner geben in aussichtsloser Lage auf.',
        },
        en: {
          title: 'Victory conditions for island worlds',
          text: 'On islands and archipelagos, whoever holds the majority of the cities for five rounds also wins, and AI opponents surrender when their situation is hopeless.',
        },
      },
      {
        de: {
          title: 'Benachrichtigungen',
          text: 'Push im Browser und E-Mail melden dir, wenn du am Zug bist oder eingeladen wirst, je Anlass einstellbar.',
        },
        en: {
          title: 'Notifications',
          text: 'Browser push and e-mail tell you when it is your turn or you are invited, adjustable per occasion.',
        },
      },
    ],
  },
]

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/

/** Negative when `a` is older than `b`, 0 when equal, positive when newer (x.y.z only) */
export function compareVersions(a: string, b: string): number {
  const pa = SEMVER.exec(a)
  const pb = SEMVER.exec(b)
  if (!pa || !pb) throw new Error(`Keine Version x.y.z: ${pa ? b : a}`)
  for (let i = 1; i <= 3; i++) {
    const d = Number(pa[i]) - Number(pb[i])
    if (d) return d
  }
  return 0
}

/** The x.y.z part of a version label such as „0.10.1+abc1234“ or „0.10.1-dev“ */
export function versionOf(label: string): string {
  return SEMVER.exec(label.split(/[+-]/)[0] ?? '')?.[0] ?? '0.0.0'
}

export const isKnownVersion = (version: string) => NEWS.some((n) => n.version === version)

/** Releases up to the running version, newest first (the page „Neuigkeiten“) */
export function releasedNews(current: string): ReleaseNotes[] {
  return NEWS.filter((n) => compareVersions(n.version, current) <= 0)
}

/**
 * Releases with news the player has not seen yet: newer than `seen`, not newer than the running
 * version, with at least one item. Without a seen version nothing is shown.
 */
export function unseenNews(seen: string | null, current: string): ReleaseNotes[] {
  if (!seen || !SEMVER.test(seen)) return []
  return releasedNews(current).filter(
    (n) => compareVersions(n.version, seen) > 0 && n.items.length > 0,
  )
}

/** The newest version with an entry up to the running version (new players start there) */
export function latestNewsVersion(current: string): string {
  return releasedNews(current)[0]?.version ?? current
}
