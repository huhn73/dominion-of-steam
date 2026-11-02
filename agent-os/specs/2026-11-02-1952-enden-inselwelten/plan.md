# Enden für Inselwelten: Vorherrschaft und Kapitulation der KI

## Context
Roadmap 1c, Punkt 12: Auf Inselwelten enden 89–98 % der Partien am Rundenlimit (`agent-os/product/ki-balance.md`, „Nachmessung Inselbalance“). Woran das liegt:
- Ausschalten oder Hauptstädte erobern verlangt eine Landung auf einer verteidigten Heimatinsel, und die gelingt selten.
- Die Punktwertung (3 je Stadt, 1 je Einheit) belohnt das Horten von Einheiten: „schwer“ steht nach 150 Runden bei etwa 11 Städten und 110 Einheiten.

Der Nutzer hat entschieden, zwei Enden einzuführen:
1. **Vorherrschaft** als vierte, eigene Siegbedingung. Wer mindestens **60 % aller Städte** (neutrale mitgezählt) **fünf eigene Runden** in Folge hält, gewinnt. Das Setup schlägt sie für Inselwelt und Archipel vor.
2. **KI kapituliert**, wenn sie klar verloren hat. Sie scheidet aus, ihre Einheiten verschwinden, und ihre **Städte werden neutral**.

Verworfen: neue Punktwertung und Großprojekt.

## Task 1: Spec-Dokumentation speichern
`agent-os/specs/2026-11-02-1952-enden-inselwelten/` mit:
- `plan.md`
- `shape.md`: Befund mit Messwerten, Entscheidungen, verworfene Optionen
- `references.md`
- `standards.md`: Vermerk, dass es kein `agent-os/standards/` gibt
- keine Visuals

## Task 2: Vorherrschaft in Engine und Typen
- `VictoryCondition` bzw. `VictoryConditionId` um `'dominance'` erweitern, in `packages/shared/src/game/types.ts` und `packages/shared/src/setup/types.ts`.
- Neue Konstanten in `game/rules.ts` oder `engine/victory.ts`: `DOMINANCE_SHARE = 0.6` und `DOMINANCE_TURNS = 5`.
- Neues Feld im Zustand `GameState.dominance?: { participantId: string; turns: number } | null`. `normalizeState` setzt bei alten Spielständen `null`.
- In `engine/victory.ts` eine neue Funktion `updateDominance(state, current)`. `endTurn` ruft sie in `engine/turn.ts` nach `updateEliminations` und vor `checkVictory` auf:
  - Hält der Ziehende am Ende seines Zuges mindestens 60 % aller Städte, zählt `turns` hoch. Dabei wird zurückgesetzt, wenn vorher ein anderer Teilnehmer geführt hat.
  - Fällt der Anteil darunter, wird `dominance` geleert.
- `checkVictory`: Bei `'dominance'` und `turns >= DOMINANCE_TURNS` endet die Partie mit `finishMatch(state, id)`.
- Ereignisse für alle Teilnehmer, als neuer `GameEventType` z. B. `dominance`:
  - beim Erreichen: „Admiral Kessler hält 62 % der Städte: Vorherrschaft in 5 Runden“
  - beim Herunterzählen
  - beim Brechen: „Die Vorherrschaft von … ist gebrochen“
- Die Sicht (`game/view.ts`) gibt `dominance` mit Name, Anteil und verbleibenden Runden heraus. Das sind öffentliche Informationen, Städtezahlen sind über die Rangliste ohnehin sichtbar.

## Task 3: Kapitulation der KI
- Neu in `engine/surrender.ts`: `capitulate(state, participantId, now)`.
  - Status `eliminated`, `eliminatedSeq` setzen.
  - Alle Einheiten des Teilnehmers entfernen, mitsamt Ladung.
  - Seine Städte werden neutral (`ownerId: null`), Schaden und Produktion zurücksetzen.
  - Ereignis `capitulated` an alle: „Admiral Kessler kapituliert. Seine Städte sind jetzt neutral.“
- Neu: `shouldCapitulate(state, p)`, nur für KI-Teilnehmer. Es müssen alle Bedingungen gelten:
  - Die eigene Starthauptstadt gehört einem Gegner.
  - Weniger als ein Viertel der Städte des Führenden.
  - Der Führende hat mindestens 6 Städte.
  - Mindestens Runde 20.
  Die Schwellen kommen als Konstanten in `rules.ts`.
- Geprüft wird zu Beginn des KI-Zuges, also in `startTurn` bzw. vor dem KI-Lauf. Danach folgen `updateEliminations` und `checkVictory`: Bleibt nur einer übrig, endet die Partie mit dessen Sieg.
- Das gilt auch für KI-Plätze aufgegebener Menschen („KI für …“). Deren Platzierung bleibt aus `p.surrender` erhalten.
- `endIfNoHumans` bleibt unverändert.

