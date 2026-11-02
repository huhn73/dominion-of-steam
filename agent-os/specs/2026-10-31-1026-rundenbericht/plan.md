# Spec: Rundenbericht (Playtest Runde 1, Spec 3)

## Context

Dritte Spec aus Playtest Runde 1 (`agent-os/product/playtest-runde-1.md`, Abschnitt „Spec 3“, Punkt 11; Roadmap Phase 1b Punkt 3). Beobachtung: Man sieht nicht, was der Gegner in seinem Zug gemacht hat. Zusatz aus der Startstädte-Prüfung: Eroberungen im Nebel bleiben unsichtbar, neu entdeckte Gegnerstädte sollen im Bericht stehen.

Heutiger Stand:
- **Ereignisse:** `addEvent` (`packages/shared/src/game/engine/state.ts:228`) legt `EventState` mit Empfänger, `seq`, `round` an. Typen (`game/types.ts:163`): `enemySighted | combat | cityLost | cityCaptured | unitBuilt | unitLost | fuelLow`. `enemySighted` entsteht nur bei Blockade (`movement.ts:52`) und bei Wache (`turn.ts:151`). **Es gibt kein Ereignis für neu entdeckte Städte, Besitzerwechsel oder neu in Sicht geratene Feinde.**
- **Sicht:** `projectView` (`engine/view.ts:67`) liefert `events` seit `viewer.lastTurnEndSeq` und `replay` aus `state.log` mit `seenBy[viewer]`, unabhängig von der Phase. `updateKnowledge` (`visibility.ts:39`) pflegt `explored` und `knownBy` **für alle** Teilnehmer bei jeder Bewegung und jedem Zugende, also ist am Zugbeginn kein Vorher/Nachher-Vergleich möglich; es fehlt ein Schnappschuss pro Spieler.
- **Zugbeginn im Client:** `Spielfeld.tsx:311-346` spielt bei `phase === 'replay'` die Wiedergabe sofort ab (Overlay „Gegnerzug · Name“, „Überspringen“); `MatchPage.tsx:41-53` überspringt sie automatisch, wenn `display.autoplayReplay` aus ist. `EventLog.tsx` ist eine flache Liste mit `R{round}`. Keine Zusammenfassung, keine Erkennung „mein Zug hat begonnen“.
- **Einstellungen:** `DisplaySettings` (`packages/shared/src/profile/types.ts:70`) mit `settingsOf`/`validateSettings` (`profile/index.ts`), UI in `sections/profil/components/Einstellungen.tsx:216-224`.

**Shaping-Entscheidungen (mit dem Nutzer abgestimmt):**
- **Darstellung: Berichtskarte vor der Wiedergabe.** Zu Zugbeginn öffnet sich eine Karte mit Abschnitten. Bei anstehender Wiedergabe: Button „Gegnerzüge ansehen“ startet das Replay, „Überspringen“ schließt Karte und Replay (`skipReplay`). Ohne Wiedergabe: „Weiter“. Einträge zentrieren die Karte (Karte bleibt offen, liegt seitlich bzw. als Bottom-Sheet).
- **Neue Ereignisse (Engine):** „Gegnerstadt entdeckt“/„Besitzer gewechselt“ (`cityDiscovered`) und „Gegner gesichtet“ (`enemySighted`) für Feindeinheiten, die zu Zugbeginn neu im Sichtbereich stehen. Dafür merkt sich jeder Teilnehmer am Ende seines Zuges, was er gesehen hat.
- **Gegnerbewegungen:** je Replay-Aktion eine Zeile „Panzer · Admiral Kessler → 5,7“ bzw. „greift an · Ergebnis“ / „erobert · Ergebnis“, Klick zentriert auf den Endpunkt. Keine erneute Wiedergabe aus dem Bericht.
- **Umfang:** Eigene Meldungen (`unitBuilt`, `fuelLow`) als Abschnitt „Eigenes Reich“. Ohne Ereignisse und ohne Replay erscheint kein Bericht (ruhige Runde still). Neue Einstellung „Rundenbericht zu Zugbeginn“ (`display.turnReport`, Standard an).
- **Out of scope:** Replay-Mechanik und -Overlay unverändert; keine Animationen im Bericht; keine Ereignisse für KI-Verhalten jenseits der Sicht; Spec 4 (Patrouille).

