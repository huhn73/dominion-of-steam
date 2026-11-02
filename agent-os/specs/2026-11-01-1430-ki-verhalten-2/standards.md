# Standards für KI-Verhalten, zweiter Block

In `agent-os/standards/` sind noch keine Standards definiert. Es gelten die Repo-Konventionen:

- Die KI handelt nur über `applyCommand` und sieht nur ihre eigene Sicht (`knowledge`); Landmassen werden aus der bekannten Karte berechnet, nicht aus dem vollen Spielstand.
- Jeder Verhaltensbaustein bekommt Szenario-Tests in `engine/__tests__/ai.test.ts` (Zwei-Inseln-Karte für Transporte) und wird mit `pnpm sim` nachgemessen; Vorher und Nachher in `agent-os/product/ki-balance.md`.
- Keine neuen Engine-Befehle; Lücken der Engine (Einsteigen per `goto`, Treibstoff bei `goto`) werden umgangen und dokumentiert, nicht nebenbei geändert.
- Determinismus: alle Zufallswerte über `random(state)`.
- Prettier, `pnpm lint`, `pnpm typecheck` je Paket; Vitest in shared und sim.
- Doku auf Deutsch, Code-Kommentare auf Englisch.
