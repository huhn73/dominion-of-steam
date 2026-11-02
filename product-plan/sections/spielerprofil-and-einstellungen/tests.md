# Test-Spezifikation: Spielerprofil & Einstellungen

## Überblick

Diese Spezifikation beschreibt das Verhalten der Komponenten `Profil` und `Einstellungen` aus Nutzersicht. Sie ist framework-unabhängig (z. B. mit Testing Library, Playwright oder Cypress umsetzbar). Alle Texte sind exakt aus den Komponenten übernommen. Wenn nicht anders angegeben, gelten die Beispieldaten aus `sample-data.json` (Spieler „Björn“, 23 Partien, 11 Siege, 8 Einträge im Verlauf, `hasMoreHistory: true`, `pushPermission: 'default'`).

Hinweise:
- Dialoge (`Sheet`) haben `role="dialog"`, `aria-modal="true"` und als `aria-label` ihren Titel.
- `Einstellungen` übernimmt `settings` nur beim ersten Rendern in lokalen Zustand; Änderungen werden lokal angewendet und per `onChangeSettings` gemeldet.

---

## Tests der Abläufe

### Ablauf 1: Profil ansehen

**Szenario:** Der Spieler öffnet sein Profil und sieht Dienstakte, Bilanz und Fraktionsstatistik.

#### Erfolgsfall

**Setup:** `Profil` mit den Beispieldaten.

**Schritte:**
1. Komponente rendern.

**Erwartete Ergebnisse:**
- [ ] Kicker „Dienstakte“ und Überschrift (h1) „Björn“ sind sichtbar.
- [ ] „Mitglied seit Juni 2026“ wird angezeigt.
- [ ] „Lieblingsfraktion: Eisenbund von Valdrin“ mit Wappen (`aria-label` bzw. `alt` „Wappen Eisenbund von Valdrin“).
- [ ] Ohne `avatarUrl` zeigt der Avatar die Initiale „B“.
- [ ] Button „Profil bearbeiten“ ist sichtbar.
- [ ] Rubrik „Bilanz“ zeigt: „Partien“ 23, „Siege“ 11, „Siegquote“ „48 %“ (mit Balken), „Städte erobert“ 187, „Einheiten gebaut“ 642, „Längste Partie“ 131 „Runden“.
- [ ] Rubrik „Nach Fraktion“ zeigt „Eisenbund von Valdrin“ mit „12 Partien · 67 % Siege“, „Aurelische Republik“ mit „6 Partien · 33 % Siege“, „Nordmark-Kollektiv“ mit „5 Partien · 20 % Siege“.
- [ ] „Salzküsten-Liga“ zeigt im Balken „Noch nicht gespielt“ und als Wert „–“.
- [ ] Legende „Siege“ und „Partien gesamt“ ist sichtbar.

#### Grenzfall: Keine Lieblingsfraktion

**Setup:** `profile.favoriteFactionId: null`.

**Erwartete Ergebnisse:**
- [ ] Der Text „Lieblingsfraktion:“ wird nicht angezeigt.
- [ ] Der Kopfbereich verwendet neutrale Stone-Farben, der Avatar-Ring ist grau (`#78716c`).

---

### Ablauf 2: Partieverlauf filtern und nachladen

**Szenario:** Der Spieler filtert seinen Partieverlauf nach Ergebnis und Fraktion und lädt ältere Partien nach.

#### Erfolgsfall

**Setup:** `Profil` mit Beispieldaten, `onLoadMoreHistory` als Mock.

**Schritte:**
1. Rubrik „Partieverlauf“ betrachten.
2. In der Radiogruppe „Nach Ergebnis filtern“ auf „Aufgegeben“ klicken.
3. Wieder „Alle“ wählen, dann in der Auswahl „Nach Fraktion filtern“ „Nordmark-Kollektiv“ wählen.
4. „Mehr anzeigen“ klicken.

