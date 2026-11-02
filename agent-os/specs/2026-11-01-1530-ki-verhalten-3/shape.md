# KI-Verhalten, dritter Block: Shaping-Notizen

## Umfang

Roadmap Phase 1c Punkt 8, Fortsetzung von `2026-11-01-1430-ki-verhalten-2`. Fünf Punkte: Eisenbund-Bonus als Regel entschärfen, Reparaturpausen für „schwer“, Sondereinheiten je Fraktion mit Verhalten (Wolkenkreuzer, Dampfkoloss, Blitzkorvette), Marineverhalten (Geleitschutz, Jagd auf Schiffe), Sparringsgegner für die Simulation. Dazu die Festlegung des Spielers zum Landanteil der Karten.

Außerhalb des Umfangs: Träger als Flugbasis (Flugzeuge landen heute schon auf Trägern, die KI baut keine), Tauchboote, Produktion nach Bedrohungslage über das heutige Maß hinaus.

## Festlegung Landanteil (Spieler, 1. November 2026)

Der Landanteil darf nicht zu groß sein, damit getrennte Inseln entstehen. Der Generator erzeugt bei der Vorgabe 55 % praktisch eine Landmasse; erst bei 30 % auf „Groß“ liegen die Hauptstädte in 13 von 30 Karten auf verschiedenen Inseln. Konsequenz für die Kartengrößen-Spec (Roadmap 1c Punkt 3): Vorgabe und Grenzen von `landShare` entsprechend wählen oder Inseln im Generator garantieren. Die Simulationsserie `inseln.json` (Groß, 30 % Land) bleibt die Messung für Transporte und Marine.

## Entscheidungen

- **Eisenbund-Bonus nur ab fünf Runden Bauzeit** (`FactionBonus.minBase`, Stammdaten `minBase: 5`): Panzerwagen 7 → 6 und Dampfkoloss 12 → 11, Grenadiere bleiben bei 4. Vorher war der Bonus bei Grenadieren −25 % und entschied KI-Duelle 64–76 %; nachher 49–62 % in den Duellen und 29 % im Vierer (vorher 43 %). Kompendium-Text und Eigenheit angepasst, `bonusEffect` im Kompendium rechnet die Untergrenze mit. Verworfen: Bonus ganz streichen (Eisenbund hätte keine Eigenheit), Bonus auf Panzerwagen allein (Dampfkoloss ist der Fraktion zugeordnet).
- **Reparaturpausen (`repair`, nur schwer):** Landeinheiten mit mehr als einem Trefferpunkt fahren bei halben Trefferpunkten oder weniger in die nächste eigene Stadt im Abstand ≤ 4 (`REPAIR_RANGE`) und werden dort +1 je Runde repariert; „schwer“ plant Wache-Einheiten neu und schickt sie geheilt wieder los. Mit Reparatur und Bonusänderung erreicht „schwer“ 65 % gegen „normal“ (Ziel ≥ 65 %).
- **Sondereinheiten:** Das Profilfeld `specialShare` (schwer 0,15) ist jetzt der Anteil der Panzer-Bauten, der ab Runde 15 (`SPECIAL_ROUNDS`) und ab sechs eigenen Städten (`SPECIAL_CITIES`) zur Land-Sondereinheit wird (Eisenbund: Dampfkoloss); Luft-Sondereinheiten ersetzen den Schwerbomber (Nordmark: Wolkenkreuzer, Reichweite 30 × 1,5); See-Sondereinheiten sind der Geleitschutz (Aurelia: Blitzkorvette). Verworfen: Sondereinheiten als Anteil aller Bauten (früherer Sweep: Verlust) und ein Anteil von 0,3 ohne Städte-Bedingung (Sweep 5: jedes Zehntel kostet „schwer“ rund 3 Punkte), weil Dampfkolosse zu früh die Expansion bremsen.
- **Geleitschutz und Marine:** Sobald ein Frachter existiert, bekommt jeder Frachter ein Kriegsschiff (Kanonenboot oder Blitzkorvette) aus einer Küstenstadt. Kriegsschiffe greifen wie bisher an, begleiten sonst den beladenen Frachter (Abstand 1), jagen danach sichtbare feindliche Schiffe und erkunden zuletzt. Schiffe werden jede Runde neu geplant.
- **Leicht nachjustiert:** Aussetzer-Anteil 0,3 → 0,15 und 10 % Panzerwagen statt nur Grenadieren, weil „leicht“ ohne den Grenadier-Bonus auf 10 % gegen „normal“ gefallen war (Ziel 15–30 %); mit 25 % Panzern sprang es auf 36 %, Aussetzer und Schwelle allein bewegten nichts (Sweep easy 2).
- **Sparringsgegner** als Profil-Overrides in `packages/sim/configs/sparring.json`: „passiv“ (Schwelle 0,65, keine Belagerung, kein Ertragsangriff, keine Neuplanung), „expander“ (keine Belagerung, `neutralBias` 3), „rusher“ (Schwelle 0,35, Belagerung 1:1, 20 % Panzer). Jede Stufe spielt gegen alle drei; die Quoten beschreiben, wie eine Stufe auf typische menschliche Spielweisen reagiert. Kein neuer Code im Simulationspaket nötig.

## Kontext

- **Referenzen:** siehe `references.md`.
- **Produktbezug:** Roadmap Phase 1c Punkte 3 (Landanteil) und 8; Zahlen in `agent-os/product/ki-balance.md`, Abschnitt „Nachmessung 3“.

## Angewandte Standards

Noch keine, siehe `standards.md`.
