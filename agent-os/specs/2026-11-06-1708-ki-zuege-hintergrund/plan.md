# KI-Züge als Hintergrundjob

## Context

Heute spielt `runAITurns` (`apps/server/src/matches/service.ts:64`) alle folgenden KI-Züge synchron innerhalb der Transaktion des menschlichen Befehls, die die Partie per `lockMatch` sperrt. Jeder KI-Zug darf bis zu 10 s dauern (`AI_TURN_BUDGET_MS`). Mit mehreren KIs auf großen Karten hängt das Zugende deshalb eine Minute und länger. Weil die KI im Haupt-Thread rechnet, blockiert sie außerdem den ganzen Server, also auch andere Partien und die SSE-Herzschläge. Seit der Echtzeit-Spec (`2026-11-06-1640-echtzeit-sse`) kann der Server dem Client melden, wann die KIs fertig sind. Damit kann die KI aus dem Request heraus.

Ziel: Das Zugende kommt sofort zurück. Die KIs ziehen danach in einem Worker-Thread, die Partie ist nur beim Speichern kurz gesperrt. Nach jedem KI-Zug geht ein Signal an alle Teilnehmer. Die Kopfzeile zeigt „‹Name› (KI) zieht …“.

Entscheidungen aus dem Shaping:
- Die Rechnung läuft in einem Worker-Thread (nach dem Muster von `packages/sim/src/pool.ts` und `worker.ts`), nicht im Haupt-Thread.
- Anzeige: Der Name der KI am Zug steht in der Kopfzeile. Rundenbericht und Wiedergabe bleiben wie bisher.
- Keine Bilder, keine `agent-os/standards/`.

## Task 1: Spec-Dokumentation speichern

`agent-os/specs/2026-11-06-1708-ki-zuege-hintergrund/` mit `plan.md` (dieser Plan), `shape.md` (Umfang, Entscheidungen, Kontext), `standards.md` („Es gibt kein `agent-os/standards/`; keine Standards angewandt.“) und `references.md` (Worker-Pool der Simulation, Sweeper, Signale, Notifier mit `kick`).

## Task 2: Markierung „KI am Zug“ in der Datenbank

- Migration `apps/server/drizzle/0008_ki_am_zug.sql`: Spalte `matches.ai_pending boolean not null default false` mit Teilindex `where ai_pending`. Beim Migrieren laufende Partien nachziehen, deren Teilnehmer am Zug eine KI ist (per jsonb oder einmalig im Code).
- Schema in `apps/server/src/db/schema.ts`. `columns(state)` in `matches/repository.ts` setzt `aiPending = status === 'running' && currentParticipant(state).isAI`. Damit stimmt die Spalte nach jedem `saveMatch` und `insertMatch` von selbst.

## Task 3: KI-Worker und Runner (`apps/server/src/ai/`)

- `worker.ts`: `parentPort` bekommt `{ state, aiId, now }`, ruft `playAITurn(state, aiId, now, { deadline: Date.now() + AI_TURN_BUDGET_MS })` auf und schickt den Zustand zurück oder einen Fehlertext (wie `packages/sim/src/worker.ts`). Start mit `execArgv: ['--import', tsx]`, weil der Server in Produktion mit `tsx` läuft.
- `runner.ts`: `createAiRunner(db, { notifier, workers, inline })` mit
  - `schedule(matchId)`: in die Warteschlange, ohne Doppelungen. Eine Partie steckt nie gleichzeitig in zwei Slots.
  - einem Pool aus `workers` Threads, Vorgabe `min(2, availableParallelism() - 1)`, mindestens 1, per `AI_WORKERS` einstellbar. Stirbt ein Worker, wird er neu gestartet.
  - einem Schritt je Partie:
    1. Partie **ohne Sperre** lesen, dazu `version`.
    2. Läuft sie nicht mehr oder ist keine KI am Zug: fertig. Greift `endIfNoHumans`: speichern wie in Schritt 4 und fertig.
    3. `playAITurn` im Worker. Bei Fehler oder Absturz beendet die KI den Zug einfach, wie heute (`console.error`, Zustand unverändert).
    4. Transaktion: `lockMatch`. Hat sich `version` inzwischen geändert (zum Beispiel durch Aufgeben oder Fristablauf), das Ergebnis verwerfen und neu einplanen. Sonst `finishTurn` (Zughistorie), `saveMatch`, `notifier.enqueue(turnNotifications(before, after))` und `signalMatch(tx, next)` an alle. Danach `notifier.kick()`.
    5. Ist danach wieder eine KI am Zug, kommt dieselbe Partie sofort wieder an die Reihe, nach vorne in die Schlange.
  - `inline: true` (Tests, Vorgabe bei `NODE_ENV === 'test'`) rechnet ohne Worker im Haupt-Thread. `idle()` liefert ein Promise, das auflöst, wenn die Schlange leer ist, damit Tests warten können.
  - `recover()`: plant alle Partien mit `ai_pending` ein. Wird beim Start und in jedem Sweep aufgerufen und fängt so Neustarts und verlorene Aufträge ab.
  - `close()` beendet die Worker, eingehängt in `onClose`.
