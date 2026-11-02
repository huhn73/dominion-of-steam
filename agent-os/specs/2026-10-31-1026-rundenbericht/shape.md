# Rundenbericht: Shaping-Notizen

## Umfang

Dritte Spec aus Playtest Runde 1 (`agent-os/product/playtest-runde-1.md`, Abschnitt „Spec 3“, Punkt 11, plus Hinweis aus der Startstädte-Prüfung). Zu Beginn des eigenen Zuges erscheint ein Bericht darüber, was seit dem letzten eigenen Zug im Sichtbereich geschah: Verluste, Gefechte, Stadtwechsel, Entdeckungen, gesehene Gegnerbewegungen und eigene Meldungen. Engine (neue Ereignisse, Schnappschuss pro Teilnehmer), Profil (neue Einstellung) und Web-Client (Berichtskarte) sind betroffen; die Replay-Mechanik bleibt unverändert.

## Entscheidungen

- **Darstellung:** Berichtskarte **vor** der Wiedergabe. Mit anstehender Wiedergabe: „Gegnerzüge ansehen“ startet das Replay, „Überspringen“ schließt Karte und Replay. Ohne Wiedergabe: „Weiter“. Verworfen: Karte nach der Wiedergabe; nur ein Abschnitt im Ereignisprotokoll.
- **Neue Ereignisse:** `cityDiscovered` (Stadt erstmals gesehen oder Besitzerwechsel bemerkt) und `enemySighted` für Feindeinheiten, die zu Zugbeginn neu im Sichtbereich stehen. Verworfen: nur Städte; keine neuen Ereignisse.
- **Gegnerbewegungen:** Je Replay-Aktion eine Zeile mit Einheit, Spieler und Endpunkt bzw. Ergebnis; Klick zentriert die Karte. Verworfen: Zähler ohne Details; erneute Wiedergabe aus dem Bericht.
- **Umfang:** Eigene Meldungen (fertige Einheiten, Treibstoff) als Abschnitt „Eigenes Reich“. Ruhige Runden ohne Ereignisse und ohne Replay zeigen keinen Bericht. Neue Einstellung „Rundenbericht zu Zugbeginn“ (`display.turnReport`, Standard an). Verworfen: Bericht jede Runde mit „Ruhige Runde“.

## Regeln

- **Schnappschuss:** Am Ende des eigenen Zuges merkt sich der Teilnehmer `seenAtTurnEnd`: bekannte Städte mit zuletzt gesehenem Besitzer und die IDs der sichtbaren fremden Einheiten. Zu Beginn des nächsten Zuges wird verglichen: neue Stadt → „entdeckt“, anderer Besitzer (und vorher nicht die eigene Stadt, dafür gibt es `cityLost`) → „ist jetzt in der Hand von …“, fremde Einheit auf sichtbarem Feld ohne Eintrag im Schnappschuss → „gesichtet“ (eine Meldung je Feld). Ohne Schnappschuss (erste Runde, alte Spielstände) keine Meldungen.
- **Abschnitte und Reihenfolge:** Verluste (`unitLost`), Städte (`cityLost`, `cityCaptured`), Gefechte (`combat`), Entdeckt (`enemySighted`, `cityDiscovered`), Gegnerbewegungen (Replay), Eigenes Reich (`unitBuilt`, `fuelLow`). Leere Abschnitte entfallen.
- **Buttons je Lage:** Phase `replay` mit Aktionen und „Gegnerzüge automatisch abspielen“ an → „Gegnerzüge ansehen“ + „Überspringen“. Phase `replay` mit abgeschalteter Wiedergabe → „Weiter“ (überspringt). Phase `yourTurn` → „Weiter“. Erneut geöffnet aus dem Ereignisprotokoll → „Schließen“.
- **Einmal pro Zug:** Der Client merkt sich je Partie Runde und Spieler im `localStorage`; ein Reload in derselben Runde zeigt den Bericht nicht erneut. Über „Rundenbericht anzeigen“ im Ereignisprotokoll ist er jederzeit wieder erreichbar.
- **Eingriffe:** Ein Klick auf einen Eintrag zentriert die Karte und markiert das Ereignis als gelesen; die Karte bleibt offen und liegt am Rand (Desktop rechts oben, mobil als Bottom-Sheet).

## Kontext

- **Visuals:** Keine Vorlagen; Screenshots der Umsetzung in `visuals/`.
- **Referenzen:** siehe `references.md`.
- **Produktbezug:** Roadmap Phase 1b, Punkt 3. Design-Übergabe `product-plan/sections/spielfeld-and-zuge/README.md` sieht nur Wiedergabe plus Ereignisprotokoll vor; der Bericht kommt aus dem Playtest.

## Angewandte Standards

Noch keine, siehe `standards.md`.
