# Referenzen für Einheitenliste: Fraktionsbilder überblenden

### Einheitenzeile
- **Ort:** `apps/web/src/sections/fraktionen/components/UnitRow.tsx`
- **Relevanz:** Zeile in Gesamtliste und Fraktionsseite; Bild, Name, Wertekästen

### Bild-Ladelogik
- **Ort:** `apps/web/src/sections/fraktionen/components/useImageLoaded.ts`
- **Muster:** `useFirstLoadedImage` wählt den ersten geladenen Kandidaten (Thumbnail, dann Original)

### Fraktionsseite und Einheitenansicht
- **Ort:** `FraktionDetail.tsx` (Variantenbilder der allgemeinen Einheiten, Karte der Sondereinheit), `EinheitDetail.tsx` (Ausführungs-Tabs je Fraktion)

### Einblenden von Bildern
- **Ort:** `CardImage` in `FraktionenUndEinheiten.tsx` (`animate-in fade-in`)

### Animationen reduzieren
- **Ort:** `apps/web/src/settings/motion.ts`, `apps/web/src/styles/index.css` (Klasse `dos-reduce-motion` an `<html>`)

### Bilder per Chromium erzeugen
- **Ort:** `scripts/icons.mjs`
- **Muster:** Playwright aus Abhängigkeit oder npx-Cache, sonst System-Chrome
