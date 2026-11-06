# Tutorial-Mission „Erste Schritte“

## Context

Dominion of Steam hat bisher kein Onboarding: Wer neu ist, landet direkt in einer generierten Partie, ohne Erklärung von Bedienung (Auswählen, Ziehen, Kamera, Zugende, Produktion, Frachter, Flugzeuge) oder Siegziel. Ziel ist eine **geführte Mini-Partie** auf einer handgebauten Karte gegen einen passiven Gegner. Die Schritte prüfen jeweils, ob die Aktion ausgeführt wurde, und führen bis zum Sieg. Man startet sie über einen Button in der Lobby, neue Konten bekommen sie beim ersten Login angeboten. Tutorial-Partien zählen nirgends in Statistiken mit.

Spec-Ordner: `agent-os/specs/2026-11-06-1453-tutorial-mission/`

## Entscheidungen aus dem Shaping

- **Form:** geführte Mini-Partie mit Zielprüfung. Man darf frei handeln und jederzeit „Überspringen“ oder „Tutorial beenden“ wählen; es gibt keine harte Sperre.
- **Karte:** handgebaut und immer gleich (nach dem Muster von `engine/demo.ts`), etwa 16×12 Felder, mit Heimatinsel, neutraler Stadt und Feindinsel.
- **Inhalte:** Grundbedienung, Städte & Produktion, See & Luft, Kampf & Siegziel.
- **Gegner:** passive KI. Sie zieht nicht, produziert nicht und kapituliert nicht, verteidigt nur ihre Garnison. Das Tutorial kann so nicht scheitern.
- **Einstieg:** Karte „Tutorial“ in der Lobby (starten oder fortsetzen) und Angebot beim ersten Login (Konto ohne Partien, nicht abgelehnt).
- **Statistik:** Tutorial-Partien erscheinen nicht in Profil-Bilanz, Partieverlauf, Admin-Übersicht und Benachrichtigungen. Gespeichert wird nur der Haken „Tutorial abgeschlossen“.
- **Standards:** Es gelten die Repo-Konventionen (siehe unten); dazu kommt ein Roadmap-Eintrag in Phase 2.

## Task 1: Spec-Dokumentation speichern

`agent-os/specs/2026-11-06-1453-tutorial-mission/` anlegen mit:
- **plan.md**: dieser Plan
- **shape.md**: Umfang, Entscheidungen (siehe oben), Kontext: keine Visuals, Referenzen, Produktbezug zu mission.md (Veteranen, Maus und Touch)
- **standards.md**: Repo-Konventionen wie in den früheren Specs:
  - Prettier ohne Semikolons, einfache Anführungszeichen, Zeilenbreite 100
  - TS strict, Typecheck je Paket
  - Einstellungen nur über `MatchPage`/`BoardSettingsLayer`
  - Vitest und Testing Library
