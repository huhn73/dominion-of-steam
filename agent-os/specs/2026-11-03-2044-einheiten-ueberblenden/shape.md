# Einheitenliste: Fraktionsbilder überblenden — Shaping-Notizen

## Umfang

- In der Gesamtliste „Einheiten“ (Fraktionen & Einheiten) zeigen die neun allgemeinen Einheiten ein Bild und blenden synchron zwischen den vier Fraktionsausführungen über.
- Die Fraktionsseite zeigt das Bild der Sondereinheit statt des runden Icons.
- Die Einheitenzeilen bekommen größere Bilder, Namen und Zusatzzeilen überlagern die Werte nicht mehr (Gesamtliste und Fraktionsseite).

## Entscheidungen

- Ursache der fehlenden Bilder: Allgemeine Einheiten haben nur `variantIllustrationUrls` (je Fraktion), die Gesamtliste fragt aber `illustrationUrl` ab, und `/art/units/<einheit>.webp` gibt es nicht.
- Takt 6 s, Blende 1,5 s, Reihenfolge wie in den Stammdaten (Eisenbund, Aurelia, Nordmark, Salzküste). Ein Timer für die ganze Liste, damit alle Zeilen gleichzeitig wechseln.
- Der Bildrahmen nimmt die Farbe der gezeigten Fraktion an.
- „Animationen reduzieren“ (Einstellung oder `prefers-reduced-motion`): kein Wechsel, Eisenbund bleibt stehen. Im verborgenen Tab läuft der Takt nicht weiter.
- Die Bilder sind groß (im Schnitt 750 KB, zusammen 27 MB). Ein Skript erzeugt Vorschaubilder mit 320×240 nach `public/art/units/thumbs/`. Liste und Fraktionsseite laden diese, mit dem Original als Rückfall.
- Zeilenlayout über Container-Queries: Schmal stehen die Werte unter dem Namen, erst bei genug Breite daneben.

## Kontext

- **Visuals:** vorher `visuals/einheitenliste-ohne-bilder.png` (Gesamtliste, nur Sondereinheiten mit Bild) und `visuals/fraktionsseite-eisenbund-ueberlappung.png` (Sondereinheit ohne Bild, Namen über den Werten); nachher `visuals/umsetzung-*.png` (Liste bei 1280, 1100 und 375 px, Liste nach einem Takt mit Aurelia-Rahmen, Fraktionsseite Eisenbund)
- **Referenzen:** siehe `references.md`
- **Produktausrichtung:** Kompendium soll die Fraktionen anschaulich machen; keine Auswirkungen auf Spielregeln

## Angewandte Standards

Keine (`agent-os/standards/` existiert nicht).