- `now` ist die Zeit beim Start des KI-Schritts, nicht die des Menschen. Damit stimmen Fristen nach langen KI-Zügen.
- Das Verhalten der KI bleibt gleich: gleicher RNG im Zustand, gleiches Arbeitsbudget. Nur die Wanduhr-Grenze greift jetzt im Worker.

## Task 4: Aufrufer umstellen

`runAITurns` aus den Transaktionen entfernen. Stattdessen nach dem Commit `aiRunner.schedule(id)` aufrufen, wie bei `notifier.kick()`:
- `matches/service.ts` `execute`: Die Antwort zeigt den Zustand nach dem eigenen Zugende (Phase `waiting`). **Ausnahme Tutorial:** Dort bleibt `runAITurns` synchron, weil die Manöverleitung passiv ist und sofort fertig ist und das Tutorial keine Signale sendet.
- `lobby/service.ts`: `surrender`, `takeOver` (Kontolöschung) und `start`, falls eine KI beginnt.
- `lobby/sweeper.ts` `expireTurns`: nur menschliche Züge beenden, danach einplanen. Ist schon eine KI am Zug, überspringen, das erledigt der Runner. Zusätzlich `aiRunner.recover()` in `sweep`.
- `passForOthers` (Dev-Helfer) bleibt synchron mit `runAITurns`, nur in der Entwicklung.
- Verdrahtung in `app.ts`: `createAiRunner` neben dem Notifier, an Match-, Lobby- und Sweeper-Service übergeben, `app.decorate('aiRunner', …)`. In `index.ts` beim Start `recover()` aufrufen. Den Kommentar an `runAITurns` anpassen.

## Task 5: Anzeige im Client

- `packages/shared/src/game/types.ts` und `engine/view.ts`: `match.currentId` (Teilnehmer am Zug, `null` wenn beendet).
- `apps/web/src/data/match.ts` `gameHeaderFor`: In der Phase `waiting` mit einer KI am Zug lautet der Status „‹Name› (KI) zieht …“, sonst wie bisher „Warte auf Gegner“. Mit jedem SSE-Signal lädt die Ansicht neu, so wechselt der Name von KI zu KI. Kommt der Mensch wieder an die Reihe, folgen wie bisher Rundenbericht und Wiedergabe (`phase: 'replay'`).
- Polling ohne Stream: `POLL_WHILE_WAITING_MS` gilt schon für `waiting`, keine Änderung nötig.

## Task 6: Tests

- Server: Bestehende Tests, die nach dem Zugende KI-Züge erwarten (`app.test.ts`, `lobby/lobby.test.ts`, `realtime/realtime.test.ts`), warten vor dem Prüfen auf `app.aiRunner.idle()` und laden die Ansicht neu.
- Neu `ai/runner.test.ts` (echte Datenbank, `inline`):
  - Zugende kommt mit `waiting` zurück, nach `idle()` ist der Mensch wieder am Zug, die Zughistorie hat alle KI-Züge.
  - Ein Signal je KI-Zug.
  - Versionskonflikt: Aufgeben während des KI-Schritts verwirft das Ergebnis und plant neu.
  - `recover()` nimmt eine Partie mit `ai_pending` auf.
  - Ein KI-Fehler beendet nur den Zug.
  - Ein Worker-Rauchtest mit echtem Thread, eine kleine Karte, nach dem Muster von `packages/sim/src/__tests__/worker.test.ts`.
- Client: `gameHeaderFor` mit einer KI am Zug.
- Tutorial-Test bleibt grün, weil das Tutorial synchron bleibt.

## Task 7: Roadmap und Abschluss

- `agent-os/product/roadmap.md`, Phase 2: Eintrag „KI-Züge im Hintergrund“ als umgesetzt mit Spec-Pfad.
- Die Erinnerung `ai-turns-background-job` danach löschen und aus `MEMORY.md` entfernen.
- Commit auf `main`, Push auf `dev`. Live erst nach Rückfrage.

## Verification

- `pnpm lint`, Typecheck je Paket einzeln (`pnpm --filter ./apps/server typecheck`, `./apps/web`, `./packages/shared`), Tests von Server, Web und Shared.
- Manuell lokal (`pnpm dev`): Dev-Solo-Partie mit großer Karte und 3–4 KI-Gegnern starten, Zug beenden. Die Antwort kommt sofort, die Kopfzeile wechselt durch die KI-Namen, danach kommen Rundenbericht und Wiedergabe. Währenddessen eine zweite Partie in einem anderen Tab bedienen und prüfen, dass sie flüssig reagiert, also kein blockierter Server.
- Neustart des Servers mitten in den KI-Zügen: Nach dem Start (`recover()`) ziehen die KIs weiter.
