# Plan: Spielabschluss – Ergebniskarte am Ende einer Partie

## Context

Beim Playtest (Sieg gegen die KI in Runde 93) kam die Siegesmusik, danach blieb das Spielfeld bei „Warte auf Gegner“ mit Sanduhr stehen. Ursache: Der Server liefert `view.result` (`winnerId`, `endedAt`, `placements`), aber kein Client-Teil außer dem Ton wertet es aus. Die Design-Übergabe des Spielfelds endet beim Zugende; eine beendete Partie erscheint als Phase `waiting` (`packages/shared/src/game/engine/view.ts:107`), darum zeigen Kopfzeile (`gameHeaderFor`) und Warte-Banner weiter „Warte auf …“, und `useMatchView` pollt alle 5 s weiter. Shaping-Entscheidungen:

- **Ergebniskarte über der Karte** im Stil des Rundenberichts (Bottom-Sheet mobil, Karte links oben am Desktop), mit Stempel „Sieg“ (Teal) / „Niederlage“ (Rose) / „Aufgegeben“ (Stone) wie im Lobby-Tab „Beendet“.
- **Inhalt: Platzierungen + Kennzahlen.** Rangliste aller Teilnehmer nach `result.placements`: Platz, Wappen und Name, „KI“-Kennzeichnung, Städte, Einheiten, Punkte (Städte × 3 + Einheiten, dieselbe Formel wie `score()` in `engine/victory.ts`), ausgeschiedene Teilnehmer gedämpft mit „ausgeschieden“. Eigene Zeile hervorgehoben. `Participant.cityCount`/`unitCount` kommen für alle Teilnehmer aus dem Spielstand (`view.ts:63-64`), nicht aus der Sicht, sind also am Ende vollständig.
- **Karte erscheint bei jedem Öffnen** einer beendeten Partie; „Karte ansehen“ schließt sie für diese Ansicht, eine Pille „Beendet · Sieg“ mit „Ergebnis“ ersetzt das Warte-Banner und öffnet die Karte wieder. „Zur Lobby“ navigiert zur Lobby.
- **Keine Vorlagen**; Stil aus `Rundenbericht.tsx` (Rahmen, Kopf, Fußzeile mit `primary`/`secondary`) und `Lobby.tsx` `RESULT_STAMP` (Stempel-Klassen werden übernommen, die Lobby-Komponente bleibt unverändert).

Erkenntnisse aus der Erkundung:

- `MatchResult` (`packages/shared/src/game/types.ts:51-57`), `Participant` (`59-70`: `id, name, isYou, isAI, aiDifficulty, factionId, color, status 'active'|'eliminated', cityCount, unitCount`). Wer aufgibt, behält Sitz und `isYou`, wird `isAI` und heißt „KI für <Name>“ (`engine/surrender.ts`). Daraus ergibt sich der eigene Ausgang: Sieger → `victory`, eigener Teilnehmer `isAI` → `surrendered`, sonst `defeat`.
- `Spielfeld.tsx`: `canAct = match.phase === 'yourTurn' && !combatPlay` (Z. 96) sperrt die Aktionsleiste bereits; Warte-Banner Z. 934-941; Rundenbericht-Overlay Z. 861-872 (`absolute inset-x-0 bottom-0 z-30 md:… md:left-4 md:top-20 md:w-[26rem]`); `Trophy` ist importiert; `PARTICIPANT_HEX[p.color].base` für Teilnehmerfarben; `FactionEmblem` aus `sections/fraktionen/components`.
- Props-Typ `SpielfeldUndZuegeProps` (`sections/spielfeld/types.ts:41`) kennt weder `result` noch `rules`; `MatchPage` reicht `{...view}` durch.
- `MatchPage.tsx` nutzt noch kein `useNavigate`. `data/match.ts`: `refetchInterval` hängt nur an `phase === 'waiting'`; `gameHeaderFor` ohne Abschluss-Zweig.
- Tests: `MatchPage.test.tsx:184-192` baut eine Sieg-Ansicht mit `demoView()` und `view.result = …`; `sections/spielfeld/Spielfeld.test.tsx` rendert mit `renderBoard(overrides)` aus `sample-data.json`.
- Screenshots: Demo-Partie per psql auf `status: 'finished'`, `winnerId`, `placement` je Teilnehmer und `endedAt` patchen (Memory-Notiz), danach Demo zurücksetzen.

## Task 1: Spec-Dokumentation

`agent-os/specs/2026-10-31-HHMM-spielabschluss/`: `plan.md`, `shape.md` (Entscheidungen, Ausgangs-Logik, Aufbau der Karte, Abweichung von der Übergabe: neue Props `result`/`onLeave`), `standards.md` (Repo-Konventionen, Design-Übergabe nur minimal anfassen), `references.md` (Rundenbericht, Lobby-Stempel, `finishMatch`, Tests), `visuals/` (Ergebniskarte Desktop und mobil, Pille nach „Karte ansehen“, Kopfzeile).

## Task 2: Gemeinsame Logik (`packages/shared/src/game/`)

- `view.ts`: `export type MatchOutcome = 'victory' | 'defeat' | 'surrendered'` und `matchOutcome(view: Pick<PlayerView, 'match' | 'participants' | 'result'>): MatchOutcome | null` (null solange `result` fehlt oder der Betrachter nicht teilnimmt). `participantScore(p: Participant) = p.cityCount * 3 + p.unitCount` neben `score()` in `victory.ts` (oder `score` so umbauen, dass beide dieselbe Hilfsfunktion nutzen). Test in `packages/shared/src/game/engine/*.test.ts` oder neuem `view.test.ts`: Sieger, Verlierer, Aufgegeben (eigener Teilnehmer `isAI`), kein Ergebnis.

