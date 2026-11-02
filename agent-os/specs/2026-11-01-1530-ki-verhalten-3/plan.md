# Plan: KI-Verhalten, dritter Block

## Context

Nach dem zweiten Block (`2026-11-01-1430-ki-verhalten-2`) lag „schwer“ bei 62 % gegen „normal“ (Ziel ≥ 65 %), Eisenbund gewann 64–76 % der Fraktionsduelle und 43 % der Vierer-Partien, und die Sondereinheiten der Fraktionen kamen bei der KI nicht vor. Der Spieler wollte die offenen Punkte der Roadmap (1c Punkt 8) angehen und hat festgelegt, dass der Landanteil der Karten nicht zu groß sein darf, damit Inseln entstehen.

## Entscheidungen (Shaping, 1. November 2026)

Siehe `shape.md`. Kurz: Eisenbund-Bonus nur ab fünf Runden Bauzeit (`minBase`); Reparaturpausen für „schwer“; Land-Sondereinheit als kleiner Anteil der Panzer-Bauten ab Runde 15, Luft-Sondereinheit statt Schwerbomber, See-Sondereinheit als Geleitschutz; Kriegsschiffe begleiten Frachter und jagen Schiffe; „leicht“ mit 15 % Aussetzern und 10 % Panzern; Sparringsgegner als Configs.

## Task 1: Spec-Dokumentation

Dieser Ordner. Nachgezogen: `agent-os/product/roadmap.md` (Punkt 3 Landanteil, Punkt 8 umgesetzt, Rest als Punkt 9), `agent-os/product/ki-balance.md` („Nachmessung 3“), `agent-os/product/ki-simulation/README.md` (Serie G Sparring, neue Berichte).

## Task 2: Eisenbund-Bonus

- `compendium/types.ts` und `game/types.ts`: `FactionBonus.minBase?: number`; `game/catalog.ts` reicht es durch; `game/bonus.ts` `withBonus` gibt den Grundwert zurück, wenn `base < minBase`.
- `compendium/data.json`: Eisenbund `minBase: 5`, `trait` und `description` „Panzerwagen und Dampfkolosse werden eine Runde schneller gebaut“.
- `apps/web/src/sections/fraktionen/components/theme.ts` `bonusEffect`: dieselbe Untergrenze, damit das Kompendium wie das Spiel rechnet.
- Tests angepasst: `engine.test.ts` (Panzerwagen 6, Grenadiere 4), `kampf.test.ts` (4 + Schaden), `mapgen.test.ts` (Hauptstadt 4), `CityPanel.test.tsx` (Grenadiere 4, Panzerwagen 7 → 6), `Kompendium.test.tsx` (Ablauf 3 über Panzerwagen).

## Task 3: Reparaturpausen (`ai.ts`)

Profil `repair` (schwer). Schritt 0 in `planUnit`: Landeinheit mit mehr als einem Trefferpunkt und `hp × 2 ≤ hitPoints` außerhalb einer Stadt fährt per `goto` in die nächste eigene Stadt im Abstand ≤ 4 (`REPAIR_RANGE`), sofern ein Pfad existiert. Test: schwer fährt heim, normal zieht weiter.

## Task 4: Sondereinheiten und Marine (`ai.ts`)

- `chooseProduction`: Geleitschutz (Kriegsschiffe < Frachter → Kanonenboot oder See-Sondereinheit) direkt nach dem Frachterbau; Bomber-Slot baut die Luft-Sondereinheit, wenn die Fraktion eine hat; im Panzer-Slot wird ab Runde 15 (`SPECIAL_ROUNDS`) und ab sechs eigenen Städten (`SPECIAL_CITIES`) mit `specialShare` (schwer 0,15) die Land-Sondereinheit gewählt.
- `planWarship`: Kriegsschiffe begleiten den beladenen (sonst den nächsten) Frachter auf Abstand 1, jagen danach sichtbare feindliche Schiffe (bis acht Kandidaten), sonst erkunden sie wie bisher. Alle Seeeinheiten werden jede Runde neu geplant.
- Tests: Geleitschutz je Fraktion, Kanonenboot schließt zum Frachter auf, Nordmark baut Wolkenkreuzer statt Schwerbomber, Eisenbund baut ab Runde 15 Dampfkolosse.

## Task 5: Leicht

`SKIP_SHARE.easy` 0,3 → 0,15 und `armourShare` 0,1, weil „leicht“ ohne Grenadier-Bonus auf 10 % gegen „normal“ fiel; die Sonderregel „leicht baut nur Grenadiere“ entfällt.

## Task 6: Simulation

`PROFILE_KEYS` um `repair` erweitert; Configs `sparring.json` (drei Gegnertypen gegen jede Stufe), `sweep-hard-5.json` (Sondereinheiten-Anteil), `sweep-easy-2.json` (Aussetzer und Schwelle).

## Task 7: Nachmessung

Serien A, B, C, F und G mit dem Endstand; Zahlen in `ki-balance.md`.

## Verifikation

1. `pnpm --filter @dos/shared test` (161 Tests), `pnpm --filter @dos/web test` (218), `pnpm --filter @dos/sim test`, Typecheck je Paket, `pnpm lint`.
2. Kompendium: Eisenbund-Seite zeigt bei Grenadieren keinen Bonus mehr, bei Panzerwagen 7 → 6; Stadt-Panel zeigt dieselben Werte.
3. Serien laut Task 7.