## Task 1: Save spec documentation

`agent-os/specs/2026-10-31-1026-rundenbericht/`: `plan.md` (dieser Plan), `shape.md` (Umfang, Entscheidungen, Abschnitte und Reihenfolge, Button-Logik je Phase/Einstellung, Schnappschuss-Regel), `standards.md` (keine Standards, Repo-Konventionen), `references.md` (Ereignis-Pipeline `addEvent`→`projectView`→`EventLog`; `logAction`/`snapshotVisibility` in `movement.ts:85-116` als Vorbild für Vorher/Nachher; Replay-Effekt `Spielfeld.tsx:311-346`; Zugende-Dialog `role="alertdialog"` `Spielfeld.tsx:860` als Dialog-Muster; `settingsOf`/`validateSettings`; Design-Übergabe `product-plan/sections/spielfeld-and-zuge/README.md:11,21`), `visuals/` mit Screenshots nach Umsetzung (`umsetzung-bericht.png` Karte vor Wiedergabe, `umsetzung-einstellung.png` Schalter).

## Task 2: Engine, Schnappschuss und neue Ereignisse (`packages/shared`)

- `game/types.ts`: `GameEventType` um `'cityDiscovered'` ergänzen.
- `engine/state.ts`: `ParticipantState.seenAtTurnEnd: { cities: Record<string, string | null>; unitIds: string[] } | null` (Doku: „Was der Teilnehmer am Ende seines letzten Zuges wusste: bekannte Städte mit Besitzer, sichtbare fremde Einheiten; Grundlage für den Rundenbericht“). `normalizeState`: `ps.seenAtTurnEnd ??= null`. Fixture `participantState` (`__tests__/fixtures.ts`) und `create.ts`/`demo.ts` (Teilnehmer-Anlage) ergänzen.
- `engine/visibility.ts`: `export function sightingSnapshot(state, participantId)` → `{ cities: Object.fromEntries(cities mit participantId in knownBy → knownBy[participantId]), unitIds: fremde Einheiten ohne carriedBy auf sichtbaren Feldern }` (nutzt `visibleTiles`).
- `engine/turn.ts`:
  - `endTurn`: nach `updateKnowledge(state)` `current.seenAtTurnEnd = sightingSnapshot(state, current.id)`.
  - `startTurn`: neue Funktion `reportSightings(state, p)` direkt nach dem ersten `updateKnowledge(state)` (vor `executeStandingOrders`, damit Wache-Meldungen danach kommen). Ohne Schnappschuss (`null`, erste Runde oder alter Spielstand) nichts tun. Sonst:
    - Städte: für jede Stadt mit `p.id in knownBy` und `knownBy[p.id] !== p.id`: vorher nicht im Schnappschuss → `cityDiscovered` „Stadt X entdeckt (Besitzer Y)“ bzw. „Freie Stadt X entdeckt“; vorher mit anderem Besitzer **und** vorheriger Besitzer ≠ `p.id` (sonst existiert schon `cityLost`) → `cityDiscovered` „X ist jetzt in der Hand von Y.“ bzw. „X ist jetzt frei.“ Nur Städte, die jetzt sichtbar sind oder deren Wissen sich geändert hat (Vergleich `knownBy[p.id]` gegen Schnappschuss reicht, weil `knownBy` nur bei Sicht aktualisiert wird).
    - Einheiten: fremde Einheiten (ohne `carriedBy`) auf aktuell sichtbaren Feldern, deren `id` nicht im Schnappschuss liegt, gruppiert je Feld: ein `enemySighted` pro Feld, „Feindliche Panzer (Admiral Kessler) bei 5,7 gesichtet.“ bzw. bei mehreren „Feindliche Einheiten bei 5,7 gesichtet: Panzer, Infanterie.“ Koordinate = Feld.
  - Ereignisse werden für alle aktiven Teilnehmer erzeugt (auch KI, wie bei Kämpfen; einfach und konsistent).
