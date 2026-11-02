# 03 Fraktionen & Einheiten: Shaping-Notizen

## Umfang

Rein lesendes Kompendium mit drei Ansichten: Übersicht, Fraktion und Einheit. Es nutzt die Illustrationen aus `public/art/`.

## Entscheidungen

- Der Nutzer hat um direkte Umsetzung ohne Rückfragen gebeten. Die Entscheidungen folgen deshalb den Hinweisen der Anleitung.
- **Daten:**
  - Die vollständigen Stammdaten (Geschichte, Taktik, Bildpfade) liegen in `packages/shared/src/compendium/`. Die Spiel-Engine leitet ihre Werte daraus ab.
  - Werte und Boni der Kompendiumsdaten und der Spielfeld-Beispieldaten wurden verglichen und stimmen überein.
- **Auslieferung:** Der Server stellt die Daten unter `GET /api/compendium` bereit; die Web-App cacht sie dauerhaft.
- **Routen:** `/fraktionen`, `/fraktionen/:factionId`, `/einheiten/:unitTypeId?ausfuehrung=<factionId>`.
- **Bonusregel:** `bonusEffect` (Kompendium) und `withBonus` (Spiel) bleiben getrennte Dateien aus der Übergabe. Ein Test prüft, dass beide für alle Kombinationen gleich rechnen.
- **Bilder:** Neutrale Bilder gibt es bisher nur für die Sondereinheiten. Die Übersicht zeigt für allgemeine Einheiten deshalb den gezeichneten Platzhalter; die Fraktions- und Einheitenansicht zeigen die Fraktionsvarianten.

## Kontext

- **Visuals:** `visuals/screenshot-uebersicht.png`, `visuals/screenshot-fraktion-detail.png`, `visuals/screenshot-einheit-detail.png`
- **Referenzen:** siehe `references.md`
- **Produktbezug:** Nachschlagewerk vor und während einer Partie; dieselben Daten nutzen später Partie-Setup und Spielfeld.

## Angewandte Standards

Noch keine.
