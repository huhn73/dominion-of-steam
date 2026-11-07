# Geländeregeln: Shaping

Anlass: Der Nutzer wollte die Regeln für Einheiten auf unterschiedlichem Gelände sehen und bewerten
(7. November 2026). Stand vorher: Gelände wirkte nur als Abwehrbonus für alle Landeinheiten
(Wald/Hügel +1, Gebirge +2), Bewegung kostete überall 1, Sicht hing nur am Bereich,
Flach- und Tiefwasser waren regeltechnisch gleich.

Bewertung und Entscheidung (alle vier Vorschläge freigegeben):

- **A Bewegung:** Wald, Hügel und Gebirge beenden die Bewegung von Fahrzeugen (Panzerwagen,
  Dampfkoloss). Felder mit Stadt nicht (Straßen). Wer noch eine Bewegung hat, kann immer ein
  Feld betreten. Wegsuche für Fahrzeuge gewichtet raues Gelände mit einer vollen Runde.
- **B Abwehr je Einheit:** Grenadiere wie bisher, Fahrzeuge nur auf Hügeln +1.
- **C Sicht:** Landeinheiten sehen von Hügeln und Gebirge 2 Felder statt 1.
- **D Flachwasser:** Tauchboote sind dort für alle sichtbar.

Fahrzeuge sind per Id-Menge festgelegt (`VEHICLE_UNIT_TYPES` in `rules.ts`), wie die
Tarnung (`STEALTH_UNIT_TYPES`), ohne neues Datenfeld im Katalog.