- `engine/demo.ts`: ein `cityDiscovered`-Ereignis in die Demo-Ereignisse aufnehmen (z. B. „Nebelkap ist jetzt in der Hand von Admiral Kessler.“ an einer bekannten Gegnerstadt), damit Bericht und Protokoll den Typ zeigen; `seenAtTurnEnd` der Demo-Teilnehmer `null`. Betroffene Zählungen in `engine.test.ts` („7 Ereignisse/6 neu“) und ggf. `MatchPage.test.tsx` anpassen.

## Task 3: Einstellung `display.turnReport`

- `packages/shared/src/profile/types.ts`: `turnReport: boolean`; `profile/index.ts`: Default `true`, `settingsOf` (`bool(d.turnReport, …)`), `validateSettings`-Schleife um `'turnReport'` erweitern.
- `apps/web/src/sections/profil/components/Einstellungen.tsx`: `SettingRow` „Rundenbericht zu Zugbeginn“ mit Beschreibung „Zu Beginn deines Zugs eine Zusammenfassung: Verluste, Gefechte, Städte, Entdeckungen und gesehene Gegnerzüge.“ hinter „Gegnerzüge automatisch abspielen“.
- Vorhandene Profil-/Einstellungs-Tests (`apps/web/src/pages/profil/Profil.test.tsx`, Server-Settings-Tests) auf vollständige Objekt-Vergleiche prüfen und ergänzen.

## Task 4: Berichtsmodell `apps/web/src/sections/spielfeld/components/report.ts` (neu, rein)

- `buildTurnReport({ events, replay, participants, unitTypes, round })` → `{ round, sections: ReportSection[], isEmpty }` mit `ReportSection = { id: 'losses'|'cities'|'combat'|'sightings'|'enemyMoves'|'home'; title; entries: ReportEntry[] }`, `ReportEntry = { key; icon: GameEventType | 'move'|'attack'|'capture'; text; detail?; coord: HexCoord; eventId?: string; isNew: boolean }`.
  - Zuordnung: Verluste ← `unitLost`; Städte ← `cityLost`, `cityCaptured`; Gefechte ← `combat`; Entdeckt ← `enemySighted`, `cityDiscovered`; Gegnerbewegungen ← `replay` (Text „Panzer · Admiral Kessler“, Detail „nach 5,7“ / „greift an · Ergebnis“ / „erobert · Ergebnis“, Koordinate = letzter Pfadpunkt); Eigenes Reich ← `unitBuilt`, `fuelLow`. Reihenfolge wie aufgezählt, leere Abschnitte entfallen.
  - `isEmpty` = keine Einträge. Nur Ereignisse der aktuellen Runde oder der Vorrunde? Nein: alle `events` der Sicht (seit letztem Zugende), wie das Protokoll.
- Tests `report.test.ts`: Zuordnung aller Typen, Reihenfolge, Replay-Zeilen mit Endpunkt und Ergebnis, `isEmpty`.

## Task 5: Komponente `Rundenbericht.tsx` (neu) und Einbau in `Spielfeld.tsx`