**Erwartete Ergebnisse:**
- [ ] Nach Schritt 1 sind 8 Einträge sichtbar; erster Eintrag „Rußige Pfade“ mit „Platz 1 von 3 · 48 Runden · 27. Okt. 2026“ (de-DE-Format) und „gegen Lena Hartmann, Zechenmeister Brandt (KI)“ sowie Stempel „Sieg“.
- [ ] Stempel: „Sieg“ (Teal), „Niederlage“ (Rot), „Aufgegeben“ (Grau).
- [ ] Nach Schritt 2 ist nur „Testlauf“ sichtbar; der Button „Aufgegeben“ hat `aria-checked="true"`.
- [ ] Nach Schritt 3 sind nur „Gegen die Republik“ und „Nebel über Nordhavn“ sichtbar.
- [ ] Nach Schritt 4 wurde `onLoadMoreHistory` genau einmal ohne Argumente aufgerufen.
- [ ] Die Filterung erfolgt nur über die geladenen Einträge, es wird kein Callback ausgelöst.

#### Fehlerfall: Filter ohne Treffer

**Schritte:**
1. In „Nach Fraktion filtern“ „Salzküsten-Liga“ wählen.
2. „Filter zurücksetzen“ klicken.

**Erwartete Ergebnisse:**
- [ ] Nach Schritt 1 erscheint „Keine Partien gefunden“ mit „Für diesen Filter gibt es in deinem Verlauf keine Partie.“ und Button „Filter zurücksetzen“.
- [ ] Nach Schritt 2 stehen Ergebnisfilter auf „Alle“ und Fraktionsfilter auf „Alle Fraktionen“; alle 8 Einträge sind wieder sichtbar.

#### Grenzfall: Kein Nachladen

**Setup:** `hasMoreHistory: false`.

**Erwartete Ergebnisse:**
- [ ] Der Button „Mehr anzeigen“ wird nicht gerendert.

---

### Ablauf 3: Profil bearbeiten

**Szenario:** Der Spieler ändert Anzeigenamen und Avatar.

#### Erfolgsfall

**Setup:** `onUpdateDisplayName`, `onUploadAvatar`, `onRemoveAvatar` als Mocks.

**Schritte:**
1. „Profil bearbeiten“ klicken.
2. Feld „Anzeigename“ leeren und „Björn der Große“ eingeben.
3. „Speichern“ klicken.

**Erwartete Ergebnisse:**
- [ ] Ein Dialog mit Titel „Profil bearbeiten“ öffnet sich; das Feld „Anzeigename“ ist mit „Björn“ vorbelegt.
- [ ] Der Hinweis unter dem Feld zeigt die Zeichenzahl, z. B. „15/24 Zeichen“.
- [ ] Die Avatar-Vorschau im Dialog zeigt die Initialen des eingegebenen Namens („BD“).
- [ ] Ohne Avatar steht „Ohne Bild werden deine Initialen gezeigt.“; „Bild entfernen“ fehlt.
- [ ] `onUpdateDisplayName` wird mit `"Björn der Große"` aufgerufen; der Dialog schließt sich.

#### Erfolgsfall: Avatar hochladen und entfernen

**Schritte:**
1. Dialog öffnen, „Bild hochladen“ klicken und eine Bilddatei wählen.
2. Mit `profile.avatarUrl` gesetzt erneut rendern und Dialog öffnen, „Bild entfernen“ klicken.

**Erwartete Ergebnisse:**
- [ ] Das versteckte Dateifeld akzeptiert `image/*`.
- [ ] `onUploadAvatar` wird sofort nach der Dateiauswahl mit dem `File` aufgerufen (ohne „Speichern“).
- [ ] Mit Avatar wird „Bild entfernen“ angezeigt; Klick ruft `onRemoveAvatar` ohne Argumente auf.

#### Validierungsfall: Name zu kurz

**Schritte:**
1. Dialog öffnen, Feld „Anzeigename“ auf „Bj“ setzen.

**Erwartete Ergebnisse:**
- [ ] „Speichern“ ist deaktiviert.
- [ ] Der Hinweis lautet „3 bis 24 Zeichen“.
- [ ] Auch Eingaben aus Leerzeichen (z. B. „   “) gelten als ungültig, da getrimmt wird.
- [ ] Das Feld nimmt maximal 24 Zeichen an (`maxLength`).

