# Spielfeld-Einstellungen auswerten

## Context

In den Einstellungen (Steuerung) gibt es „Einheiten ziehen“, „Nachfrage beim Zugende“ und „Zoom-Empfindlichkeit“. Die ersten beiden wurden nur gespeichert, das Spielfeld beachtete sie nicht. Die Zoom-Empfindlichkeit wirkte über `BoardSettingsLayer` nur aufs Mausrad, obwohl die Beschreibung auch die Zwei-Finger-Geste nennt. Roadmap Phase 2, Punkt „Spielfeld-Einstellungen“.

## Task 1: Prop `controls` am Spielfeld

- `BoardControls` und `SpielfeldUndZuegeProps.controls?` in `sections/spielfeld/types.ts`. Ohne den Wert gilt das bisherige Verhalten (Design-Übergabe, Tests).
- `MatchPage.tsx` reicht `settings.controls` durch.

## Task 2: Einheiten ziehen

- `draggableUnitAt` in `Spielfeld.tsx` liefert bei `dragUnits === false` keine Einheit. Ziehen verschiebt dann die Karte, Antippen bleibt gleich.

## Task 3: Nachfrage beim Zugende

- `askPending` statt `pendingOrders.length > 0` in `handleEndTurn`, im Dialogtext und in „Zu den Einheiten“.
- Die Warnung vor Flugzeugen ohne Rückweg bleibt immer an. Der Einstellungstext sagt das jetzt.

## Task 4: Pinch-Zoom

- `zoomSpeed(sensitivity)` in `camera.ts` (bei 50 genau 1, Bereich 0,5–2). `BoardSettingsLayer` nutzt ihn weiter für das Mausrad (`zoomStepsPerWheel`).
- `HexMap` bekommt `pinchExponent`: Der neue Maßstab ist `scale × (Abstand / Startabstand) ^ pinchExponent`.

## Task 5: Tests

- `Spielfeld.test.tsx`: Ziehen mit und ohne Einstellung, Zugende ohne Nachfrage, Warnung vor Flugzeugen trotz abgeschalteter Nachfrage, Pinch-Zoom bei Empfindlichkeit 50 und 0.
