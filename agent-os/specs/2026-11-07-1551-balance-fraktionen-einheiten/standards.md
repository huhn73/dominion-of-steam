# Standards for Balance der Fraktionen und Einheiten

Im Projekt gibt es kein `agent-os/standards/`. Für diese Arbeit gelten diese Projektregeln:

- **Typecheck je Paket:** `pnpm -r typecheck` stirbt mit SIGKILL, deshalb wird jedes Paket einzeln geprüft (`pnpm --filter @dos/shared typecheck`, `pnpm --filter @dos/sim typecheck`, `pnpm --filter web typecheck`).
- **Eine Quelle für Werte:** Spielwerte stehen nur in `packages/shared/src/compendium/data.json`. Spiel (`game/catalog.ts`) und Kompendium lesen beide von dort, und die Texte (Bonus-Beschreibung, Taktik) müssen zu den Zahlen passen.
- **Messen vor und nach jeder Änderung:** gleiche Serie, Bericht in `agent-os/product/ki-simulation/`, Auswertung in `agent-os/product/ki-balance.md`. Ein Unterschied gilt nur, wenn die 95-%-Intervalle sich klar trennen.
- **Release und Neuigkeiten:** Die Neuigkeit kommt in den gesammelten NEWS-Eintrag 0.11.0. Das Datum wird erst beim Release gesetzt, und der Release kommt nur nach Rückfrage.
- **Push:** `main` deployt live, gepusht wird nur nach Rückfrage.