## Task 3: Ergebniskarte (`apps/web/src/sections/spielfeld/components/Partieabschluss.tsx`)

- Props: `match` (Name, Runde, `youId`), `participants`, `factions`, `result`, `onViewMap`, `onLeave`.
- Aufbau wie `Rundenbericht`: `<section role="dialog" aria-labelledby>`; Kopf mit `Trophy` (Sieg, Teal) bzw. `Flag` (Niederlage/Aufgegeben), Überschrift „Sieg“ / „Niederlage“ / „Aufgegeben“ in Big Shoulders, Unterzeile „<Partiename> · beendet in Runde N“, rechts der gedrehte Doppelrahmen-Stempel (Klassen aus `RESULT_STAMP`). Body: Tabelle (`<table>` mit sichtbaren Spaltenköpfen Platz, Teilnehmer, Städte, Einheiten, Punkte), Zeilen nach `placements` sortiert, eigene Zeile mit `bg-amber-50 dark:bg-amber-950/30`, Wappen `FactionEmblem` in Teilnehmerfarbe, „KI“-Chip bei `isAI`, `status === 'eliminated'` → Zeile gedämpft, Kennzahlen „–“ und Vermerk „ausgeschieden“; ohne Sieger (alle Menschen weg) Hinweis „Kein Sieger“. Fußzeile: „Karte ansehen“ (`secondary`) und „Zur Lobby“ (`primary`, `Home`-Icon).
- Datei liegt im Übergabe-Ordner (`.prettierignore`), Stil der Nachbardateien beibehalten.

## Task 4: Einbau ins Spielfeld (`sections/spielfeld/`)

- `types.ts`: `result?: MatchResult | null`, `onLeave?: () => void` in `SpielfeldUndZuegeProps`.
- `Spielfeld.tsx`: State `resultOpen` (true; zurück auf true, wenn `match.id` oder `result?.endedAt` wechselt). Render: bei `result && resultOpen` das Overlay in demselben Wrapper wie der Rundenbericht (`z-30`), Rundenbericht in dem Fall nicht anzeigen. Warte-Banner nur, wenn `match.phase === 'waiting' && !result`; stattdessen Pille „Beendet · Sieg“ (Farbe nach Ausgang) mit Button „Ergebnis“ (`onClick={() => setResultOpen(true)}`), wenn `result && !resultOpen`. Aktionsleiste: Buttons bleiben deaktiviert (`canAct` ist false), Beschriftung „Zug beenden“ wird bei `result` zu „Partie beendet“ (disabled). Turn-Report-Effekt und Zugbeginn-Ton laufen bei `result` nicht (Phase ist `waiting`, bereits ausgeschlossen).
- `MatchPage.tsx`: `useNavigate`, `onLeave={() => navigate(routes.lobby)}`; `result` kommt über `{...view}` und ist jetzt typisiert.

## Task 5: Kopfzeile und Polling (`apps/web/src/data/match.ts`)

- `gameHeaderFor`: bei `view.result` → `status: 'Beendet · Sieg' | 'Beendet · Niederlage' | 'Beendet · Aufgegeben' | 'Beendet'` (über `matchOutcome`), `isYourTurn: false`, Titel unverändert.
- `useMatchView`: `refetchInterval` false, sobald `data.result` gesetzt ist.
- `GameLayout`: `canSurrender` prüft `result` schon; nichts zu tun.

## Task 6: Tests

- `packages/shared`: `matchOutcome` (Sieg, Niederlage, Aufgegeben, kein Ergebnis), `participantScore`.
- `apps/web/src/data/match.test.ts` (falls vorhanden, sonst neu): `gameHeaderFor` mit Ergebnis → „Beendet · Sieg“.
- `sections/spielfeld/Spielfeld.test.tsx`: `renderBoard({ result })` → Dialog „Sieg“ mit Tabellenzeilen in Platzreihenfolge und Kennzahlen, kein Warte-Banner, „Karte ansehen“ schließt und zeigt die Pille, „Ergebnis“ öffnet wieder, „Zur Lobby“ ruft `onLeave`; eigene Zeile markiert (`aria-current` oder Text „du“); ausgeschiedener Teilnehmer gedämpft.
- `pages/MatchPage.test.tsx`: beendete Demo-Ansicht → Dialog sichtbar, „Zur Lobby“ wechselt auf `/`; Kopfzeile zeigt „Beendet · Sieg“; bestehender Sieg-Ton-Test bleibt grün.

## Task 7: Dokumentation

- `README.md`: Absatz unter „Spielfeld-Bedienung“ oder „Rundenbericht“: Partieabschluss (Karte, Pille, Kopfzeile, Polling endet).
- `agent-os/product/roadmap.md`: Phase 2 Eintrag ~~Spielabschluss~~ umgesetzt mit Spec-Pfad.
- `product-plan` bleibt unverändert; neue Props stehen in `shape.md`.

## Verifikation

- `pnpm lint`, `pnpm typecheck`, `pnpm test` grün.
- Dev-Server: Demo-Partie per psql auf `finished` patchen (Sieger p1, Platzierungen, `endedAt`), `/partie/demo` öffnen: Ergebniskarte mit Rangliste, Kopfzeile „Beendet · Sieg“, kein Warte-Banner, Siegesmusik nur beim ersten Öffnen (Session-Merker), kein weiteres Polling im Netzwerk-Tab; „Karte ansehen“ → Pille „Beendet · Sieg“ + „Ergebnis“; „Zur Lobby“ → Lobby. Zweite Variante mit Sieger KI → „Niederlage“. Danach Demo zurücksetzen.
- Screenshots Desktop (1280) und mobil (390) in `visuals/`.
