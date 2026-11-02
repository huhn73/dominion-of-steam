# Meilenstein 1: Shell

> **Zusammen bereitstellen mit:** `product-overview.md`
> **Voraussetzungen:** keine

---

## Über diese Übergabe

**Was du bekommst:**
- Fertige UI-Designs (React-Komponenten mit vollständigem Styling)
- Produktanforderungen und Ablaufbeschreibungen
- Design-Tokens (Farben, Schriften)
- Beispieldaten, die die Datenform der Komponenten zeigen
- Test-Spezifikationen für das Verhalten aus Nutzersicht

**Deine Aufgabe:**
- Die Komponenten in deine Anwendung integrieren
- Die Callback-Props mit Routing und Geschäftslogik verbinden
- Beispieldaten durch echte Daten aus dem Backend ersetzen
- Lade-, Fehler- und Leerzustände umsetzen

Die Komponenten sind props-basiert: Sie bekommen Daten und lösen Callbacks aus. Wie Backend, Datenschicht und Geschäftslogik aufgebaut werden, entscheidest du.

---

## Ziel

Design-Tokens und Anwendungs-Shell einrichten, also den dauerhaften Rahmen um alle Bereiche, inklusive Spiel-Modus für das Spielfeld.

## Was umzusetzen ist

### 1. Design-Tokens

- Tailwind CSS v4 einrichten, dazu `tw-animate-css` für die Ein-Animationen
- Dunklen Modus über eine Klasse `.dark` an einem übergeordneten Element steuern. Die Einstellung „Farbschema“ (Hell, Dunkel, System) im Bereich Profil & Einstellungen setzt diese Klasse.
- Schriften laut `product-plan/design-system/fonts.md` laden
- Farben laut `product-plan/design-system/tailwind-colors.md`. `tokens.css` enthält die Werte als CSS-Variablen.

### 2. Anwendungs-Shell

Kopiere die Komponenten aus `product-plan/shell/components/` in dein Projekt:

- `AppShell.tsx`: Rahmen mit Menü- und Spiel-Modus
- `MainNav.tsx`: Top-Navigation bzw. mobile Tab-Leiste
- `UserMenu.tsx`: Avatar mit Dropdown

**Navigation verbinden:**

| Punkt | Ziel |
|---|---|
| Lobby | Lobby & Multiplayer (Startseite), Badge = Anzahl Partien mit „Du bist am Zug“ |
| Neue Partie | Partie-Setup & KI-Gegner |
| Fraktionen | Fraktionen & Einheiten |

Über das Benutzermenü erreichst du `onOpenProfile` (Profil) und `onOpenSettings` (Einstellungen), dazu `onLogout`.

**Spiel-Modus:** Für das Spielfeld `mode="game"` setzen und `gameHeader` füllen (Titel „<Partiename> · Runde <n>“, Status „Dein Zug · Frist …“, „Gegnerzüge“ oder „Warte auf Gegner“, `isYourTurn`). `onExitGame` führt zurück zur Lobby, `onOpenGameMenu` öffnet ein Spielmenü, das noch gestaltet werden muss (siehe unten).

**Benutzermenü:** braucht `user.name` und optional `user.avatarUrl`. Ohne Bild zeigt es Initialen.

## Offene Punkte

- **Spielmenü** (Button im Spiel-Modus): Inhalt ist noch nicht gestaltet, z. B. Partie-Details, Einstellungen, Aufgeben, zurück zur Lobby. Bis dahin genügt ein einfaches Menü mit diesen Einträgen.

## Referenzdateien

- `product-plan/design-system/`: Design-Tokens
- `product-plan/shell/README.md`: Gestaltungsabsicht der Shell
- `product-plan/shell/components/`: Shell-Komponenten
- `product-plan/shell/screenshot.png`: visuelle Referenz für den Menü-Modus

## Fertig, wenn

- [ ] Design-Tokens, Schriften und dunkler Modus sind eingerichtet
- [ ] Shell zeigt die Navigation, der aktive Punkt ist hervorgehoben
- [ ] Navigation führt zu den richtigen Routen, die Lobby ist Startseite
- [ ] Lobby-Badge zeigt die Anzahl der Partien, in denen der Spieler am Zug ist
- [ ] Benutzermenü zeigt Name bzw. Avatar und führt zu Profil, Einstellungen und Abmelden
- [ ] Spiel-Modus zeigt die kompakte Kopfleiste und lässt das Spielfeld die volle Höhe nutzen
- [ ] Auf dem Smartphone erscheint die Tab-Leiste unten, Inhalte werden nicht verdeckt
