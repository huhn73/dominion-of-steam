# Referenzen für Lagerbericht: ⋮-Menü abgeschnitten

### MatchCard (Feature- und kompakte Variante)

- **Ort:** `apps/web/src/sections/lobby/components/MatchCard.tsx`
- **Relevanz:** Die Feature-Variante schneidet das Menü ab. Die kompakte Variante hat kein `overflow-hidden` und funktioniert.
- **Muster:** `MatchMenu` als `absolute right-0 top-full z-20`

### Lobby-Tests

- **Ort:** `apps/web/src/pages/lobby/Lobby.test.tsx`
- **Relevanz:** Öffnet das Menü bereits über die Region „Du bist am Zug“ (Aufgeben-Ablauf)
