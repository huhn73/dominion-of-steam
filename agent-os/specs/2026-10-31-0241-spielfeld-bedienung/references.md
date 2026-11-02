# Referenzen für Spielfeld-Bedienung

### Ladungs-Abzeichen

- **Ort:** `apps/web/src/sections/spielfeld/components/HexMap.tsx` (`UnitToken`, Kreis mit Zahl oben rechts)
- **Bezug:** Vorbild für den Stapelzähler unten rechts am Token.

### Ghost und Kampf-Effekte

- **Ort:** `HexMap.tsx` (`Ghost`, Keyframes `dos-march`, `dos-blast`, `dos-flash`)
- **Bezug:** Heranfahren und Nachrücken nutzen die Ghost-Zeichnung mit Transform-Transition, Blitz und Explosion die bestehenden Keyframes.

### Einstellungen am Spielfeld

- **Ort:** `apps/web/src/settings/BoardSettingsLayer.tsx`, `apps/web/src/pages/MatchPage.tsx`, `apps/web/src/styles/index.css` (`dos-no-combat-fx`, `dos-reduce-motion`)
- **Bezug:** Die Dauer der Kampfsequenz wird in `MatchPage` aus den Einstellungen berechnet und als Prop übergeben; die CSS-Regeln bleiben als Fallback.

### Ladungsliste im Einheiten-Panel

- **Ort:** `apps/web/src/sections/spielfeld/components/UnitPanel.tsx`
- **Bezug:** Muster für die Feldliste „Auf diesem Feld“ und die Garnisonsliste im Stadt-Panel.

### Angriffsbefehl in der Engine

- **Ort:** `packages/shared/src/game/engine/commands.ts` (`attack`, Wahl des Ursprungsfelds beim Heranfahren)
- **Bezug:** Der Client berechnet das Ursprungsfeld für die Ghost-Bewegung mit derselben Regel (`reachableTiles`, kleinste Distanz).

### Design-Übergabe

- **Ort:** `product-plan/sections/spielfeld-and-zuge/README.md`, `tests.md`
- **Bezug:** Tipp-Zyklus „Einheit, Stadt, keine Auswahl“ (für eine Einheit), „Nächste Einheit“ reihum, Explosion als Kampfanimation, Stadt-Panel mit Produktion.
