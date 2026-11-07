/**
 * What each version brought for players, one sentence per new feature. Shown once after an
 * update (hint after login) and on the page „Neuigkeiten“. Newest version first; every release
 * needs an entry here (`pnpm release`, test in `__tests__/news.test.ts`), an empty `items` list
 * for a release without anything players would notice.
 */
export interface NewsItem {
  title: string
  /** One sentence, ending with a full stop */
  text: string
}

export interface ReleaseNotes {
  /** x.y.z, as in package.json */
  version: string
  /** ISO date of the release */
  date: string
  items: NewsItem[]
}

export const NEWS: readonly ReleaseNotes[] = [
  {
    version: '0.11.0',
    date: '2026-11-06',
    items: [
      {
        title: 'Neuigkeiten',
        text: 'Nach einem Update zeigt dir das Spiel einmal, was neu ist, und unten auf jeder Seite führt „Neuigkeiten“ zu allen bisherigen Änderungen.',
      },
      {
        title: 'Profilbild zuschneiden',
        text: 'Beim Hochladen wählst du den runden Ausschnitt deines Profilbilds selbst; auch große Handyfotos bis 10 MB gehen, gespeichert wird ein kleines Bild ohne Standortdaten.',
      },
    ],
  },
  {
    version: '0.10.1',
    date: '2026-11-06',
    items: [
      {
        title: 'Alles in Echtzeit',
        text: 'Lobby, Warteraum und Partie aktualisieren sich sofort, wenn Mitspieler ziehen oder beitreten, ohne dass du neu laden musst.',
      },
      {
        title: 'Kein Warten auf die KI',
        text: 'Dein Zugende kommt sofort zurück, die KI-Gegner ziehen danach im Hintergrund, und die Kopfzeile zeigt, wer gerade am Zug ist.',
      },
      {
        title: 'Spielfeld nach deinem Geschmack',
        text: 'In den Einstellungen legst du fest, ob Ziehen Einheiten bewegt oder die Karte verschiebt, ob beim Zugende nach Einheiten ohne Befehl gefragt wird und wie empfindlich der Zoom reagiert, auch beim Zoomen mit zwei Fingern.',
      },
      {
        title: 'Klügere KI',
        text: 'KI-Gegner greifen verteidigte Einheiten gemeinsam an und merken sich Feinde, die im Nebel verschwunden sind.',
      },
    ],
  },
  {
    version: '0.10.0',
    date: '2026-11-06',
    items: [
      {
        title: 'Tutorial „Erste Schritte“',
        text: 'Eine geführte Mini-Partie zeigt dir Schritt für Schritt Bewegen, Erobern, Produzieren und Kämpfen.',
      },
      {
        title: 'Kompendium mit Ausführungen',
        text: 'Im Kompendium siehst du bei jeder Einheit, wie die Fraktionen sie abwandeln, und die Sondereinheiten mit eigenem Bild.',
      },
      {
        title: 'Schöne Link-Vorschau',
        text: 'Teilst du einen Link zum Spiel in Messengern oder Teams, erscheint eine Vorschau mit Titelbild.',
      },
    ],
  },
  {
    version: '0.9.0',
    date: '2026-11-03',
    items: [
      {
        title: 'Dominion of Steam ist da',
        text: 'Erobere mit einer von vier Fraktionen Städte auf prozedural erzeugten Kontinenten und Inseln unter Kriegsnebel, zu Land, zu Wasser und in der Luft.',
      },
      {
        title: 'Gegen Menschen und KI',
        text: 'Spiele live oder asynchron mit Freunden oder gegen KI-Gegner in drei Schwierigkeitsstufen mit eigenen Persönlichkeiten.',
      },
      {
        title: 'Siegbedingungen für Inselwelten',
        text: 'Auf Inseln und Archipelen gewinnt auch, wer fünf Runden lang die Mehrheit der Städte hält, und KI-Gegner geben in aussichtsloser Lage auf.',
      },
      {
        title: 'Benachrichtigungen',
        text: 'Push im Browser und E-Mail melden dir, wenn du am Zug bist oder eingeladen wirst, je Anlass einstellbar.',
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
