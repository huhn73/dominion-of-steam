# KI-Regeln je Stufe und Fraktion: Shaping-Notizen

## Umfang

Folge-Spec der KI-Simulation (`agent-os/specs/2026-11-01-1326-ki-simulation/`), Roadmap Phase 1c Punkt 6. Umgesetzt werden die Maßnahmen aus `agent-os/product/ki-balance.md`, die ohne neue Einheitenbefehle auskommen: Parameter der Stufen (A1, A2, A3), Deckel für defensive Persönlichkeiten (C1), Ertragsbewertung beim Stadtangriff (B1), Neuplanung von Einheiten mit Dauerbefehl, Stadtverteidigung und Produktion nach Lage für „schwer“, Neuwürfeln der Produktion bei jedem Neustart. Nur `packages/shared/src/game/engine/ai.ts` und seine Tests; keine Regel-, Server- oder Oberflächenänderung.

Außerhalb des Umfangs (eigener Block, Roadmap Phase 2): Transporte und Landungen (B4), Flugzeuge (B5), fraktionsspezifische Produktion mit Sondereinheiten (B2), Verhalten hinter den Persönlichkeits-Tags (C2), Sparringsgegner für die Simulation.

## Entscheidungen

- **Leicht greift an, aber harmlos:** Schwelle 0,7 → 0,6 (Grenadiere nehmen neutrale Städte mit 0,67), Aussetzer 0,3 bleiben, keine Ertragsbewertung, und „leicht“ greift keine Verteidiger in Städten an (`siege: false`): Eine besetzte Stadt ist vor der leichten KI sicher, ein Anfänger kann sich einrichten.
- **Schwer kämpft nicht mehr mit Münzwürfen:** Schwelle 0,45 → 0,55 wie „normal“; Sondereinheiten 0,2 → 0 und Schiffe 0,35 → 0, solange die KI weder Landungen noch Luftkrieg kann (der Sweep zeigte jede dieser Zutaten als Verlust von 5 bis 15 Punkten). Die Stärke von „schwer“ kommt aus Verhalten: Einheiten auf Wache werden jede Runde neu geplant (`replan: 'all'`), bedrohte Städte behalten eine Landeinheit und rufen bei Bedarf die nächste zurück (`defend`), bedrohte Städte bauen Grenadiere.
- **Normal** behält Schwelle 0,55 und 0,35 Schiffe; neu sind nur Ertragsbewertung und Neuwürfeln der Produktion, die alle Stufen außer der Ertragsbewertung bei „leicht“ bekommen.
- **Ertragsbewertung (B1):** Ein Stadtangriff lohnt, wenn Eroberungschance × Stadtwert ≥ Kosten der Einheit in Grenadier-Bauten (Bauzeit / 4). Stadtwert 3 Punkte für neutrale, 6 für feindliche Städte (der Gegner verliert sie); ein unbeschädigter Panzerwagen oder Dampfkoloss hinterlässt Grenadiere und bekommt einen Bau gutgeschrieben. Grenadiere greifen damit auch Salzküste-Städte (0,5) an, ein Dampfkoloss opfert sich nicht für eine neutrale Stadt. Verworfen: Panzerwagen fest für Stadtangriffe reservieren.
- **Deckel 0,65 (C1):** „Befestigung“ hebt die Schwelle nicht mehr, nur „Defensiv“ (+0,1); die Schwelle wird bei 0,65 gedeckelt, weil darüber keine Grenadiere mehr Städte nehmen und die KI einfriert (Ostrow 0 %).
- **Produktion neu würfeln:** Bisher fror der erste Wurf je Stadt den Bautyp ein (eine Stadt, die einmal Dampfkoloss würfelte, baute nur noch Dampfkolosse). Jetzt wählt die KI bei Fortschritt 0 neu; `setProduction` kostet bei Fortschritt 0 nichts und ist bei gleichem Typ ein Leerlauf.
- **Sicht bleibt Sicht:** Bedrohung heißt ein sichtbarer Feind im Abstand ≤ 3 um eine eigene Stadt; Städte und Landeinheiten sehen ein Feld weit, die Regel greift also meist erst bei Kontakt. Rückruf bis Abstand 6.
- **Neuplanung ohne Flattern:** Ein `goto` mit demselben Ziel wie der laufende Befehl wird nicht neu gesetzt; `patrol` und `explore` (Spielerbefehle) rührt die KI nicht an. Die eigene Sicht wird je Zustand einmal berechnet und nach jedem Befehl verworfen, damit die Neuplanung vieler Einheiten die Zugdauer nicht vervielfacht.
- **Befund nebenbei:** Die bisherige Neuplanung von `goto`-Einheiten auf „schwer“ war wirkungslos, weil die innere Schleife bei jedem Dauerbefehl sofort abbrach.

## Kontext

- **Referenzen:** siehe `references.md`.
- **Produktbezug:** Roadmap Phase 1c Punkt 6; Zielwerte aus `agent-os/product/ki-simulation/README.md`; Vorher-Werte in `agent-os/product/ki-balance.md`.

## Angewandte Standards

Noch keine, siehe `standards.md`.
