# Dominion of Steam: Produktübersicht

## Zusammenfassung

Dominion of Steam ist ein rundenbasiertes Eroberungsspiel in einer alternativen Dieselpunk-Welt, das im Browser auf Desktop und Mobilgeräten läuft. Spieler erkunden prozedural erzeugte Kontinente unter Kriegsnebel, erobern Städte, lassen dort Einheiten zu Land, zu Wasser und in der Luft bauen und treten mit eigenständigen Fraktionen gegeneinander oder gegen KI-Gegner an.

**Probleme und Lösungen:**
- **Klassische Eroberungsstrategie wirkt veraltet:** moderne Grafik im eigenen Dieselpunk-Stil, zeitgemäße Bedienung, gleiche strategische Tiefe.
- **Gemeinsames Spielen scheitert an Terminen:** Neben Live-Sitzungen gibt es asynchrone Partien mit Benachrichtigung, wenn man am Zug ist.
- **Strategiespiele sind an den PC gebunden:** komplett im Browser, für Maus und Touch, auf dem Desktop beginnen und auf dem Smartphone fortsetzen.
- **Partien wiederholen sich:** prozedurale Karten und Fraktionen mit eigenen Stärken und Sondereinheiten.
- **Nicht immer sind Mitspieler da:** KI-Gegner in mehreren Schwierigkeitsstufen.

**Wichtige technische Anforderungen:**
- **Dauerhafte Spielstände:** Der Server speichert jede Partie nach jedem Zug, sodass laufende Partien einen Neustart oder Absturz des Servers ohne Verlust überstehen.
- **Benachrichtigungen:** Push im Browser und E-Mail, je Anlass einstellbar (siehe Bereich „Spielerprofil & Einstellungen“).
- **Klangwelt:** adaptive Musik, Fraktionsthemen und Umgebungsgeräusche, siehe `briefs/audio-brief.md`.
- **Illustrationen:** Einheiten, Fraktionsvarianten, Wappen und Kopfbilder, siehe `briefs/art-brief.md`.

## Geplante Bereiche

1. **Spielfeld & Züge:** Kartenansicht mit Kriegsnebel, Städten, Einheitenbewegung, Kampf und Rundenablauf, solo gegen eine einfache KI spielbar.
2. **Fraktionen & Einheiten:** Kompendium der Fraktionen und aller Einheitentypen mit Werten, Sondereinheiten, Fraktionsvarianten und Bauzeiten.
3. **Partie-Setup & KI-Gegner:** Assistent für neue Partien mit Regeln, eigener Fraktion, Gegnern und Mitspielern, Karteneinstellungen und KI-Persönlichkeiten.
4. **Lobby & Multiplayer:** Startseite mit eigenen Partien, Einladungen, offenen und beendeten Partien sowie Warteraum.
5. **Spielerprofil & Einstellungen:** Bilanz, Partieverlauf und Einstellungen für Benachrichtigungen, Darstellung, Ton, Steuerung und Konto.

## Produkt-Entitäten

- **Player:** registrierter Spieler mit Bilanz
- **Friendship:** Freundschaft mit Online-Status
- **PlayerSettings:** Einstellungen eines Spielers
- **Faction:** fiktive Nation mit Bonus, Sondereinheit und Bildern
- **UnitType:** Einheitenvorlage mit Werten, Ladungsart und Fraktionsvarianten
- **AiPersonality:** KI-Gegner mit fester Fraktion
- **Match:** Partie mit Regeln und Status, dauerhaft gespeichert
- **Participant:** Platz in einer Partie (Spieler, KI, Einladung, offen)
- **Invitation:** Einladung zu einer Partie
- **Map, Tile, City, Unit:** Spielwelt, Hex-Felder, Städte und Einheiten
- **Turn:** abgeschlossener Zug mit Aktionen
- **GameEvent:** Ereignis für Log und Benachrichtigungen

Details in `data-shapes/README.md` und im Original `product/data-shape/data-shape.md`.

## Design-System

**Farben (Tailwind):**
- Primär: `amber`
- Sekundär: `teal`
- Neutral: `stone`

**Schriften (Google Fonts):**
- Überschriften: Big Shoulders Display
- Fließtext: Barlow
- Zahlen und Codes: IBM Plex Mono

## Umsetzungsreihenfolge

1. **Shell:** Design-Tokens und Anwendungs-Shell mit Menü- und Spiel-Modus
2. **Spielfeld & Züge:** Kern des Spiels
3. **Fraktionen & Einheiten:** Kompendium
4. **Partie-Setup & KI-Gegner:** neue Partien anlegen
5. **Lobby & Multiplayer:** Startseite und Warteraum
6. **Spielerprofil & Einstellungen:** Profil und Einstellungen

Für jeden Meilenstein gibt es eine eigene Anleitung in `product-plan/instructions/incremental/`.