- `Rundenbericht` Props: `report`, `pendingReplay: boolean` (Replay anstehend und ansehbar), `onJump(entry)`, `onWatchReplay()`, `onSkipReplay()`, `onClose()`. Markup: `role="dialog" aria-labelledby` mit Titel „Rundenbericht · Runde N“, Untertitel „Seit deinem letzten Zug“, Abschnitte als `<section>` mit `<h3>` und Listen von Buttons (Icon aus `EVENT_STYLE` von `EventLog.tsx`, dort exportieren; `Footprints`/`Swords`/`Flag` für Replay), neue Einträge ohne Dämpfung, gelesene `opacity-60`. Footer: bei `pendingReplay` Primärbutton „Gegnerzüge ansehen“ und Sekundär „Überspringen“, sonst „Weiter“. Position: mobil Bottom-Sheet `max-h-[55vh]`, ab `md` rechts oben `md:right-4 md:top-16 md:w-[26rem]`, kein Backdrop (Karte bleibt sichtbar, Zentrieren wirkt), `z-30` über Panels.
- `Spielfeld.tsx`:
  - Neue Props in `types.ts`: `showTurnReport?: boolean` (Standard `false`; MatchPage reicht die Einstellung durch, Design-Übergabe/Tests unverändert), `canWatchReplay?: boolean` (Standard `true`; MatchPage reicht `display.autoplayReplay` durch, damit die Karte bei abgeschalteter Wiedergabe direkt „Weiter“ zeigt statt kurz „Gegnerzüge ansehen“).
  - State `report: TurnReport | null`. Effekt „Zugbeginn“: `prevPhase`-Ref; wenn `showTurnReport`, Phase ≠ `waiting`, (vorherige Phase `waiting` oder erster Render) und `localStorage['dos-turn-report:'+match.id] !== `${round}:${youId}`` (try/catch) → `buildTurnReport(...)`, bei `!isEmpty` `setReport`. Beim Schließen (alle drei Buttons) Marker in `localStorage` setzen.
  - Replay-Effekt (311-346) und Overlay nur, wenn `!report` (`match.phase === 'replay' && !report`); sonst bleibt die Wiedergabe stehen. „Gegnerzüge ansehen“ → `setReport(null)` (Effekt startet). „Überspringen“ → `setReport(null)` + `onSkipReplay`. „Weiter“ → `setReport(null)`, und wenn `match.phase === 'replay'` (Fall `canWatchReplay=false`) zusätzlich `onSkipReplay`.
  - `pendingReplay = match.phase === 'replay' && replay.length > 0 && canWatchReplay`.
  - `onJump(entry)`: `centerOn(entry.coord)`, bei `eventId` `onSelectEvent(eventId)`; Karte bleibt offen.
  - Escape (`Spielfeld.tsx:452-458`): zuerst Bericht schließen (wie „Weiter“/„Überspringen“? Nein: Escape = „Weiter“ ohne Skip bei pendingReplay → startet Replay; zu überraschend). Escape schließt den Bericht wie „Weiter“ nur, wenn kein Replay anstehend; bei anstehendem Replay ignoriert.
  - `canAct` unverändert (`phase === 'yourTurn'`), Bericht in `yourTurn` blockiert nichts; Zugende-Button bleibt bei `replay` gesperrt wie heute.
  - Erneut öffnen: `EventLog` bekommt optionales `onOpenReport`; erste Zeile der offenen Liste „Rundenbericht anzeigen“ (nur wenn `events.length || replay.length`), öffnet den Bericht aus den aktuellen Props (Footer dann „Schließen“ bzw. bei `replay` wie oben).
- `MatchPage.tsx`: `showTurnReport={settings.display.turnReport}` und `canWatchReplay={settings.display.autoplayReplay}`. Auto-Skip-Logik bleibt.

## Task 6: Tests

- `packages/shared/src/game/engine/__tests__/bericht.test.ts` (neu, `makeState`): Zugende speichert `seenAtTurnEnd`; Gegner zieht in Sicht → p1 erhält zu Zugbeginn `enemySighted` mit Feldkoordinate, zwei Einheiten auf einem Feld → eine Meldung; bereits am Zugende sichtbare Einheit → keine Meldung; Stadt erstmals gesehen → `cityDiscovered` „entdeckt“; Besitzerwechsel einer bekannten Gegnerstadt → „in der Hand von“; eigene verlorene Stadt → nur `cityLost`, kein `cityDiscovered`; ohne Schnappschuss (Runde 1 / `normalizeState`) keine Meldungen; `normalizeState` setzt `seenAtTurnEnd: null`.
- `apps/web/src/sections/spielfeld/components/report.test.ts` (Task 4).
- `Spielfeld.test.tsx`: `showTurnReport` + Phase `replay` → Dialog „Rundenbericht“ mit Abschnitten, kein Overlay „Gegnerzug“, Zugende gesperrt; „Gegnerzüge ansehen“ → Overlay erscheint, `onSkipReplay` nicht gerufen; „Überspringen“ → `onSkipReplay` einmal, kein Overlay; `canWatchReplay=false` → nur „Weiter“, Klick ruft `onSkipReplay`; Phase `yourTurn` → „Weiter“; ohne Ereignisse und Replay kein Dialog; Klick auf Eintrag ruft `onSelectEvent`, Dialog bleibt; nach „Weiter“ erneuter Render derselben Runde zeigt keinen Dialog (localStorage; `beforeEach` `localStorage.clear()`); „Rundenbericht anzeigen“ im Protokoll öffnet ihn wieder. Bestehende Replay-Tests laufen ohne `showTurnReport` unverändert.
- `MatchPage.test.tsx`: Standard-Einstellungen + Demo in `replay` → Dialog sichtbar; `turnReport=false` → Overlay wie heute.
- Profil: `settingsOf({})` enthält `turnReport: true`; `validateSettings` ohne `turnReport` → Fehler `display.turnReport`; Schalter in `Profil.test.tsx` sichtbar.
- Server-Tests (`apps/server`) laufen durch `normalizeState`-Default weiter; prüfen mit `pnpm test`.

