# Plan: Inselbalance, Träger und Tauchboot-Tarnung

## Context

Nach der Inselwelt-Spec gewann Aurelia Inselduelle 80–88 %, weil die Blitzkorvette als Standard-Geleitschutz Frachter samt Ladung versenkte; „leicht“ lag auf dem Kontinent bei 31 % (Ziel 15–30 %). Der Spieler hat dazu zwei Regeln festgelegt: Flugzeugträger sind Basis für Flugzeuge, Tauchboote sind nur sichtbar, wenn man gegen sie fährt oder selbst ein Tauchboot ist.

## Entscheidungen

Siehe `shape.md`.

## Task 1: Spec-Dokumentation

Dieser Ordner; Nachzug `agent-os/product/ki-balance.md` („Nachmessung Inselbalance“), `roadmap.md` (Punkt 11 umgesetzt), `ki-simulation/README.md`, README (Kampfregeln: Tarnung, Träger), Kompendium-Text des Tauchboots.

## Task 2: Geleitschutz und „leicht“ (`engine/ai.ts`)

- Geleit: Kanonenboot je Frachter; See-Sondereinheit nur mit `specialShare` (normal 0, schwer 0,15, „Seekrieg“ +0,15).
- `SKIP_SHARE.easy` 0,15 → 0,2.
- Einheiten, die andere eigene Städte gerade bauen, zählen bei Frachtern, Geleit und Trägern mit (`building`). Bisher legte jede freie Küstenstadt gleichzeitig dasselbe auf: 7,5 Träger und 7,6 Frachter je Partie.
- Weil die doppelten Frachter bisher die Inselstärke trugen, die Obergrenze neu gerastert (`sweep-transporte-hard.json`, `sweep-transporte-normal.json`, Referenz mit einem Frachter): normal mit zwei 66 %, schwer mit drei bis vier 74–84 %. Gesetzt: normal 2, schwer 3, „Seekrieg“ +1.

## Task 3: Träger als Flugbasis

Engine unverändert (Landen, Tanken, kein Absturz an Bord, Start; Test in `engine.test.ts`). KI: „schwer“ und „Luftkrieg“ bauen einen Träger, wenn ein Frachter und der volle Bomberverband (`maxBombers`) existieren und noch kein Träger da ist oder gebaut wird; er begleitet den Konvoi (`planWarship`), Bomber nutzen ihn über `airBases` als Rückkehrbasis.

## Task 4: Tauchboot-Tarnung

`engine/visibility.ts`: `STEALTH_UNIT_TYPES`, `hiddenFrom`, `seesUnit`. Verwender: `view.ts` (`projectBoard`, `revealedTo` nicht an den Client), `visibility.ts` (`sightingSnapshot`), `turn.ts` (Sichtungsbericht, Wachalarm, `startTurn` löscht `revealedTo`), `explore.ts` (Erkundungsstopp), `movement.ts` (`walk` setzt `revealedTo` beim Auflaufen, `logAction` ohne `seenBy` für Teilnehmer, die das Tauchboot nicht sehen). `state.ts`: `UnitState.revealedTo?`.

## Task 5: Tests

`engine/__tests__/tarnung.test.ts` (7 Tests): Tauchboot neben Kanonenboot unsichtbar, auch im Sichtungsbericht; eigenes Tauchboot ortet in zwei Feldern, in drei nicht; Auflaufen stoppt die Bewegung davor, meldet und macht angreifbar; Abtauchen beim Zugbeginn des Besitzers; keine Spur in der Wiedergabe; Aurelia geleitet normal mit Kanonenbooten, schwer auch mit Korvetten; Träger nur mit vollem Bomberverband. `ai.test.ts` angepasst.

## Verifikation

1. `pnpm --filter @dos/shared test` (210), `--filter @dos/web test` (252), `--filter @dos/server test` (72), `--filter @dos/sim test` (23), Typecheck je Paket, `pnpm lint`.
2. Serien auf Mittel: `stufen.json`, `fraktionen.json` (Kontinent), `inseln.json`, `inselwelt.json` (Inseln, 35 %, 150 Runden); Ergebnisse in `ki-balance.md`.
