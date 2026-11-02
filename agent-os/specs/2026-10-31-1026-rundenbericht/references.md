# Referenzen für Rundenbericht

### Ereignis-Pipeline

- **Ort:** `packages/shared/src/game/engine/state.ts` (`addEvent`), `engine/view.ts` (`projectView`: Ereignisse und Replay seit `lastTurnEndSeq`), `apps/web/src/sections/spielfeld/components/EventLog.tsx` (`EVENT_STYLE`)
- **Bezug:** Neue Ereignistypen laufen durch dieselbe Pipeline; der Bericht gruppiert die bereits projizierten Ereignisse und Replay-Aktionen clientseitig.

### Vorher/Nachher-Vergleich der Sicht

- **Ort:** `packages/shared/src/game/engine/movement.ts` (`logAction`, `snapshotVisibility`), `engine/visibility.ts` (`visibleTiles`, `updateKnowledge`)
- **Bezug:** Vorbild für den Schnappschuss `seenAtTurnEnd` am Zugende und den Vergleich zu Zugbeginn.

### Wiedergabe der Gegnerzüge

- **Ort:** `apps/web/src/sections/spielfeld/components/Spielfeld.tsx` (Replay-Effekt und Overlay), `apps/web/src/pages/MatchPage.tsx` (Auto-Skip bei abgeschalteter Wiedergabe)
- **Bezug:** Der Bericht hält die Wiedergabe an, bis „Gegnerzüge ansehen“ gedrückt wird; „Überspringen“ ruft wie das Overlay `onSkipReplay`.

### Dialog-Muster

- **Ort:** `Spielfeld.tsx` (Zugende-Dialog `role="alertdialog"`, Angriffsdialog), `UnitPanel.tsx`/`CityPanel.tsx` (Bottom-Sheet auf Mobilgeräten)
- **Bezug:** Markup, Fokusführung und Positionierung der Berichtskarte.

### Einstellungen

- **Ort:** `packages/shared/src/profile/index.ts` (`DEFAULT_SETTINGS`, `settingsOf`, `validateSettings`), `apps/web/src/sections/profil/components/Einstellungen.tsx`, `apps/web/src/pages/MatchPage.tsx`
- **Bezug:** Neue Einstellung `display.turnReport` nach dem Muster von `autoplayReplay`; MatchPage übersetzt sie in Props.

### Design-Übergabe

- **Ort:** `product-plan/sections/spielfeld-and-zuge/README.md` (Zugbeginn, Ereignis-Log), `tests.md`
