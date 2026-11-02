# Spielabschluss: Shaping-Notizen

## Umfang

Nach dem Playtest-Sieg blieb das Spielfeld bei „Warte auf Gegner“ stehen. Diese Spec zeigt den Ausgang einer Partie im Spielfeld: Ergebniskarte mit Rangliste, Kopfzeile „Beendet · Sieg“, Ende des Pollings, Weg zurück zur Lobby. Betroffen: `packages/shared/src/game/view.ts`, `sections/spielfeld/components/Partieabschluss.tsx` (neu), `Spielfeld.tsx`, `sections/spielfeld/types.ts`, `pages/MatchPage.tsx`, `data/match.ts`.

## Entscheidungen

- **Ergebniskarte über der Karte** an der Stelle des Rundenberichts (Bottom-Sheet mobil, Karte links oben am Desktop, `z-30`), mit Stempel wie im Lobby-Tab „Beendet“ (Teal „Sieg“, Rose „Niederlage“, Stone „Aufgegeben“). Verworfen: eigene Abschlussseite (die Karte soll zum Nachschauen offen bleiben), reine Hinweisleiste.
- **Ausgang aus der Sicht** (`matchOutcome` in shared): Sieger → `victory`; eigener Sitz inzwischen `isAI` (nach Aufgabe übernimmt „KI für <Name>“) → `surrendered`; sonst `defeat`; null ohne Ergebnis oder ohne Sitz.
- **Rangliste mit Kennzahlen:** sortiert nach `result.placements`, Spalten Platz, Teilnehmer (Wappen aus dem Kompendium, „KI“-Chip, „(du)“), Städte, Einheiten, Punkte (`participantScore` = Städte × 3 + Einheiten, dieselbe Formel wie `score()` in `engine/victory.ts`). Ausgeschiedene gedämpft mit Vermerk und „–“ statt Zahlen. `cityCount`/`unitCount` kommen für alle Teilnehmer aus dem Spielstand, nicht aus der Sicht. Auf schmalen Bildschirmen abgekürzte Spaltenköpfe (`St.`, `Einh.`, `Pkt.`) und abgeschnittene Namen.
- **Karte erscheint bei jedem Öffnen** einer beendeten Partie (`resultOpen` wird bei neuem `match.id`/`endedAt` wieder true). „Karte ansehen“ schließt sie, die Pille „Beendet · Sieg“ mit Knopf „Ergebnis“ ersetzt das Warte-Banner und öffnet sie wieder. „Zur Lobby“ → `onLeave` → `navigate(routes.lobby)`.
- **Aktionsleiste** bleibt sichtbar, aber gesperrt (`canAct` ist in Phase `waiting` false); der Hauptknopf heißt „Partie beendet“. Rundenbericht wird bei Ergebnis nicht angezeigt.
- **Kopfzeile** (`gameHeaderFor`): „Beendet · Sieg/Niederlage/Aufgegeben“, ohne Frist. **Polling** (`useMatchView`) endet, sobald `result` gesetzt ist (vorher alle 5 s weiter, weil die Phase `waiting` bleibt).
- **Ton** unverändert: `useMatchAudio` spielt Sieg/Niederlage einmal je Sitzung (Merker `dos-result-played:<id>`); die Karte kommt trotzdem jedes Mal.
- **Abweichung von der Design-Übergabe:** `SpielfeldUndZuegeProps` bekommt `result?: MatchResult | null` und `onLeave?: () => void`; `Partieabschluss.tsx` liegt neben `Rundenbericht.tsx` im Übergabe-Ordner. Der Server bleibt unverändert; eine Phase `finished` wurde verworfen, weil `result` dieselbe Information trägt.

## Kontext

- **Visuals:** `visuals/umsetzung-ergebniskarte.png` (Desktop, Sieg), `umsetzung-ergebniskarte-mobil.png` (Handy, Niederlage), `umsetzung-pille-beendet.png` (nach „Karte ansehen“)
- **References:** siehe `references.md`
- **Product alignment:** Roadmap hatte keinen Punkt dazu (Lücke aus dem Playtest), nachgetragen als „Spielabschluss“.

## Standards Applied

Keine formalen Standards in `agent-os/standards/`; Repo-Konventionen in `standards.md`.