## Task 4: Setup, Lobby, Anzeige
- `packages/shared/src/setup/data.ts`: neue Option `{ id: 'dominance', label: 'Vorherrschaft', description: 'Gewonnen hat, wer fünf eigene Runden lang mindestens 60 % aller Städte hält.' }`. `victoryConditionLabel` funktioniert damit automatisch.
- Vorschlag je Weltform nach dem Muster von `roundLimitAfterSizeChange` (`setup/setup.ts:97`): Neu ist `victoryConditionAfterShapeChange(draft, nextShape)`.
  - Wechselt die Weltform auf `islands` oder `archipelago` und steht die Siegbedingung noch auf der Vorgabe (`capitals`), wird sie zu `dominance`.
  - Zurück auf `continent` und noch `dominance` aus dem Vorschlag: wieder die Vorgabe.
  - Aufgerufen wird das in `StepMap.tsx` neben `setMap({ worldShape })`.
- `StepRules.tsx` und `StepSummary.tsx` listen die Optionen schon dynamisch. Den Hinweistext prüfe ich.
- Spielfeld: In der Kopfzeile bzw. Statuszeile von `apps/web/src/sections/spielfeld/` kommt eine Pille „Vorherrschaft: Kessler · noch 3 Runden“, solange `view.dominance` gesetzt ist. Neue Ereignisse erscheinen im Ereignisprotokoll und im Rundenbericht (Abschnitt Städte), mit den Mustern aus dem Rundenbericht.
- Ergebniskarte (`Partieabschluss.tsx`): „Sieg durch Vorherrschaft“ bzw. „ausgeschieden (kapituliert)“, sofern sich das ohne neues Datenfeld ableiten lässt. Sonst bekommt `result` ein Feld `reason`.
- Server: kein Schema. Die Regeln liegen als JSON vor, die Prüfung läuft über `SETUP_OPTIONS`.

## Task 5: Simulation und Messung
- `packages/sim/src/config.ts`: `'dominance'` in `VICTORY` aufnehmen. Den Bericht (`report.ts`) um „Spielende: Vorherrschaft / Kapitulation / Ausschaltung / Rundenlimit“ erweitern, dazu „Ø Runde des Endes“.
- Neue Konfiguration `packages/sim/configs/inseln-vorherrschaft.json`: wie `inseln.json`, aber `victoryCondition: dominance`, Runden-Obergrenze 150. Zusätzlich Archipel und ein Kontinent-Vergleich.
- Messen und das Ergebnis in `agent-os/product/ki-balance.md` als „Nachmessung Enden“ eintragen. Ziele:
  - mindestens 50 % der Inselpartien enden vor dem Rundenlimit
  - Ø Ende zwischen Runde 80 und 140
  - „schwer“ gegen „normal“ weiter mindestens 65 %
  - keine Kapitulation vor Runde 40 im Mittel
- Die KI zielt nicht gesondert auf Vorherrschaft. Bleibt der Wert unter dem Ziel, gibt es eine Folge-Spec (zum Beispiel neutrale Inseln priorisieren).

## Task 6: Tests und Doku
- Engine-Tests in `packages/shared/src/game/engine/__tests__/`, für eine neue `enden.test.ts`:
  - Vorherrschaft zählt nur eigene Runden.
  - Ein Bruch setzt zurück, ein Führungswechsel startet neu.
  - Nach dem fünften Zug Sieg, nur mit `dominance`.
  - Kapitulation erst ab allen Schwellen: Städte werden neutral, Einheiten und Ladung verschwinden, der letzte Verbleibende gewinnt.
  - Menschen kapitulieren nie.
- Setup-Test für `victoryConditionAfterShapeChange` sowie Tests für Pille und Ereignis in der Web-Ansicht.
- Doku:
  - `docs/ENTWICKLUNG.md`: Siegbedingungen
  - `agent-os/product/roadmap.md`: 1c, Punkt 12 abhaken
  - Kompendium bzw. Hilfe, falls dort Siegbedingungen erklärt werden

## Verification
- `pnpm lint`, Typecheck je Paket, `pnpm test` in shared, sim, web und server (`TEST_DATABASE_URL`).
- `pnpm sim --config packages/sim/configs/inseln-vorherrschaft.json` mit den Zielwerten aus Task 5.
- Im Container: neue Partie mit Weltform Inseln anlegen. Das Setup schlägt „Vorherrschaft“ vor, im Spiel erscheinen Pille und Ereignisse. Die Demo-Partie per psql auf `dominance` setzen und testen (siehe Memory „Spec-Screenshots per Playwright“).
- Commit, dann `git push origin main:dev`.

> **Nachtrag nach der Messung:** Die Schwelle hängt von der Weltform ab, 50 % auf Inseln und Archipel, 60 % auf dem Kontinent (siehe `shape.md`). Bei Gleichstand behält der erste Halter die Vorherrschaft, bis sie bricht.
