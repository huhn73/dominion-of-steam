# Geländeregeln überarbeiten (A–D)

## Context
Das Gelände wirkt heute nur auf die Verteidigung von Landeinheiten (Wald/Hügel +1, Gebirge +2);
Bewegung kostet überall 1, Sicht hängt nur am Bereich, Flach- und Tiefwasser sind gleich. Der
Nutzer hat die Bewertung gesehen und alle vier Vorschläge freigegeben:

- **A Bewegung:** Wald, Hügel, Gebirge beenden die Bewegung von Fahrzeugen.
- **B Verteidigung je Einheit:** Grenadiere voller Bonus, Fahrzeuge nur Hügel +1.
- **C Sicht:** Landeinheiten auf Hügeln/Gebirge sehen 2 Felder.
- **D Flachwasser:** Tauchboote sind dort nicht getarnt.

„Fahrzeuge“ = `panzerwagen`, `dampfkoloss`. Der Dampfkoloss hat nur 1 Bewegung, A trifft im
Alltag also vor allem den Panzerwagen (und beide beim Nachrücken nach einem Sieg).
„Raues Gelände“ = forest, hills, mountains.

## Umsetzung

### Regeln zentral in `packages/shared/src/game/rules.ts`
- `VEHICLE_UNIT_TYPES = new Set(['panzerwagen', 'dampfkoloss'])` (gleiches Muster wie
  `STEALTH_UNIT_TYPES`/`tauchboot`-Sonderfall, kein neues Datenfeld).
- `ROUGH_TERRAIN`, `endsMovement(type, terrain)`.
- `terrainDefense(defender: Pick<UnitType,'id'|'domain'>, terrain)`: Fahrzeuge nur `hills: 1`,
  sonst wie bisher; `terrainDefenseTable(type)` für das Kompendium. Aufrufer (`combat.ts:52`,
  `hex.ts:353`, `defenseModifiers`, `Spielfeld.tsx:907`) bekommen `id` mitgegeben.
- `sightRadius(type, terrain)`: Land 1, auf Hügeln/Gebirge 2; See/Luft 2.

### A Bewegung
- `hex.ts` `reachableTiles`: Einträge bekommen neben `dist` (Schritte) ein `cost`
  (verbrauchte Bewegung). Betritt ein Fahrzeug raues Gelände: Eintrag mit `cost = budget`,
  nicht weiter expandieren. Wer noch ≥ 1 Bewegung hat, kann immer ein Feld betreten.
- `attackTargets` (`hex.ts:330`), `commands.ts` attack (:276) und `Spielfeld.tsx:356`:
  Angriffsursprung nur bei `cost < movesLeft` statt `dist < movesLeft`.
- `movement.ts` `walk()`: nach dem Schritt auf raues Gelände `movesLeft = 0` (Fahrzeug).
- `combat.ts` `advance`: Fahrzeug rückt auf raues Gelände nach → `movesLeft = 0`.
- `findPath`: für Fahrzeuge kostengewichtete Suche (Dial-Buckets, Kosten 1 bzw. `movement`
  für raues Gelände = eine volle Runde), damit Märsche um Wald/Gebirge herum führen, wenn das
  schneller ist; für alle anderen Einheiten bleibt die BFS unverändert. Knotenbudget wie bisher.
- `pathTurns(unit, type, path, idx)`: Runden je Schritt durch Simulieren (raues Gelände
  beendet die Runde). Nutzen in `Spielfeld.tsx:247`, `commands.ts:221` und `turn.ts:293`
  (`turnsRemaining` = letzter Wert statt `ceil(rest / movement)`).
- KI braucht keine eigene Logik: sie nutzt `findPath`/`reachableTiles`/`attackTargets`;
  `hexDistance`-Vorfilter bleiben obere Schranken.

### B Verteidigung
Siehe Regeln oben; `EinheitDetail.tsx:250–276` zeigt die Liste je Einheit aus
`terrainDefenseTable`.

### C Sicht
- `visibility.ts` `visibleIndices`: Radius über `sightRadius(type, terrainOf(unit))` statt
  `sightOf(domain)`.
- `turn.ts:275` (Wache wacht auf, eigene Kopie des Radius) auf `sightRadius` umstellen.
- `movement.ts:113` Vorfilter „≤ 2“ bleibt gültig (Maximum weiter 2).

### D Tarnung
- `visibility.ts` `hiddenFrom`: Tauchboot auf `shallows` ist nicht verborgen.

### Texte, Doku
- i18n de/en (`compendium.json`): neue Schlüssel für Geländeregeln (Bewegung Fahrzeuge,
  Sicht auf Höhen); `EinheitDetail` zeigt bei Fahrzeugen „Wald, Hügel, Gebirge beenden die
  Bewegung“, bei Landeinheiten den Sichthinweis.
- `compendium/data.json` + `data.en.json`: Tauchboot-Beschreibung (Flachwasser),
  Taktiktexte Panzerwagen/Dampfkoloss (Ebene, Hügel).
- Neuigkeiten: neuer Eintrag für die nächste Version in `packages/shared/src/news/index.ts`
  (0.11.0 ist schon released), Datum beim Release; vorher prüfen, was `news.test.ts` erlaubt.
- Roadmap Phase 1c Punkt 17 „Geländeregeln“, Spec-Ordner
  `agent-os/specs/2026-11-07-XXXX-gelaenderegeln/`, Nachmessung in `ki-balance.md`.

## Tests
- Neues `engine/__tests__/gelaende.test.ts`: Panzerwagen stoppt im Wald (movesLeft 0),
  Reichweite endet an rauem Gelände, kein Angriff aus rauem Gelände nach Einfahrt, Nachrücken
  ins Gebirge, Marsch-Runden über `pathTurns`, `findPath` umgeht Gebirge wenn kürzer in Runden;
  Verteidigung Grenadiere vs. Panzerwagen je Gelände; Sicht 2 auf Hügel; Tauchboot im
  Flachwasser sichtbar, in Tiefsee weiter getarnt.
- Bestehende anpassen, wo sie das alte Verhalten festschreiben: `kampf.test.ts:280–330`,
  `tarnung.test.ts`, ggf. `Spielfeld.test.tsx`, Tutorial-Test.

## Verifikation
- `pnpm --filter @dos/shared typecheck/test`, dann `@dos/web`, `@dos/server`, `@dos/sim`
  einzeln (nicht `-r`), `pnpm lint`.
- Simulation: `pnpm sim --config packages/sim/configs/stufen.json`, `fraktionen.json` und die
  Inselwelt-Konfiguration; mit „Nachmessung Werte“ vergleichen (Siegquoten, Zugdauer ≤ 10 s,
  Patts). Bei Ausreißern melden statt still nachjustieren.
- Im Browser (lokal, Dev-Server): Panzerwagen-Reichweite an Waldrand, Pfadvorschau mit
  Rundenmarken, Angriffsdialog-Modifikatoren, Kompendium Grenadiere/Panzerwagen/Tauchboot.
- Commit lokal, Push nach Rückfrage (`main:dev`).
