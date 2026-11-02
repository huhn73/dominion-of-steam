# Spec: 03 Fraktionen & Einheiten (Kompendium)

## Kontext
Meilenstein 03 (`product-plan/instructions/incremental/03-fraktionen-and-einheiten.md`): ein rein lesendes Kompendium aller Fraktionen und Einheitentypen mit Detailansichten. Der Navigationspunkt „Fraktionen“ zeigt bisher eine Platzhalterseite. Die Illustrationen liegen bereits in `public/art/`.

## Aufgaben
1. **Spec-Dokumentation speichern** (dieser Ordner)
2. **Stammdaten in `packages/shared/src/compendium/`:** Datentypen aus `types.ts` des Bereichs und Daten aus `sample-data.json`. `FACTIONS` und `UNIT_TYPES` der Spiel-Engine werden daraus abgeleitet, damit es nur eine Datenquelle gibt.
3. **Server:** `GET /api/compendium` liefert `{ factions, unitTypes }`.
4. **Web:**
   - Komponenten unverändert nach `apps/web/src/sections/fraktionen/components/` kopieren; `types.ts` re-exportiert die Datentypen aus shared und enthält die Props unverändert.
   - Hook `useCompendium()` (TanStack Query, lange gecacht).
   - Seiten `/fraktionen`, `/fraktionen/:factionId` und `/einheiten/:unitTypeId?ausfuehrung=<factionId>` mit Lade-, Fehler- und Nicht-gefunden-Zustand.
   - „Zurück“ springt im Verlauf zurück; bei Direktaufruf führt es zum Kompendium bzw. bei Einheiten mit Ausführung zur Fraktion.
   - `EinheitDetail` bekommt den `key` aus Einheit und Ausführung.
   - „Fraktionen“ in der Navigation ist auch auf `/einheiten/…` aktiv.
5. **Tests:**
   - Gleichheit von `bonusEffect` (Kompendium) und `withBonus` (Spiel) für alle Kombinationen aus Fraktion, Einheit und Wert.
   - Abläufe 1–4 aus der Anleitung über die Routen, Leerzustand beim Filtern, Laden, Fehler, unbekannte IDs.
   - Server-Endpunkt.
6. **Prüfen:** Docker neu bauen; Screenshots im hellen und dunklen Modus und auf dem Smartphone mit den Vorlagen vergleichen.

## Entscheidungen
- Die Stammdaten kommen vom Server statt aus `sample-data.json`, mit nur einer Quelle für Kompendium und Spiel.
- Die Komponenten aus der Übergabe bleiben unverändert. `bonusEffect` aus `theme.ts` bleibt bestehen; ein Test sichert die Übereinstimmung mit der Spiellogik.
- Filter und Ausführung bleiben lokaler Zustand, wie in der Übergabe vorgesehen.
