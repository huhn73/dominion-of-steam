# Flugzeuge erkunden: Shaping-Notizen

## Umfang

Vierte Spec aus Playtest Runde 1 (`agent-os/product/playtest-runde-1.md`, Abschnitt „Spec 4“, Punkt 12). Im Shaping präzisiert: Statt einer Patrouille über einer Stadt ist ein **Erkundungsbefehl** gemeint. Dazu der Treibstoffschutz, weil im Playtest mehrere Flugzeuge abgestürzt sind, nachdem sie versehentlich zu weit gezogen wurden. Betroffen: Engine (neuer Befehl, Rundenlogik), gemeinsame Treibstoffregeln in `packages/shared`, Web-Client (rote Felder, Bestätigung, Zugende-Warnung, Buttons).

## Entscheidungen

- **Erkunden:** Nur Flugzeuge. Jede Runde (und sofort beim Erteilen) zum nächsten erreichbaren Nebelrand mit sicherem Rückweg; bei knappem Treibstoff zur nächsten Basis, tanken, weiter. Nichts mehr erreichbar → „Erkundung abgeschlossen“. Verworfen: feste Flugrichtung; Erkunden ohne Heimflug; Erkunden für Schiffe und Landeinheiten.
- **Stopp:** Feindeinheit oder bisher unbekannte fremde Stadt in Sicht → Befehl aufheben, Flugzeug braucht Befehle, Ereignis. Verworfen: nur Feindeinheiten.
- **Treibstoffschutz:** Felder ohne Rückweg rot schraffiert, Bestätigung „Kein Rückweg … Trotzdem fliegen?“, Zugende-Warnung. Verworfen: nur Dialog; serverseitige Sperre.
- **Rückweg:** Luftlinie zur nächsten Basis (eigene Stadt oder eigener Träger), sicher wenn Resttreibstoff ≥ Distanz. Button „Zur Basis“. Verworfen: Puffer einer Bewegung wie bei der KI.

## Regeln

- **Erkundungsrunde:** Solange Bewegung und Treibstoff übrig sind: nächstes Nebelrand-Feld (erforscht, betretbar, mit unerforschtem Nachbarn) wählen, das mit sicherem Rückweg erreichbar ist; schrittweise hinfliegen. Nach jedem Schritt Sicht aktualisieren: neue Feindeinheit oder neue fremde Stadt → Stopp. Kein sicheres Ziel → zur nächsten Basis fliegen und dort bleiben; nach dem Auftanken geht es weiter. Auch von einer Basis mit vollem Tank kein Nebelrand erreichbar → Befehl endet mit Meldung.
- **Sicher:** `Treibstoff nach dem Zug ≥ Hex-Distanz zur nächsten Basis`. Basen selbst sind immer sicher.
- **Ereignisse:** Stopps als `enemySighted` („Erkundung: feindliche Panzerwagen (Admiral Kessler) bei 5,7 entdeckt.“) und `cityDiscovered` („Erkundung: Stadt Nebelkap entdeckt, in der Hand von …“); Ende als neuer Typ `exploration` („Erkundung abgeschlossen: kein unerforschtes Feld mehr erreichbar.“). Der Rundenbericht wiederholt Stopps nicht.
- **Dialogtexte:** „Kein Rückweg“ mit „Der Treibstoff reicht nicht bis zum Ziel.“ bzw. „Nach diesem Zug hat der Doppeldecker noch 2 Treibstoff, die nächste Basis ist 4 Felder entfernt.“, Buttons „Abbrechen“ / „Trotzdem fliegen“. Zugende: „1 Flugzeug erreicht mit seinem Treibstoff keine Basis mehr: Doppeldecker bei 8,3 (Treibstoff 2, Basis 4 Felder).“

## Kontext

- **Visuals:** Keine Vorlagen; Screenshots der Umsetzung in `visuals/`.
- **Referenzen:** siehe `references.md`.
- **Produktbezug:** Roadmap Phase 1b, Punkt 4 (Beobachtung im Shaping präzisiert).

## Angewandte Standards

Noch keine, siehe `standards.md`.
