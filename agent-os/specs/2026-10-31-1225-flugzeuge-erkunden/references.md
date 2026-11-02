# Referenzen für Flugzeuge erkunden

### Stehende Befehle

- **Ort:** `packages/shared/src/game/engine/turn.ts` (`executeStandingOrders`, `advance`), `engine/commands.ts` (`move`, `patrol`)
- **Bezug:** Muster für den neuen Zweig `explore` und das sofortige Losfliegen beim Erteilen.

### Bewegung und Replay

- **Ort:** `packages/shared/src/game/engine/movement.ts` (`walk`, `logAction`, `snapshotVisibility`, `budget`)
- **Bezug:** Schrittweises Fliegen mit Treibstoffverbrauch, ein Log-Eintrag je Runde für die Wiedergabe.

### Sicht und Rundenbericht

- **Ort:** `engine/visibility.ts` (`visibleTiles`, `updateKnowledge`), `turn.ts` (`reportSightings`)
- **Bezug:** Erkennen neu sichtbarer Feinde und Städte nach jedem Schritt; Dedupe der Meldungen im Bericht.

### Basislogik der KI

- **Ort:** `engine/ai.ts` (Flugzeuge zurück zur Basis)
- **Bezug:** Definition der Basen (eigene Städte, eigene Träger); jetzt gemeinsam in `game/fuel.ts`.

### Reichweite und Dialoge im Client

- **Ort:** `apps/web/src/sections/spielfeld/components/Spielfeld.tsx` (`reach`, `commitMove`, Angriffsdialog, Zugende-Dialog), `HexMap.tsx` (Reichweiten-Polygone, `dos-hatch`), `UnitPanel.tsx` (`OrderButton`, Treibstoffbalken)
- **Bezug:** Rote Felder, Bestätigung „Kein Rückweg“, Zugende-Warnung, Buttons „Erkunden“ und „Zur Basis“.
