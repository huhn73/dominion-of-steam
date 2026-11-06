# Spielfeld-Einstellungen — Shaping-Notizen

## Umfang

Die drei Steuerungs-Einstellungen wirken im Spielfeld: „Einheiten ziehen“, „Nachfrage beim Zugende“ und „Zoom-Empfindlichkeit“ (jetzt auch für Pinch-Zoom).

## Entscheidungen

- Die Einstellungen kommen als eine Prop `controls` ins Spielfeld. Ohne sie verhält es sich wie vorher. Das Tutorial nutzt dieselbe Seite und bekommt die Einstellungen damit auch.
- Ist „Einheiten ziehen“ aus, verschiebt Ziehen auf einer Einheit die Karte, wie Ziehen auf leeren Feldern.
- Ist „Nachfrage beim Zugende“ aus, entfällt nur die Frage nach Einheiten ohne Befehl. Flugzeuge, die keine Basis mehr erreichen, werden weiter gemeldet, weil man sie sonst verliert.
- Pinch-Zoom und Mausrad nutzen dieselbe Kurve `2 ^ ((s − 50) / 50)`: beim Mausrad als Schritte je Ereignis, beim Pinch als Exponent auf das Abstandsverhältnis.

## Kontext

- **Visuals:** keine
- **Referenzen:** siehe `references.md`
- **Produktausrichtung:** Einstellungen, die man umschalten kann, müssen auch wirken (Lücke aus Phase 1)

## Angewandte Standards

Keine (`agent-os/standards/` existiert nicht).