## Task 7: Doku und Abschluss

- `README.md`: Abschnitt „Rundenbericht“ (Abschnitte, Button-Logik, Einstellung, neue Ereignistypen, Schnappschuss-Regel).
- `agent-os/product/roadmap.md` Punkt 3 durchgestrichen (31. Oktober 2026, Spec-Ordner); `playtest-runde-1.md` Spec-3-Abschnitt „(umgesetzt)“ mit Verweis, Startstädte-Hinweis als erledigt markieren.
- Screenshots per Playwright (Rezept aus Memory `screenshots-playwright-demo`): Demo zurücksetzen (Phase `replay`, Bericht erscheint direkt), Screenshot der Karte; Einstellungen-Seite mit neuem Schalter. Demo danach zurücksetzen.
- Commit: `Playtest 1 / Rundenbericht: Berichtskarte zu Zugbeginn, Entdeckungs-Ereignisse, Einstellung`.

## Critical files

- **Neu:** `apps/web/src/sections/spielfeld/components/Rundenbericht.tsx`, `report.ts` (+ `report.test.ts`), `packages/shared/src/game/engine/__tests__/bericht.test.ts`, Spec-Ordner
- **Geändert (Engine):** `packages/shared/src/game/types.ts`, `engine/state.ts`, `engine/visibility.ts`, `engine/turn.ts`, `engine/demo.ts`, `engine/create.ts`, `__tests__/fixtures.ts`, `__tests__/engine.test.ts`
- **Geändert (Profil):** `packages/shared/src/profile/types.ts`, `profile/index.ts`, `apps/web/src/sections/profil/components/Einstellungen.tsx`
- **Geändert (Web):** `Spielfeld.tsx`, `EventLog.tsx`, `spielfeld/types.ts`, `pages/MatchPage.tsx`, Tests `Spielfeld.test.tsx`, `MatchPage.test.tsx`, `Profil.test.tsx`
- **Wiederverwendet:** `visibleTiles`/`updateKnowledge` (`visibility.ts`), `addEvent`, `projectView` (Replay/Events kommen bereits mit), `centerOn`/`handleEvent` und `EVENT_STYLE`, Zugende-Dialog-Markup, `settingsOf`-Muster

## Verification

1. `pnpm test`, `pnpm typecheck`, `pnpm lint`.
2. Demo-Partie http://localhost:5173/partie/demo nach Reset: Bericht erscheint vor der Wiedergabe mit Abschnitten und Gegnerbewegungen; „Gegnerzüge ansehen“ startet das Overlay; Reload in derselben Runde zeigt den Bericht nicht erneut; „Rundenbericht anzeigen“ im Protokoll öffnet ihn wieder.
3. Einstellungen: „Rundenbericht zu Zugbeginn“ aus → Verhalten wie heute; „Gegnerzüge automatisch abspielen“ aus → Karte zeigt „Weiter“, Replay wird übersprungen.
4. Engine: Partie gegen KI spielen, Gegnereinheit in Sicht lassen → nächste Runde „Feindliche … gesichtet“ und bei neu gesehener Stadt „… entdeckt“ im Bericht.
5. Screenshots in `visuals/`.
