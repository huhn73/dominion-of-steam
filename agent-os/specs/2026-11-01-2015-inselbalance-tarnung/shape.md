# Inselbalance, Träger und Tauchboot-Tarnung: Shaping-Notizen

## Umfang

Roadmap Phase 1c Punkt 11, drei Teile in der Reihenfolge des Spielers (1. November 2026):

1. **Aurelia auf Inselwelten abschwächen:** Die Blitzkorvette fuhr als Standard-Geleitschutz und entschied Inselduelle 80–88 %.
2. **„Leicht“ nachjustieren:** Mit den neuen Kartengrößen lag „leicht“ auf dem Kontinent bei 31 % (Ziel 15–30 %).
3. **Regeln (Spieler):** „Flugträger sollen Basis für Flugzeuge sein und Tauchboote sind nur sichtbar, wenn man gegen sie fährt oder selbst ein Tauchboot ist.“

## Entscheidungen

- **Geleitschutz:** Jeder Frachter bekommt ein Kanonenboot; eine See-Sondereinheit (Aurelias Blitzkorvette) nur mit dem Sondereinheiten-Anteil (`specialShare`: normal 0, schwer 0,15, „Seekrieg“ +0,15). Kanonenboote zählen als Geleit, Träger nicht.
- **Leicht:** Aussetzer-Anteil 0,15 → 0,2.
- **Gleichzeitige Aufträge:** Was andere eigene Städte gerade bauen, zählt bei Frachtern, Geleit und Trägern mit; vorher legten alle freien Küstenstädte zugleich dasselbe auf (7,5 Träger, 7,6 Frachter je Partie).
- **Frachter je Stufe:** Die doppelten Frachter waren der eigentliche Motor auf Inseln; nach sauberer Zählung fiel „schwer“ auf 47 %. Sweep auf Inseln gegen eine Referenz mit einem Frachter: normal mit zwei 66 %, schwer mit drei bis vier 74–84 %. Gesetzt: normal 2, schwer 3, „Seekrieg“ +1.
- **Träger als Flugbasis:** Die Engine konnte das schon (Landen per Bewegung, Tanken zu Zugbeginn, kein Absturz an Bord, Start per Bewegung, `airBases` zählt eigene Träger; Test `engine.test.ts` „lässt Flugzeuge auf dem Träger landen und wieder starten“). Neu ist die KI: „schwer“ (und „Luftkrieg“) baut einen Träger, sobald ein Frachter und der volle Bomberverband existieren und kein Träger da ist oder gebaut wird; der Träger begleitet den Konvoi wie ein Kriegsschiff, Bomber nutzen ihn als Rückkehrbasis und für die Treibstoffprüfung.
- **Tauchboot-Tarnung:** Ein feindliches Tauchboot ist auch auf sichtbaren Feldern verborgen. Sichtbar wird es (a) mit einem eigenen Tauchboot im Umkreis von zwei Feldern (Sonar), (b) wenn eine eigene Einheit dagegen fährt: Die Bewegung endet davor (wie bisher bei jeder verdeckten Einheit, Ereignis „Weg … versperrt“), und das Tauchboot bleibt für diesen Teilnehmer bis zum nächsten Zugbeginn seines Besitzers sichtbar und angreifbar (`UnitState.revealedTo`). Getarnte Tauchboote erscheinen nicht in Sicht, Sichtungsbericht, Wachalarm, Erkundungsstopp und Wiedergabe (`seenBy`). Verworfen: Sichtbarkeit nach eigenem Angriff des Tauchboots (vom Spieler nicht verlangt; der Verteidiger erfährt vom Kampf über Meldung und Ergebnis).
- **Eine Stelle für die Regel:** `hiddenFrom` und `seesUnit` in `engine/visibility.ts`, `STEALTH_UNIT_TYPES` (heute nur `tauchboot`). Alle Sichtpfade nutzen `seesUnit`; die KI sieht nur ihre Projektion und hält sich damit automatisch an die Tarnung.

## Kontext

- **Referenzen:** siehe `references.md`.
- **Produktbezug:** Roadmap Phase 1c Punkt 11; Befunde in `agent-os/product/ki-balance.md` („Nachmessung Inselwelt“, „Nachmessung Inselbalance“).

## Angewandte Standards

Noch keine, siehe `standards.md`.
