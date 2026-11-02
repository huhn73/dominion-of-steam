# KI erobert neutrale Inseln — Shaping-Notizen

## Umfang

Roadmap Phase 1c, Punkt 13. Auf dem Archipel endet das ausgeglichene Duell Aurelia gegen Eisenbund nur zu 21 % vor Runde 150, obwohl dort seit der Spec `2026-11-02-1952-enden-inselwelten` 50 % der Städte für die Vorherrschaft reichen. Inseln enden zu 53–71 %, der Kontinent zu 86–91 % (`agent-os/product/ki-balance.md`, „Nachmessung Enden“). „Normal“ bleibt ab Runde 80 bei etwa 6,5 Städten stehen und hortet 50–80 Einheiten; je Partie baut eine Seite nur etwa 4 Frachter.

## Befund im Code (`packages/shared/src/game/engine/ai.ts`)

- `planTransport` fährt beladen zur nächstgelegenen fremden Stadt, gleich ob neutral oder verteidigt; `neutralBias` wirkt nur beim Landmarsch.
- `planCargo` landet nur auf Landmassen ohne eigene Stadt. Auf einer Insel, auf der die KI schon eine Stadt hält, bleibt die Ladung vor den übrigen Städten an Bord (Verdacht, wird in der Simulation gemessen).
- Zur See erkundet höchstens ein Kanonenboot; neutrale Städte auf unentdeckten Inseln sind der KI unbekannt.
- Die KI kennt die Vorherrschaft nicht und richtet weder Produktion noch Verteidigung danach aus.

## Entscheidungen

- Alle vier Hebel kommen in diese Spec: Zielwahl der Frachter, Landungsfehler, Vorherrschaft im Blick, Seeaufklärung.
- Gilt für „normal“ und „schwer“; „leicht“ bleibt ohne Transporte.
- Ziele: Archipel im ausgeglichenen Duell ≥ 50 % vor Runde 150; Inseln und Kontinent fallen nicht ab; „schwer“ gegen „normal“ ≥ 65 % der entschiedenen Partien; Fraktionsduelle 40–60 %; Ø KI-Zug unter 100 ms, Budget nie erschöpft.
- Vor jeder Verhaltensänderung wird gemessen (Landungen, beladen wartende Frachter).
- **Verworfen:** die Vorherrschaftsschwelle für den Archipel weiter senken (Regeländerung statt KI-Verbesserung).

## Kontext

- **Visuals:** keine
- **Referenzen:** siehe `references.md`
- **Produktbezug:** Roadmap 1c Punkte 10–12, `ki-balance.md`

## Angewandte Standards

Keine; `agent-os/standards/` ist nicht angelegt.
