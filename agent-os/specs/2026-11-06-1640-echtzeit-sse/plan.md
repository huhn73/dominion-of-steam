# Echtzeit per Server-Sent Events

## Context

Lobby (15 s), Warteraum (4 s) und Partie (5 s beim Warten) fragten regelmäßig nach. Züge anderer kamen deshalb verzögert an, und der Server bekam viele leere Anfragen. Roadmap Phase 2, Punkt „Echtzeit“.

## Task 1: Signalbus (`apps/server/src/realtime/`)

- `signals.ts`: `signal(tx, playerIds, topics)` per `pg_notify('dos_signal', …)` in der Transaktion, dazu `signalMatch` (alle Teilnehmer, der Handelnde nur `lobby`) und `signalRoom` (Gastgeber und alle Plätze).
- `hub.ts`: LISTEN auf derselben postgres.js-Instanz (`db.$client`), erst beim ersten Stream; verteilt an `Map<playerId, Set<listener>>`; nach einem Reconnect bekommt jeder Stream `resync`.

## Task 2: Route `GET /api/events` (`routes/events.ts`)

- Anmeldung nötig, `reply.hijack()` (an der Kompression vorbei), `text/event-stream`, erste Nachricht `ready`, alle 25 s ein Kommentar; eine abgelaufene Sitzung beendet den Stream.

## Task 3: Signale an den Schreibstellen

- Befehle und Dev-„Für andere weiterspielen“ (`matches/service.ts`), abgelaufene Fristen (`lobby/sweeper.ts`), Aufgeben, Einladung annehmen und ablehnen, Beitreten, Einladungslink, Bereit, Start, Verlassen und Auflösen (`lobby/service.ts`), neue Partie mit Einladungen (`setup/service.ts`). Das Tutorial sendet nichts.

## Task 4: Client

- `data/events.ts`: `ServerEvents` (in `RequireAuth`, je Konto neu) öffnet `EventSource('/api/events')` und macht je Thema die Abfragen ungültig; nach einem Wiederverbinden alles. Gibt der Browser auf, folgt nach 30 s ein neuer Versuch.
- `useServerEventsConnected()` steuert das Polling: verbunden nur die Lobby alle 2 Minuten, sonst die alten Intervalle.

## Task 5: Tests

- Server (`realtime/realtime.test.ts`, echte Datenbank): Rollback sendet nichts, Warteraum und Start, Zug an den Mitspieler, SSE-Endpunkt mit Kopfzeilen ohne Kompression.
- Client (`data/events.test.tsx`): Themen auf Abfragen, Rückfall und Resync, neuer Versuch und Schließen beim Abmelden.