#### Grenzfall: Name unverändert oder nur mit Leerzeichen am Rand

**Schritte:**
1. Dialog öffnen, Name auf „ Björn “ setzen, „Speichern“ klicken.

**Erwartete Ergebnisse:**
- [ ] `onUpdateDisplayName` wird **nicht** aufgerufen (getrimmter Name gleich dem bisherigen); der Dialog schließt sich trotzdem.

#### Abbrechen

- [ ] „Abbrechen“, das X „Schließen“, Escape oder ein Klick auf den abgedunkelten Hintergrund schließen den Dialog ohne Callback.

---

### Ablauf 4: Einstellungen ändern (sofortiges Speichern)

**Szenario:** Der Spieler ändert Einstellungen in verschiedenen Rubriken.

#### Erfolgsfall

**Setup:** `Einstellungen` mit Beispieldaten, `displayName: 'Björn'`, `onChangeSettings` als Mock, Desktop-Breite.

**Schritte:**
1. Rendern.
2. In der Zeile „Partie beendet“ den Schalter „Partie beendet per Push“ einschalten.
3. In „E-Mail-Verzögerung“ „Sofort“ wählen.
4. Rubrik „Darstellung“ wählen, im Farbschema „Dunkel“ wählen.
5. Rubrik „Steuerung“ wählen, „Rechte Maustaste“ auf „Kontextmenü“ stellen.

**Erwartete Ergebnisse:**
- [ ] Kicker „Maschinenraum“, Überschrift „Einstellungen“; Navigation „Rubriken“ mit „Benachrichtigungen“, „Darstellung“, „Ton“, „Steuerung“, „Konto“.
- [ ] Auf dem Desktop ist zu Beginn „Benachrichtigungen“ geöffnet und hat `aria-current="page"`.
- [ ] Tabelle mit Spalten „Anlass“, „Push“, „E-Mail“ und vier Zeilen: „Du bist am Zug“, „Frist läuft bald ab“, „Einladung erhalten“, „Partie beendet“.
- [ ] Nach Schritt 2: `onChangeSettings` mit `notifications.matchEnded = { push: true, email: false }`, alle übrigen Werte unverändert.
- [ ] Nach Schritt 3: `onChangeSettings` mit `notifications.emailDelayHours = 0`.
- [ ] Nach Schritt 4: `onChangeSettings` mit `display.theme = 'dark'`.
- [ ] Nach Schritt 5: `onChangeSettings` mit `controls.rightClick = 'contextMenu'`.
- [ ] Jedes Mal erscheint ein `role="status"`-Hinweis „Gespeichert“, der nach ca. 1,6 s verschwindet; bei schnellen Folgeänderungen startet der Timer neu.
- [ ] Jeder Aufruf übergibt das vollständige `Settings`-Objekt inkl. vorheriger Änderungen.

#### Ton: Stumm deaktiviert Regler

**Schritte:**
1. Rubrik „Ton“ wählen.
2. Schalter „Stumm“ einschalten.
3. Versuchen, „Musik“ zu verändern.

**Erwartete Ergebnisse:**
- [ ] Vor Schritt 2 zeigen die Regler „80 %“ (Gesamtlautstärke), „70 %“ (Effekte), „40 %“ (Musik), „55 %“ (Umgebung).
- [ ] Nach Schritt 2: `onChangeSettings` mit `sound.muted = true`; die vier Regler „Gesamtlautstärke“, „Effekte“, „Musik“, „Umgebung“ sind `disabled` und halbtransparent.
- [ ] Schritt 3 löst keinen Callback aus.
- [ ] Der Regler „Zoom-Empfindlichkeit“ in „Steuerung“ bleibt unabhängig vom Stumm-Schalter bedienbar.
- [ ] Regler bewegen sich in 5er-Schritten zwischen 0 und 100.

---

### Ablauf 5: Push-Benachrichtigungen erlauben

#### Erfolgsfall

**Setup:** `pushPermission: 'default'`, `onEnablePush` als Mock.

