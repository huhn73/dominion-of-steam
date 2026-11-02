# Enden für Inselwelten — Shaping-Notizen

## Umfang

Roadmap Phase 1c, Punkt 12. Inselpartien enden auf „Mittel“ zu 89–98 % am Rundenlimit (`agent-os/product/ki-balance.md`, „Nachmessung Inselbalance“). Ausschaltung und Hauptstadteroberung brauchen Landungen auf verteidigten Heimatinseln, die selten gelingen. Die Punktwertung (3 je Stadt, 1 je Einheit) belohnt gehortete Einheiten: „schwer“ hält nach 150 Runden im Mittel 11,5 Städte und 110 Einheiten, „normal“ 5,7 Städte und 74 Einheiten.

## Entscheidungen

- **Vorherrschaft** wird eine eigene, vierte Siegbedingung. Für Kontinente ändert sich nichts. Das Setup schlägt sie bei Inselwelt und Archipel vor, solange die Siegbedingung noch auf der Vorgabe steht.
- **Schwelle:** mindestens 60 % aller Städte, neutrale mitgezählt, fünf eigene Runden in Folge. Alle Spieler sehen Hinweis und Countdown.
- **Nachtrag nach der Messung (2. November 2026):** Mit 60 % enden auf dem Kontinent 86–91 % der Partien vor Runde 150, auf Inseln aber nur 25–43 % und auf dem Archipel 6–30 %. Eine Probe mit 50 % brachte Inseln auf 60–78 % und den Archipel auf 28–43 %. Der Spieler hat entschieden, dass die Schwelle von der Weltform abhängt: **50 % auf Inseln und Archipel, 60 % auf dem Kontinent**. Der Archipel bleibt unter dem Ziel; das übernimmt eine Folge-Spec, in der die KI neutrale Inseln gezielter erobert.
- **KI kapituliert**, wenn sie klar verloren hat: Hauptstadt weg, weniger als ein Viertel der Städte des Führenden, der Führende hat mindestens 6 Städte, ab Runde 20. Sie scheidet aus, ihre Einheiten verschwinden, ihre Städte werden neutral. Menschen kapitulieren nie automatisch; für sie gibt es „Aufgeben“.
- **Verworfen:** neue Punktwertung ohne Horten (bleibt Kandidat, falls die Messung sie nötig macht) und Großprojekt als friedlicher Siegweg (zu viel Aufwand für KI und Balance).
- Die KI zielt nicht eigens auf Vorherrschaft. Erst die Messung zeigt, ob das nötig ist.

## Kontext

- **Visuals:** keine
- **Referenzen:** siehe `references.md`
- **Produktbezug:** Roadmap 1c Punkt 10 (Inselwelt) und 11 (Inselbalance), `ki-balance.md`

## Angewandte Standards

Keine; `agent-os/standards/` ist nicht angelegt.