- **references.md**: `engine/demo.ts` + `demo-data.json`, `setup/service.ts#createSolo`, `matches/service.ts#runAITurns`, `admin/service.ts` (`realMatch`-Filter), `Spielfeld.tsx`, Dialog-Sheets (`lobby/components/shared.tsx`), `pages/shared/toast.tsx`
- **visuals/**: leer

## Task 2: Tutorial-Welt und Schrittmodell in `packages/shared`

- `game/engine/tutorial.ts` mit `seedTutorial(id, playerId, now)`: baut einen `GameState` wie `seedDemo`. Startlage:
  - Spieler (Eisenbund) mit Hauptstadt, 2 Grenadieren, 1 Panzerwagen, 1 Frachter im Hafen und 1 Doppeldecker
  - neutrale Stadt in 2–3 Feldern Entfernung
  - Feindinsel über einen Meeresarm, mit Hauptstadt und einer schwachen Garnison
  - Regeln: `live`, ohne Zeitlimit, Siegbedingung `elimination`, kein Rundenlimit
  - Die Karte wird als Code oder JSON-Layout definiert (Terrain-Strings statt Tile-Listen, gut lesbar).
- Neues optionales Feld `GameState.tutorial?: { step: number; skipped?: boolean }`.
- `game/tutorial/steps.ts` legt die Schrittliste fest. Jeder Schritt hat `id`, `title`, `text` (Deutsch), optional `focus` (Feld oder UI-Element) und `done(state, playerId)`. Reine Textschritte haben kein `done` und werden mit „Weiter“ bestätigt.
  1. Willkommen & Ziel: Feindhauptstadt erobern bzw. alle Gegner ausschalten
  2. Kamera: ziehen, zoomen, F zum Einpassen, Minikarte
  3. Einheit auswählen und bewegen (Log-Eintrag `move`)
  4. Nächste Einheit (N) und Zug beenden (Runde ≥ 2)
  5. Rundenbericht lesen (Text)
  6. Neutrale Stadt erobern (Stadt gehört dem Spieler)
  7. Produktion festlegen (`production` gesetzt in der eroberten Stadt)
  8. Flugzeug erkunden, Treibstoff und rote Felder (Feindhauptstadt im `knownBy`)
  9. Frachter beladen (Einheit an Bord)
  10. Übersetzen und entladen (Landeinheit auf der Feindinsel)
  11. Angriff (Log-Eintrag `attack`)
  12. Feindhauptstadt erobern: Sieg, Abschlusskarte
- Neue Commands `tutorialNext` und `tutorialSkip` im `Command`-Union (`game/view.ts`), umgesetzt in `engine/commands.ts`. Nach jedem angewandten Command setzt `advanceTutorial(state)` den Schritt weiter, solange `done` erfüllt ist. Der Schritt steigt nur monoton.
- `projectView` (`engine/view.ts`) gibt `tutorial: { step, total, current }` an den Client weiter.
- **Passive KI:** In `playAITurn` (`engine/ai.ts`) beendet die Persönlichkeit `tutorial` den Zug sofort. Die Kapitulationsprüfung wird für sie übersprungen.
- Tests in `engine/__tests__/tutorial.test.ts`:
  - Welt ist gültig: alle Städte auf Land, Frachter auf Wasser
  - Jedes `done` wird durch die passende Command-Folge erfüllt
  - Kompletter Durchlauf per Commands bis `winnerId === Spieler`
  - Passive KI zieht nicht

## Task 3: Server

- `apps/server/src/tutorial/service.ts` und Route `POST {API_PREFIX}/tutorial`:
  - Ist eine laufende Tutorial-Partie des Spielers vorhanden (Id `tutorial-<playerId>`), wird sie zurückgegeben. Sonst wird eine neue angelegt (`insertMatch` + `matchSeats` wie bei der Demo bzw. `createFromDraft`).
  - `?neu=1` löscht die alte Partie und startet neu.
- `runAITurns` braucht nichts Besonderes; die Passivität steckt in der Engine.
- Tutorial-Partien ausschließen (Prädikat `id LIKE 'tutorial-%'` neben `DEMO_MATCH_ID` zentral als Helper):
  - Admin `realMatch`
  - Profil-Bilanz und Partieverlauf (`apps/server/src/profile/`)
  - Lobby-Listen „Meine Partien“ und „Beendet“ (`apps/server/src/lobby/`); die Lobby bekommt stattdessen ein eigenes Feld `tutorial: { matchId, status } | null`
  - Benachrichtigungen, Push und E-Mail (`notifications/`)
- Spieler-Einstellungen (`players.settings`) bekommen `tutorial: { completed?: boolean; dismissed?: boolean }`. Beim Sieg im Tutorial wird `completed` gesetzt.
- Tests: Anlegen und Fortsetzen, Neustart, Ausschluss aus Lobby, Profil und Admin, `completed` nach Sieg.

## Task 4: Tutorial-Panel im Spielfeld (Web)

- `sections/spielfeld/components/TutorialPanel.tsx`: nicht blockierende Karte unten links (auf Mobil unten über der Aktionsleiste, einklappbar). Inhalt:
  - Schritt X/Y, Titel, Text, Tastenhinweise
  - Buttons „Weiter“ (nur Textschritte), „Überspringen“ und „Tutorial beenden“ (zur Lobby)
  - Stil wie die bestehenden Sheets, Ton über den vorhandenen Dialog- bzw. Cue-Mechanismus
- **Fokus:** `HexMap` bekommt die Prop `highlight?: HexCoord` für einen pulsierenden Ring. UI-Ziele wie „Zug beenden“, Produktion oder Minikarte werden über `data-tutorial="…"`-Attribute angesprochen und per CSS-Klasse hervorgehoben.
- `MatchPage.tsx` liest `view.tutorial` und reicht Panel-Props an `Spielfeld` durch. `tutorialNext` und `tutorialSkip` laufen über `useMatchCommand`.
- Beim Wechsel des Schritts erscheint ein kurzer Toast „Geschafft!“ (`useToast`).
- `Partieabschluss` zeigt im Tutorial einen eigenen Text („Tutorial abgeschlossen – bereit für deine erste echte Partie“) mit Buttons „Neue Partie“ und „Zur Lobby“.
- Tests (Vitest + Testing Library): Panel rendert den Schritt, „Weiter“ sendet den Command, `highlight` setzt den Ring.

## Task 5: Einstieg in der Lobby

- `sections/lobby/components/Lobby.tsx` bekommt die Karte „Tutorial: Erste Schritte“ mit den Zuständen starten, fortsetzen und „Abgeschlossen ✓ · nochmal spielen“. Neuer Hook `useStartTutorial` in `apps/web/src/data/`, danach Navigation auf `/partie/:id`.
- **Erstangebot:** Hat das Konto keine Partien und ist `tutorial.completed`/`dismissed` nicht gesetzt, öffnet die Lobby einmalig ein Sheet „Neu hier?“ mit „Tutorial starten“ und „Später“ („Später“ setzt `dismissed`). Die Abfrage liegt in der Lobby-Seite, nicht über dem Router (siehe Memory zum Query-Cache).
- Tests in `Lobby.test.tsx`: Karte, Erstangebot, „Später“.

## Task 6: Doku und Roadmap

- `agent-os/product/roadmap.md`, Phase 2: Eintrag „Tutorial-Mission“ mit Spec-Verweis.
- Kurzer Abschnitt in `docs/ENTWICKLUNG.md`: wie die Tutorial-Karte und die Schritte gepflegt werden.

## Verifikation

- `pnpm --filter @dos/shared test`, `--filter @dos/server test`, `--filter @dos/web test`; Typecheck je Paket einzeln (nicht `pnpm -r typecheck`).
- `pnpm lint`.
- Manuell: App lokal starten (Skill `run`) und mit neuem Konto einloggen:
  - Erstangebot erscheint
  - Tutorial komplett bis zum Sieg spielen, auf Desktop und in mobiler Breite
  - Abbrechen und Fortsetzen aus der Lobby
  - Profil und Admin zeigen keine Tutorial-Partie
- Optional: Screenshots per Playwright für die Spec (Memory „Spec-Screenshots per Playwright“).
