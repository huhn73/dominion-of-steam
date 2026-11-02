# UI-Datenformen

Diese Typen beschreiben die Daten, die die UI-Komponenten als Props erwarten. Sie sind der **Frontend-Vertrag**: Das brauchen die Komponenten, um korrekt darzustellen.

Wie die Daten im Backend modelliert, gespeichert und geladen werden, ist eine Entscheidung der Umsetzung. Typen dürfen zusammengelegt, aufgeteilt oder erweitert werden. Das fachliche Gesamtmodell steht in der Produktübersicht und ausführlich im Design-OS-Projekt unter `product/data-shape/data-shape.md`.

## Entitäten

- **Match, Participant, GameMap/Tile, City, Unit, UnitType, Faction, GameEvent, ReplayAction, CombatPreview, CombatResult:** Partie aus Sicht eines Spielers mit Karte, Kriegsnebel, Einheiten, Ereignissen und Gegnerzug-Wiederholung (Bereich: spielfeld-and-zuge)
- **Faction (mit Bonus, Geschichte, Bildern), UnitType (mit Beschreibung, Taktik, Fraktionsvarianten):** Kompendium (Bereich: fraktionen-and-einheiten)
- **MatchDraft, Seat, MapSettings, SetupOptions, AiPersonality, Friend, Player:** Entwurf einer neuen Partie und Auswahllisten (Bereich: partie-setup-and-ki-gegner)
- **Match (Lobby-Sicht mit Mini-Lagekarte), Participant, Invitation, OpenMatch, FinishedMatch, WaitingRoom, WaitingSeat:** Lobby und Warteraum (Bereich: lobby-and-multiplayer)
- **Profile, PlayerStats, FactionStat, HistoryEntry, Settings (Notification/Display/Sound/Control), Account:** Profil und Einstellungen (Bereich: spielerprofil-and-einstellungen)

**Hinweis:** Gleichnamige Typen in verschiedenen Bereichen sind bewusst unterschiedlich zugeschnitten. `Faction` im Spielfeld braucht z. B. weniger Felder als im Kompendium. Im Backend sind es dieselben Entitäten, nur in unterschiedlicher Projektion.

## Typen je Bereich

Jeder Bereich hat eine eigene `types.ts` mit den vollständigen Interfaces inklusive Props:

- `sections/spielfeld-and-zuge/types.ts`
- `sections/fraktionen-and-einheiten/types.ts`
- `sections/partie-setup-and-ki-gegner/types.ts`
- `sections/lobby-and-multiplayer/types.ts`
- `sections/spielerprofil-and-einstellungen/types.ts`

## Kombinierte Referenz

`overview.ts` fasst alle Daten-Interfaces zusammen, je Bereich in einem eigenen Namensraum (`Spielfeld`, `Fraktionen`, `PartieSetup`, `Lobby`, `Profil`).