**Erwartete Ergebnisse:**
- [ ] Hinweis „Push-Benachrichtigungen sind in diesem Browser noch nicht erlaubt.“ mit Button „Erlauben“.
- [ ] Klick auf „Erlauben“ ruft `onEnablePush` ohne Argumente auf.

#### Fehlerfall: Push blockiert

**Setup:** `pushPermission: 'denied'`.

**Erwartete Ergebnisse:**
- [ ] Hinweis „Push ist im Browser blockiert. Erlaube Benachrichtigungen über das Schloss-Symbol in der Adressleiste.“
- [ ] Es gibt **keinen** Button „Erlauben“.

#### Grenzfall: Push erlaubt

**Setup:** `pushPermission: 'granted'`.

- [ ] Es wird kein Hinweis angezeigt.

---

### Ablauf 6: E-Mail und Passwort ändern

#### Erfolgsfall: E-Mail

**Schritte:**
1. Rubrik „Konto“ wählen; Zeile „E-Mail-Adresse“ zeigt „bjoern@example.de“.
2. In dieser Zeile „Ändern“ klicken.
3. „Neue E-Mail-Adresse“: `neu@example.de`, „Aktuelles Passwort“: `geheim`.
4. „Speichern“ klicken.

**Erwartete Ergebnisse:**
- [ ] Dialog „E-Mail ändern“ öffnet sich mit leeren Feldern und dem Hinweis „Wir schicken dir einen Bestätigungslink an die neue Adresse.“
- [ ] `onChangeEmail` wird mit `("neu@example.de", "geheim")` aufgerufen; der Dialog schließt sich.

#### Validierungsfall: E-Mail

- [ ] „Speichern“ bleibt deaktiviert, solange die Adresse nicht dem Muster `x@y.z` entspricht (z. B. „neu@example“) oder „Aktuelles Passwort“ leer ist.

#### Erfolgsfall: Passwort

**Schritte:**
1. In der Zeile „Passwort“ (Beschreibung „••••••••••“) „Ändern“ klicken.
2. „Aktuelles Passwort“: `altesPW`, „Neues Passwort“: `neuesPasswort`, „Neues Passwort wiederholen“: `neuesPasswort`.
3. „Speichern“ klicken.

**Erwartete Ergebnisse:**
- [ ] Dialog „Passwort ändern“, Hinweis „Mindestens 8 Zeichen“ unter „Neues Passwort“.
- [ ] `onChangePassword` wird mit `("altesPW", "neuesPasswort")` aufgerufen; der Dialog schließt sich.

#### Validierungsfall: Passwort

- [ ] Bei abweichender Wiederholung erscheint „Die Passwörter stimmen nicht überein.“ und „Speichern“ ist deaktiviert.
- [ ] Bei neuem Passwort mit weniger als 8 Zeichen oder leerem aktuellem Passwort ist „Speichern“ deaktiviert.
- [ ] Beim erneuten Öffnen eines Dialogs sind alle Felder wieder leer.

---

### Ablauf 7: Abmelden

- [ ] Zeile „Angemeldete Geräte“ zeigt „Du bist auf 3 Geräten angemeldet.“ (bei `activeSessions: 1`: „Du bist auf 1 Gerät angemeldet.“).
- [ ] „Abmelden“ ruft `onLogout` auf.
- [ ] „Auf allen Geräten abmelden“ ruft `onLogoutEverywhere` auf.
- [ ] Beide lösen keinen Bestätigungsdialog aus.

---

### Ablauf 8: Konto löschen (zweistufig)

#### Erfolgsfall

**Setup:** `displayName: 'Björn'`, `onDeleteAccount` als Mock.

**Schritte:**
1. Rubrik „Konto“, in der „Gefahrenzone“ „Konto löschen“ klicken.
2. Im Dialog „Konto löschen?“ „Weiter“ klicken.
3. Im Dialog „Endgültig löschen“ in das Feld „Gib zur Bestätigung deinen Anzeigenamen „Björn“ ein“ `Björn` eingeben.
4. „Konto löschen“ klicken.

