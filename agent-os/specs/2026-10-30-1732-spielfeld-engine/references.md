# Referenzen für 02a Spielfeld & Züge

### Bereich aus der Design-Übergabe

- **Ort:** `product-plan/sections/spielfeld-and-zuge/`
- **Bezug:** Komponenten (`Spielfeld`, `HexMap`, Panels), `types.ts`, `sample-data.json` (Grundlage für die Demo-Partie), `tests.md` (Verhaltensspezifikation)
- **Übernahme:** Die Komponenten werden unverändert kopiert. `hex.ts` und `bonus.ts` ziehen nach `packages/shared` um.

### Meilenstein-Anleitung

- **Ort:** `product-plan/instructions/incremental/02-spielfeld-and-zuge.md`
- **Bezug:** Abläufe, Leerzustände, Vorgaben für das Backend, Checkliste „Fertig, wenn“

### Datenformen

- **Ort:** `product-plan/data-shapes/`
- **Bezug:** globale Entitäten (Match, Participant, Turn, GameEvent …)

### Shell aus 01

- **Ort:** `apps/web/src/layouts/GameLayout.tsx`
- **Bezug:** Spiel-Modus, Kopfleiste `gameHeader`
