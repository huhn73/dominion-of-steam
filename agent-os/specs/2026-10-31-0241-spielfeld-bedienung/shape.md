# Spielfeld-Bedienung: Shaping-Notizen

## Umfang

Zweite Spec aus Playtest Runde 1 (`agent-os/product/playtest-runde-1.md`, Abschnitt „Spec 2“, Punkte 6 bis 10). Nur Web-Client (`apps/web/src/sections/spielfeld/`, `pages/MatchPage.tsx`, `data/match.ts`): Stapel und Garnisonen sichtbar machen, Städte mit Einheiten auswählbar machen, „Nächste Einheit“ zyklisch ab der aktuellen Position, Kampfsequenz mit Dauer, Produktionsübersicht beim Bauen. Engine, Server und API bleiben unverändert.

## Entscheidungen

- **Stapel & Stadt:** Reihum tippen plus Feldliste. Ein Token je Feld mit Zähler (Muster: Ladungs-Abzeichen); Tipp-Zyklus Einheit 1 → Einheit 2 → … → Stadt → nichts. Einheiten-Panel bekommt „Auf diesem Feld“, Stadt-Panel eine Garnisonsliste. Verworfen: nur erste Einheit per Tipp; Stadt immer zuerst.
- **Nächste Einheit:** Cursor auf der Position der zuletzt gewählten Einheit in der Einheitenliste, weiter zur nächsten offenen dahinter, am Ende von vorn. Tastenkürzel N und Leertaste. Verworfen: räumlich nächste Einheit.
- **Kampfanimation:** Sequenz von etwa 1,2 s nach der Serverantwort; der neue Spielstand wird solange zurückgehalten, das Spielfeld gesperrt. „Kampfanimationen“ aus: 0 ms, nur Toast. „Animationen reduzieren“: 300 ms. Verworfen: nur Explosion mit Overlay; lange Sequenz mit Trefferticks.
- **Produktionsübersicht:** Im Bauauftrag-Wähler je Zeile plus Summenzeile, rein clientseitig aus `units` und `cities`. Verworfen: eigener Übersichtsabschnitt.

## Bedienmodell

- **Tipp-Zyklus auf einem Feld:** Ohne Auswahl auf diesem Feld wird die erste eigene Einheit gewählt (bevorzugt eine mit offenen Befehlen). Ist Einheit i gewählt, folgt Einheit i+1; nach der letzten die Stadt (falls vorhanden), danach nichts. Ist die Stadt gewählt, hebt der Tipp die Auswahl auf. Ladung zählt nicht zum Stapel.
- **Cursor für „Nächste Einheit“:** Index der zuletzt gewählten eigenen Einheit in `units`; die nächste Einheit ist die erste mit `needsOrders` hinter diesem Index, sonst von vorn. Der Zähler bleibt die Anzahl offener Einheiten.
- **Kampfsequenz (Anteile der Gesamtdauer):** Heranfahren als Ghost 0 bis 25 %, Mündungsblitz beim Angreifer 20 bis 45 %, Explosion auf dem Ziel 40 bis 75 %, Verblassen des Verlierers und Nachrücken des Siegers 70 bis 100 %, danach Toast und Übernahme des Spielstands. Replay der Gegnerzüge unverändert.
- **Übersicht:** Summenzeile „Reichsweit N Einheiten · N im Bau“, je Typ „Bestand N · N im Bau (hier, Stadt B, +N)“. Bestand zählt eigene Einheiten inklusive Ladung.

## Kontext

- **Visuals:** Keine Vorlagen; Screenshots der Umsetzung in `visuals/`.
- **Referenzen:** siehe `references.md`.
- **Produktbezug:** Roadmap Phase 1b, Punkt 2. Design-Übergabe `product-plan/sections/spielfeld-and-zuge/README.md` beschreibt den Tipp-Zyklus nur für eine Einheit und die Explosion als Kampfanimation; die Erweiterungen kommen aus dem Playtest.

## Angewandte Standards

Noch keine, siehe `standards.md`.