**Erwartete Ergebnisse:**
- [ ] Gefahrenzone zeigt „Löscht dein Konto endgültig. Deine laufenden Partien übernimmt eine KI, Statistiken und Verlauf gehen verloren.“
- [ ] Dialog 1 listet: „Deine laufenden Partien übernimmt eine KI auf Stufe „Normal“.“, „Deine Statistiken und dein Partieverlauf werden gelöscht.“, „Das Löschen kann nicht rückgängig gemacht werden.“; Buttons „Abbrechen“ und „Weiter“ (rot).
- [ ] Nach Schritt 2 ersetzt Dialog 2 den ersten; „Konto löschen“ ist deaktiviert.
- [ ] Nach Schritt 3 ist „Konto löschen“ aktiv.
- [ ] Nach Schritt 4 wird `onDeleteAccount` genau einmal ohne Argumente aufgerufen; der Dialog schließt sich.

#### Validierungsfall: Falscher Name

- [ ] Eingaben „björn“, „Björn “ oder „Bjorn“ lassen „Konto löschen“ deaktiviert (exakter, groß-/kleinschreibungs- und leerzeichengenauer Vergleich).
- [ ] „Abbrechen“ in Dialog 1 oder 2 schließt ohne `onDeleteAccount`.

---

## Leere Zustände

### Partieverlauf ohne Partien

**Setup:** `history: []`.

- [ ] Anzeige „Noch keine Partie beendet“ und „Sobald du deine erste Partie abgeschlossen hast, erscheint sie hier mit Ergebnis und Platzierung.“
- [ ] Kein „Keine Partien gefunden“ und kein Button „Filter zurücksetzen“.
- [ ] „Mehr anzeigen“ wird nicht angezeigt, auch wenn `hasMoreHistory` `true` ist.

### Partieverlauf ohne Treffer

**Setup:** Beispieldaten mit einem Filter ohne Treffer (z. B. „Salzküsten-Liga“).

- [ ] Anzeige „Keine Partien gefunden“ und „Für diesen Filter gibt es in deinem Verlauf keine Partie.“ mit Button „Filter zurücksetzen“.
- [ ] „Mehr anzeigen“ wird nicht angezeigt, solange die gefilterte Liste leer ist, auch bei `hasMoreHistory: true`; nach „Filter zurücksetzen“ erscheint es wieder.

### Neuer Spieler ohne Partien

**Setup:** Siehe Beispiel-Testdaten „Neuer Spieler“.

- [ ] „Bilanz“ zeigt überall 0, „Siegquote“ „0 %“ (keine Division durch 0) mit leerem Balken.
- [ ] Alle Fraktionen in „Nach Fraktion“ zeigen „Noch nicht gespielt“ und „–“.
- [ ] Keine „Lieblingsfraktion“ im Kopf.
- [ ] „Partieverlauf“ zeigt „Noch keine Partie beendet“ statt des Filter-Leerzustands.

### Einstellungen

- Die Einstellungen haben keinen Leerzustand; alle Werte sind immer gesetzt.

---

## Komponenten-Interaktionen

### `Profil`

- [ ] Rendert drei Rubriken mit `aria-labelledby`: „Bilanz“, „Nach Fraktion“, „Partieverlauf“.
- [ ] Fraktionen, deren `factionId` nicht in `factions` vorkommt, werden in „Nach Fraktion“ übersprungen; im Verlauf fehlt dann nur das Wappen.
- [ ] Die Gesamtbalken in „Nach Fraktion“ sind relativ zur meistgespielten Fraktion skaliert (Eisenbund = 100 %).
- [ ] Die Auswahl „Nach Fraktion filtern“ listet „Alle Fraktionen“ plus alle Einträge aus `factions`.

### `Einstellungen`

