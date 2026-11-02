# Kartengrößen: Shaping-Notizen

## Umfang

Spec 3 aus Playtest Runde 2 (`agent-os/product/playtest-runde-2.md`, Punkt 7). Fünf quadratische Kartenstufen von 20×20 bis 200×200 Feldern; dafür kompakte Felddaten, komprimierte Antworten, gedeckelte Wegsuche und KI-Arbeit, Gelände und Minikarte auf Canvas, Kamera außerhalb des React-States, neuer Setup-Schritt mit Rundenlimit je Stufe. Keine neuen Screens.

## Entscheidungen

- **Fünf Stufen, geometrisch (Spieler):** Klein 20×20 (400 Felder), Mittel 40×40 (1.600), Groß 75×75 (5.625), Riesig 130×130 (16.900), Imperium 200×200 (40.000). Die Ids `small … huge` bleiben und bekommen `empire`, damit gespeicherte Setups, Presets und Tests weiterlaufen; laufende Partien behalten ihre Maße und zeigen in der Lobby „Breite×Höhe“, wenn keine Stufe passt. Verworfen: alte Stufen behalten plus drei neue; nur eine Stufe größer; linear; unten dichter.
- **KI-Budget (Spieler):** höchstens 10 Sekunden je KI-Zug auf Imperium. Umgesetzt als deterministisches Arbeitsbudget (Befehl 20, Suchknoten 1, 60.000 je Zug, 3.000 je Wegsuche) plus Wanduhr-Ventil, das nur der Server setzt. Verworfen: 3 Sekunden; kein Budget.
- **Städte (Spieler):** proportional zur Landfläche, aber deutlich dünner als bisher („heute waren es recht viele Städte“): 45 / 30 / 20 Landfelder je Stadt statt 18 / 12 / 8. Imperium ≈ 600, Riesig ≈ 250, Groß ≈ 85, Mittel ≈ 24, Klein ≈ 6. Namen: die 40 klassischen zuerst, danach generiert aus 40 Vorsilben × 40 Grundwörtern ohne Wiederholung; kleine Karten verbrauchen keine zusätzlichen Zufallszahlen. Verworfen: streng proportional (≈ 1.500 Städte); fest je Stufe; Dichte-Regler.
- **Rundenlimit (Spieler):** 50, 100, 150, 250, 500 und „Ohne Limit“ (`null`, nur mit anderer Siegbedingung), Vorgabe je Stufe 50 / 100 / 150 / 250 / 500; der Assistent übernimmt die Vorgabe beim Stufenwechsel, solange der Spieler das Limit nicht selbst geändert hat.
- **Empfohlene Spieler:** Klein 2–3, Mittel 2–4, Groß 3–6, Riesig 4–6, Imperium 4–6; Sitze bleiben 2–6.
- **Kompaktes Datenformat (Konsequenz):** Spielstand hält Gelände als Zeichenkette (ein Zeichen je Feld, Codes wie in den Test-Fixtures), Erkundung je Teilnehmer als Bitset (Base64, 6 Bit je Zeichen); die Sicht geht als `terrain` plus `visibility` (u/e/v) über die Leitung, Antworten sind komprimiert. Alte Spielstände werden beim Laden umgerechnet. Imperium: Sicht ≈ 80 KB statt ≈ 2,7 MB, Spielstand ≈ 300 KB statt ≈ 4 MB.
- **Engine-Kosten je Befehl:** Sicht und Index ohne Feldobjekte, Erkundung inkrementell, Küstenprüfung über Nachbarn, Wegsuche als BFS über Indizes mit Budget, Verlauf und Ereignisse werden am Rundenende gekürzt. KI-Erkundung sucht den Nebelrand erst im Umkreis.
- **Darstellung (Konsequenz):** Gelände und Nebel als gekachelte Canvas-Bitmaps je Zoomstufe, SVG nur für Overlays im Sichtbereich, Minikarte als Canvas, Kamera in einem Store mit Pan-Clamping, Mindestzoom bis „Karte einpassen“, Tasten.
- **Außerhalb des Umfangs:** gleichzeitige Züge im Vorspiel (Spec 4), Rechteckkarten, Kartenvorschau im Setup, Server-Diffs der Sicht, KI-Züge außerhalb der Transaktion (bis zu 6 × 10 s Sperre bleiben), Simulationspaket `packages/sim` jenseits der Typanpassung.

## Nachtrag (1. November 2026, nach der KI-Prüfung)

- **Rundenlimit Mittel 100 → 150 (Spieler):** Auf 40×40 mit Limit 100 endeten 191 von 200 KI-Duellen am Rundenlimit; mit 150 und 35 % Land enden 55 % durch Ausschaltung (Median 145 Runden). Klein mit 50 bleibt eng (mit 75 wären es 56 % Ausschaltungen, 75 ist aber keine wählbare Stufe), Vorgabe unverändert.
- **Hauptstädte zufällig über die Landmassen (Spieler):** Die erste Hauptstadt ist ein zufälliger Kandidat statt ein Platz auf der größten Landmasse; die weiteren kommen per Farthest-Point-Sampling, das Landmassen ohne Hauptstadt bevorzugt. Inseln zählen schon ab einem Zwölftel des Landanteils je Sitz (vorher einem Viertel). Ergebnis bei vier Sitzen, 20 Seeds: 25 % Land auf Mittel 13 von 20 Karten mit getrennten Hauptstädten (vorher 6), 35 % 9 von 20 (vorher 4), 45 % 6 von 20 (vorher 1).
- **Landanteil (Spieler):** Sinnvoll sind 20–40 %; Vorgabe im Assistenten 45 → 35 %, DevBar-Preset 50 → 35 %, Simulation 55 → 35 %. Der Regler bleibt 20–70 %.

## Regelmodell

- Stadtzahl = round(Landfelder / Landfelder-je-Stadt), Mindestabstand 3 zu jeder Stadt und Hauptstadt, Küste bevorzugt.
- Hauptstädte (Kontinent): erste zufällig, weitere per Farthest-Point-Sampling mit Vorrang für Landmassen ohne Hauptstadt, auf Landmassen ab max(6, Land / (Sitze · 12)) Feldern (Nachtrag). Inselwelten: siehe `agent-os/specs/2026-11-01-1830-inselwelt/`.
- Rundenlimit `null`: kein Ende durch Rundenzahl; die Simulation prüft dieselbe Bedingung.

## Kontext

- **Visuals:** Screenshots in `visuals/`.
- **Referenzen:** siehe `references.md`.
- **Produktbezug:** Roadmap Phase 1c, Punkt 3; Karten bis 200×200.

## Angewandte Standards

Noch keine, siehe `standards.md`.
