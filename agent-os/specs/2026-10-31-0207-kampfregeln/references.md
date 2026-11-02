# Referenzen für Kampfregeln

### Kampf-Engine

- **Ort:** `packages/shared/src/game/engine/combat.ts`, `packages/shared/src/game/hex.ts` (`attackTargets`)
- **Bezug:** `attackTargets` ist die einzige Stelle für Angriffslegalität und wird von Engine, KI, Server-Vorschau und Web-Client genutzt; `resolveCombat` löst den Kampf auf.
- **Übernahme:** Neue Regeln in `rules.ts` auslagern und von beiden Stellen nutzen, damit Vorschau und Ergebnis übereinstimmen.

### Stadteroberung als Vorbild fürs Nachrücken

- **Ort:** `packages/shared/src/game/engine/combat.ts`, Sieg-Zweig gegen Städte (Angreifer wird auf das Stadtfeld gesetzt)
- **Bezug:** Gleiche Mechanik für das Nachrücken nach Sieg gegen Einheiten.

### Bewegung mit Ladung

- **Ort:** `packages/shared/src/game/engine/movement.ts` (`walk`)
- **Bezug:** Zieht Ladung mit und verbraucht Treibstoff; Nachrücken nutzt denselben Helfer.

### Fraktionsbonus und Befestigung

- **Ort:** `packages/shared/src/game/bonus.ts` (`withBonus`), `combat.ts` (`fortification`)
- **Bezug:** Additive Boni nach bestehendem Muster; Salzküsten-Befestigung bleibt zusätzlich zum Stadtbonus.

### Kompendium-Bonusanzeige

- **Ort:** `apps/web/src/sections/fraktionen/components/theme.ts` (`bonusEffect`), `EinheitDetail.tsx`
- **Bezug:** Anzeige der Werte muss der Spiellogik entsprechen; neuer Block „Gefecht“ liest Domänenmatrix und Geländeboni aus `rules.ts`.

### Design-Übergabe

- **Ort:** `product-plan/instructions/incremental/02-spielfeld-and-zuge.md` (Kampfformel, Bewegung nach Domäne)
- **Bezug:** Ursprüngliche Formel „Stärke × Zustand gegen Abwehr × Zustand, +1 Abwehr in Städten“; Gelände war dort ohne Wirkung, die Boni sind eine Erweiterung aus dem Playtest.