- [ ] Klick auf eine Rubrik zeigt deren Inhalt mit Überschrift (h2) des Rubriknamens.
- [ ] Smartphone-Breite: Zunächst nur die Rubrikenliste mit Untertiteln („Push und E-Mail“, „Farbschema, Animationen“, „Lautstärke, Musik, Umgebung“, „Maus, Ziehen, Zoom“, „E-Mail, Passwort, Abmelden“) und Pfeilen; Tippen öffnet die Rubrik, „Alle Rubriken“ führt zurück zur Liste.
- [ ] Desktop-Breite: Navigation und Inhalt stehen nebeneinander; „Alle Rubriken“ ist ausgeblendet.

### `Sheet`

- [ ] Escape schließt den offenen Dialog.
- [ ] Klick auf den Hintergrund schließt, Klick in den Dialog nicht.
- [ ] Beim Öffnen liegt der Fokus im Dialog: in „Profil bearbeiten“ auf „Anzeigename“ (das versteckte Dateifeld wird übersprungen), in „E-Mail ändern“ auf „Neue E-Mail-Adresse“, in „Passwort ändern“ auf „Aktuelles Passwort“, in Dialogen ohne Eingabefeld (z. B. „Konto löschen?“) auf dem ersten Button nach „Schließen“.
- [ ] Tab vom letzten Element springt zum ersten (Schließen-Button), Umschalt+Tab vom ersten zum letzten; der Fokus verlässt den Dialog nicht.
- [ ] Nach dem Schließen liegt der Fokus wieder auf dem Button, der den Dialog geöffnet hat.
- [ ] Auf Smartphones erscheint der Dialog als Bottom-Sheet mit Griff.

---

## Grenzfälle

- [ ] Langer Anzeigename (24 Zeichen, z. B. „Generalfeldzeugmeisterin“) wird in der h1 mit `truncate` abgeschnitten, ohne das Layout zu sprengen.
- [ ] Lange Partienamen und lange Gegnerlisten (z. B. „Inselreich“ mit 4 Gegnern) werden einzeilig abgeschnitten.
- [ ] Namen mit Bindestrich/Leerzeichen ergeben zwei Initialen (z. B. „Anna-Lena“ → „AL“); leerer Name ergibt „?“.
- [ ] `avatarUrl`, die nicht lädt, fällt auf Initialen zurück; `emblemUrl`, die nicht lädt, auf das SVG-Wappen.
- [ ] Siegquote rundet: 11/23 → „48 %“.
- [ ] Übergang leer → befüllt: Nach „Filter zurücksetzen“ oder neuen `history`-Props erscheint die Liste wieder.
- [ ] Neue `history`-Einträge nach `onLoadMoreHistory` werden unter Beibehaltung der aktiven Filter angezeigt.
- [ ] `Einstellungen`: Ändern sich die `settings`-Props nach dem ersten Rendern, übernimmt die Komponente sie nicht (lokaler Zustand) – ggf. per `key` neu mounten.

---

## Barrierefreiheit

- [ ] Alle Schalter haben `role="switch"`, `aria-checked` und ein `aria-label` (z. B. „Du bist am Zug per Push“, „Frist läuft bald ab per E-Mail“, „Stumm“, „Einheiten ziehen“).
- [ ] Segment-Buttons sind `role="radiogroup"` mit `aria-label` („Nach Ergebnis filtern“, „E-Mail-Verzögerung“, „Farbschema“, „Rechte Maustaste“) und Optionen mit `role="radio"` und `aria-checked`.
- [ ] Regler haben `aria-label` („Gesamtlautstärke“, „Effekte“, „Musik“, „Umgebung“, „Zoom-Empfindlichkeit“).
- [ ] Die Fraktionsauswahl hat das versteckte Label „Nach Fraktion filtern“.
- [ ] Alle Textfelder sind über `<label>` beschriftet; Passwortfelder haben passende `autoComplete`-Werte (`current-password`, `new-password`), das E-Mail-Feld `email`.
- [ ] Rubriken-Navigation hat `aria-label="Rubriken"`, aktive Rubrik `aria-current="page"`; der Inhaltsbereich ist `aria-live="polite"`.
- [ ] „Gespeichert“ wird über `role="status"` angesagt.
- [ ] Dialoge: `role="dialog"`, `aria-modal="true"`, `aria-label` = Titel; Schließen-Button mit `aria-label="Schließen"`; Escape schließt; Fokus wird beim Öffnen in den Dialog gesetzt, darin gehalten und beim Schließen zurückgegeben.
- [ ] Wappen haben `aria-label`/`alt` „Wappen <Fraktionsname>“; das Avatar-Bild ist dekorativ (`alt=""`).
- [ ] Alle Bedienelemente sind per Tab erreichbar und mit Enter/Leertaste auslösbar; Schalter haben einen sichtbaren Teal-Fokusring.
- [ ] Touch-Ziele sind mindestens 44 px hoch.

