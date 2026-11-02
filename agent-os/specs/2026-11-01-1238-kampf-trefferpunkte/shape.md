# Kampfsystem mit Trefferpunkten: Shaping-Notizen

## Umfang

Spec 2 aus Playtest Runde 2 (`agent-os/product/playtest-runde-2.md`, Punkte 4 bis 6). Trefferpunkte und Schadenswert je Einheitentyp, Kampf in Runden bis zur Vernichtung einer Seite, Angriff kostet einen Bewegungspunkt, Städte werden von Infanterie und Panzern „verbraucht“ erobert, Anzeige in Trefferpunkten. Engine in `packages/shared/src/game/`, KI, Angriffsdialog, Kampfsequenz, Panels und Kompendium. Keine neuen Screens.

Dies nimmt die Entscheidung „Angriff beendet den Zug, keine Angriffskosten in Bewegungspunkten“ aus `agent-os/specs/2026-10-31-0207-kampfregeln/shape.md` zurück. Domänenmatrix, Nachrücken, Gelände- und Stadtbonus sowie Stadtschaden unter Beschuss bleiben.

## Entscheidungen

- **Kampfkonzept vom Spieler.** Der Spieler hat Einheitenwerte (Trefferpunkte, Schaden) und das Kampfkonzept vorgegeben: Trefferchance einmal vor dem Kampf berechnet, konstant über alle Runden; je Runde trifft entweder der Angreifer den Verteidiger oder der Verteidiger den Angreifer, jeweils mit seinem Schadenswert. Der Kampf läuft bis zur Vernichtung einer Seite. Eine zunächst gewählte Begrenzung auf drei Treffer je Angriff wurde revidiert. Fernkampf (endet beim ersten Fehlschlag) gibt es hier nicht.
- **Werte je Typ** (Blatt; Dampfkoloss 3/2 und Wolkenkreuzer 2/2 ergänzt): Grenadiere 1/1, Panzerwagen 2/1, Dampfkoloss 3/2, Doppeldecker 1/1, Schwerbomber 1/2, Wolkenkreuzer 2/2, Frachter 3/1, Kanonenboot 3/1, Tauchboot 2/3, Blitzkorvette 8/2, Panzerkreuzer 12/3, Flugzeugträger 8/1 (TP/Schaden). Stärke, Abwehr und Bewegung bleiben; Stärke gegen Abwehr liefert nur noch die Trefferchance a/(a+d), ohne Zustandsfaktor (beschädigte Einheiten kämpfen voll).
- **Angriffskosten:** 1 Bewegungspunkt, Flugzeuge zusätzlich 1 Treibstoff (ein Zug = ein Treibstoff). Nachrücken nach Vernichtung des Verteidigers ist frei. Grenadiere und Dampfkoloss fahren oder greifen an; Panzerwagen greift zweimal an oder fährt und greift an.
- **Stadtangriff nach Blatt:** Stadt ohne Verteidiger: ein Wurf gegen die Stadtabwehr, der Angreifer ist danach immer verbraucht. Bei Sieg wechselt die Stadt den Besitzer; ein unbeschädigter Panzerwagen oder Dampfkoloss hinterlässt Grenadiere, Grenadiere hinterlassen eine leere Stadt. Verworfen: Einrücken des Angreifers wie bisher.
- **Reparatur:** +1 TP je Runde in eigener Stadt bis zum Maximum. Verworfen: volle Reparatur nach einer Runde.
- **Anzeige:** Trefferpunkte „2/3“ statt Prozent, Angriffsdialog mit Siegchance (Kampf gewinnen), Trefferchance je Runde, Schaden je Treffer und erwartetem eigenem Verlust; Markierungen auf der Karte zeigen die Siegchance.
- **KI:** Mehrere Befehle je Einheit und Runde (fahren, angreifen, nochmals angreifen); Angriffsbewertung über die Siegchance aus der Odds-Funktion, Schwellen bleiben; beschädigte Panzerwagen opfern sich nicht für eine Stadt.
- **Außerhalb des Umfangs** (spätere Specs): Luftwaffenstützpunkte, Sichtbarkeit von Tauchbooten, abweichende Bewegungs- und Bauwerte des Blatts, Tragfähigkeit nach Zustand.

## Regelmodell

- Einheit: `hp` 1 … `hitPoints`. Reparatur +1 je Runde in eigener Stadt. Neue Einheiten voll.
- Nahkampf: `p = a/(a+d)` mit Fraktionsbonus, Gelände (nur Landverteidiger), Stadt +1, Befestigung. Runden bis `hp ≤ 0` einer Seite; Angreifertreffer −`damage` des Angreifers beim Verteidiger, sonst −`damage` des Verteidigers beim Angreifer. Belagerung (Verteidiger in fremder Stadt) erhöht den Stadtschaden einmal je Angriff wie bisher.
- Stadt ohne Verteidiger: `p = a/(a + 1 + Befestigung)`, ein Wurf; Angreifer immer verbraucht; Garnison nur bei `hitPoints > 1` und vollem `hp`.
- Odds (`rules.ts`): `killChance = Σ_{j<m} C(k−1+j, j) p^k (1−p)^j` mit `k` nötigen Angreifertreffern und `m` nötigen Verteidigertreffern; `deathChance = 1 − killChance`; `expectedDamageTaken` aus derselben Verteilung.
- Migration: alte Spielstände mit `health` 0–100 bekommen beim Laden `hp = max(1, round(health/100 · hitPoints))`.

## Kontext

- **Visuals:** Screenshots der Umsetzung in `visuals/`.
- **Referenzen:** siehe `references.md`.
- **Produktbezug:** Roadmap Phase 1c, Punkt 2. Zielgruppe laut `mission.md` sind Veteranen klassischer Eroberungsspiele.

## Angewandte Standards

Noch keine, siehe `standards.md`.
