# Kampfregeln: Shaping-Notizen

> **Überholt am 1. November 2026** durch `agent-os/specs/2026-11-01-1238-kampf-trefferpunkte/`: Der Angriff kostet jetzt einen Bewegungspunkt statt den Zug zu beenden, Stärke und Abwehr werden nicht mehr mit dem Zustand skaliert, der Kampf läuft in Runden mit Trefferpunkten und Schadenswert, und ein Stadtangriff verbraucht den Angreifer. Domänen, Nachrücken, Boni und Stadtschaden gelten weiter.

## Umfang

Erste Spec aus Playtest Runde 1 (`agent-os/product/playtest-runde-1.md`, Abschnitt „Spec 1“). Fünf Regel-Lücken der Kampf-Engine in `packages/shared/src/game/`: Domänen beim Angriff, Nachrücken nach Sieg, Heranfahren (nur Anzeige), Gelände- und Stadtbonus, Produktivitätsverlust von Städten unter Beschuss. Keine neuen Screens, keine neuen Entitäten; Anzeige-Ergänzungen im Angriffsdialog, Stadt-Panel und Kompendium.

## Entscheidungen

- **Domänen:** Klassisch mit Erweiterung. Land greift Land, Flugzeuge am Boden und Schiffe auf benachbarten Feldern an (Küstengewässer und Hafenstädte). See greift See, Landeinheiten auf Küstenfeldern und Flugzeuge an. Tauchboot nur Schiffe. Frachter (Stärke 0) nie. Luft greift alles an. Städte erobern weiterhin nur Einheiten mit `canCaptureCities`.
- **Nachrücken:** Nach Sieg gegen eine Einheit rückt der Angreifer auf das Zielfeld, wenn er es betreten darf, dort kein weiterer Gegner steht und keine fremde Stadt liegt. Der Angriff beendet den Zug der Einheit (0 Bewegungspunkte, wie bisher). Angriffskosten in Bewegungspunkten (zweimal angreifen pro Runde) wurden verworfen.
- **Boni:** Additiv auf die Abwehr, passend zur bestehenden Formel „Stärke × Zustand gegen Abwehr × Zustand, +1 in Städten“. Prozentuale Boni und ein Angriffsbonus aus der Stadt wurden verworfen.
- **Produktivität:** Schadenswert 0–3 je Stadt statt reiner Verzögerung oder Produktionsstopp, weil er sichtbar ist, sich erholt und Belagerungen spürbar macht, ohne eine Stadt lahmzulegen.
- **Heranfahren:** Ist in `commands.ts` bereits umgesetzt (Reichweite fest 1, Einheit fährt auf das nächste Nachbarfeld). Offen war nur die Anzeige: der Angriffsdialog nennt jetzt die Felder, die die Einheit heranfährt.
- **Balance:** Werte (Boni, Schadensdeckel) sind erste Setzung und werden nach Playtest Runde 2 nachjustiert.

## Regelmodell

- **Domänenmatrix (Angreifer → Ziel):**
  - Land → Land: ja. Land → Luft: nur über Land. Land → See: ja (Ziel ist durch Reichweite 1 immer benachbart, also Küste oder Hafen).
  - See → See: ja. See → Land: nur auf Küstenfeldern (Feld mit Wasser-Nachbar). See → Luft: ja. Tauchboot: nur See.
  - Luft → alles.
  - Stärke 0 (Frachter): keine Angriffe.
- **Nachrücken:** Bedingungen: Domäne darf Zielfeld betreten (Land nicht ins Wasser, See nicht an Land, Luft überall), kein weiterer Gegner auf dem Feld, keine Stadt mit anderem Besitzer auf dem Feld. Ladung zieht mit, Flugzeuge zahlen 1 Treibstoff. `movesLeft` bleibt 0.
- **Abwehrboni (additiv):**
  - Gelände, nur für Landeinheiten als Verteidiger: Ebene 0, Wald +1, Hügel +1, Gebirge +2.
  - Stadt: +1 für alle Einheiten darin (auch Schiffe im Hafen), Salzküsten-Liga zusätzlich +1 (bestehende Befestigung).
  - Leere Stadt: Abwehr 1 + Befestigung (unverändert).
- **Stadtschaden:** `damage` 0–3, `underFire` Marker.
  - Jeder Angriff auf die Stadt oder auf eine Einheit in der Stadt (Sieg oder Niederlage des Angreifers, auch neutrale Städte): `damage + 1` (max. 3), `underFire = true`, laufende Produktion `turnsRemaining + 1`.
  - Zu Beginn der Runde des Besitzers: war die Stadt unter Beschuss, wird nur der Marker gelöscht; sonst `damage − 1`.
  - Neue Bauaufträge und der automatische Neustart dauern `Basis + damage` Runden.
  - Eroberung behält `damage`, löscht `underFire`.

## Kontext

- **Visuals:** Keine. Keine neuen Screens; Screenshots der Umsetzung liegen in `visuals/`.
- **Referenzen:** siehe `references.md`.
- **Produktbezug:** Roadmap Phase 1b, Punkt 1. Zielgruppe laut `mission.md` sind Veteranen klassischer Eroberungsspiele; die Regeln setzen auf Domänen, Nachrücken und Gelände.

## Angewandte Standards

Noch keine, siehe `standards.md`.