---

## Beispiel-Testdaten

```typescript
import type { ProfilProps, EinstellungenProps, Faction, Settings } from './types'

const factions: Faction[] = [
  { id: 'eisenbund', name: 'Eisenbund von Valdrin', shortName: 'Eisenbund', color: 'amber', emblemUrl: '/art/factions/eisenbund-emblem.png' },
  { id: 'aurelia', name: 'Aurelische Republik', shortName: 'Aurelia', color: 'rose', emblemUrl: '/art/factions/aurelia-emblem.png' },
  { id: 'salzkueste', name: 'Salzküsten-Liga', shortName: 'Salzküste', color: 'lime', emblemUrl: null },
]

// Befülltes Profil
export const profilBefuellt: ProfilProps = {
  profile: { id: 'you', displayName: 'Björn', avatarUrl: null, memberSince: '2026-06-12T00:00:00Z', favoriteFactionId: 'eisenbund' },
  stats: { gamesPlayed: 23, wins: 11, citiesCaptured: 187, unitsBuilt: 642, longestGameRounds: 131 },
  factionStats: [
    { factionId: 'eisenbund', gamesPlayed: 12, wins: 8 },
    { factionId: 'aurelia', gamesPlayed: 6, wins: 2 },
    { factionId: 'salzkueste', gamesPlayed: 0, wins: 0 },
  ],
  history: [
    { id: 'h1', name: 'Rußige Pfade', endedAt: '2026-10-27T21:10:00Z', result: 'victory', placement: 1, playerCount: 3, rounds: 48, factionId: 'eisenbund', opponents: ['Lena Hartmann', 'Zechenmeister Brandt (KI)'] },
    { id: 'h3', name: 'Testlauf', endedAt: '2026-10-19T08:02:00Z', result: 'surrendered', placement: 4, playerCount: 4, rounds: 7, factionId: 'aurelia', opponents: ['Mira Okonkwo', 'Tobias Brenner', 'Graf Ostrow (KI)'] },
  ],
  hasMoreHistory: true,
  factions,
}

// Neuer Spieler ohne Partien
export const profilLeer: ProfilProps = {
  profile: { id: 'new', displayName: 'Neuling', avatarUrl: null, memberSince: '2026-10-30T00:00:00Z', favoriteFactionId: null },
  stats: { gamesPlayed: 0, wins: 0, citiesCaptured: 0, unitsBuilt: 0, longestGameRounds: 0 },
  factionStats: factions.map((f) => ({ factionId: f.id, gamesPlayed: 0, wins: 0 })),
  history: [],
  hasMoreHistory: false,
  factions,
}

const settings: Settings = {
  notifications: {
    yourTurn: { push: true, email: true },
    deadlineSoon: { push: true, email: false },
    invitation: { push: true, email: true },
    matchEnded: { push: false, email: false },
    emailDelayHours: 6,
  },
  display: { theme: 'system', reduceMotion: false, combatAnimations: true, autoplayReplay: true },
  sound: { muted: false, master: 80, effects: 70, music: 40, ambience: 55 },
  controls: { rightClick: 'cancel', confirmEndTurn: true, dragUnits: true, zoomSensitivity: 50 },
}

// Einstellungen, Push blockiert, stummgeschaltet, nur ein Gerät
export const einstellungenBlockiert: EinstellungenProps = {
  settings: { ...settings, sound: { ...settings.sound, muted: true } },
  account: { email: 'bjoern@example.de', activeSessions: 1 },
  displayName: 'Björn',
  pushPermission: 'denied',
}
```
