# Dominion of Steam: Design-Übergabe

Dieser Ordner enthält alles, was für die Umsetzung von Dominion of Steam nötig ist.

## Inhalt

**Fertige Prompts:**
- `prompts/one-shot-prompt.md`: Prompt für die vollständige Umsetzung in einem Durchgang
- `prompts/section-prompt.md`: Vorlage für die Umsetzung Bereich für Bereich

**Anleitungen:**
- `product-overview.md`: Produktzusammenfassung, bei jeder Umsetzung mitgeben
- `instructions/one-shot-instructions.md`: alle Meilensteine in einem Dokument
- `instructions/incremental/`: eine Anleitung je Meilenstein (01 Shell, 02–06 Bereiche)

**Design-Material:**
- `design-system/`: Farben, Schriften, Design-Tokens
- `data-shapes/`: UI-Datenverträge (welche Datenformen die Komponenten erwarten)
- `shell/`: Komponenten der Anwendungs-Shell (Menü- und Spiel-Modus)
- `sections/`: Komponenten, Typen, Beispieldaten, Test-Spezifikationen und Screenshots aller fünf Bereiche
- `briefs/`: Art-Brief (Illustrationen, Fraktionsvarianten, Dateipfade) und Audio-Brief (adaptive Musik, Fraktionsthemen, Umgebung, Soundeffekte)

## Bereiche

| Nr. | Bereich | Ordner | Ansichten |
|---|---|---|---|
| 01 | Shell | `shell/` | Menü-Modus, Spiel-Modus |
| 02 | Spielfeld & Züge | `sections/spielfeld-and-zuge/` | Spielfeld |
| 03 | Fraktionen & Einheiten | `sections/fraktionen-and-einheiten/` | Übersicht, Fraktion, Einheit |
| 04 | Partie-Setup & KI-Gegner | `sections/partie-setup-and-ki-gegner/` | 5-Schritte-Assistent |
| 05 | Lobby & Multiplayer | `sections/lobby-and-multiplayer/` | Lobby, Warteraum |
| 06 | Spielerprofil & Einstellungen | `sections/spielerprofil-and-einstellungen/` | Profil, Einstellungen |

## So nutzt du das Paket

### Variante A: Schrittweise (empfohlen)

1. Den Ordner `product-plan/` in die Codebasis kopieren
2. Mit der Shell beginnen (`instructions/incremental/01-shell.md`), inklusive Design-Tokens
3. Für jeden Bereich:
   - `prompts/section-prompt.md` öffnen
   - Die Variablen oben ausfüllen (SECTION_NAME, SECTION_ID, NN)
   - In den Coding-Agenten kopieren
   - Rückfragen beantworten und umsetzen lassen
4. Nach jedem Meilenstein prüfen und testen

### Variante B: In einem Durchgang

1. Den Ordner `product-plan/` in die Codebasis kopieren
2. `prompts/one-shot-prompt.md` öffnen
3. Eigene Hinweise ergänzen
4. In den Coding-Agenten kopieren
5. Rückfragen beantworten
6. Den Agenten planen und umsetzen lassen

## Tests

Jeder Bereich hat eine `tests.md` mit Test-Spezifikationen für das UI-Verhalten. So geht es am besten:

1. `sections/<bereich>/tests.md` vor der Umsetzung lesen
2. Tests für die wichtigsten Abläufe schreiben
3. Funktion umsetzen, bis die Tests grün sind
4. Aufräumen, Tests grün halten

Die Spezifikationen sind **unabhängig vom Test-Framework**. Sie beschreiben, *was* getestet wird, nicht *wie*.

## Was die Designs nicht festlegen

Die Komponenten sind Oberfläche. Folgendes muss die Umsetzung selbst entwerfen bzw. klären:

- **Server und dauerhafte Spielstände:** Speichern nach jedem Zug, Neustart-sicher, Fristen und automatische KI-Züge im Hintergrund, Echtzeit für Live-Partien
- **Spielregeln im Detail:** Kampfberechnung, Sichtweiten, Produktion pro Runde, Treibstoff und Auftanken, Punktwertung beim Rundenlimit. Die Spielfeld-Komponenten enthalten Bewegungs- und Pfadregeln, die Vorschau simuliert Kämpfe nur vereinfacht.
- **KI-Verhalten** je Persönlichkeit und Schwierigkeit
- **Kartengenerierung** aus Kartencode, Größe, Landanteil, neutralen Städten und Gelände
- **Benachrichtigungen:** Push (Web Push) und E-Mail mit Verzögerung
- **Audio-Engine** für adaptive Musik und Ambiente-Mischung laut Audio-Brief
- **Spielmenü** im Spiel-Modus (Inhalt noch nicht gestaltet)

## Bilder und Töne

Illustrationen und Audiodateien sind nicht Teil dieses Pakets. Die Komponenten verweisen über Pfade darauf (`/art/...`, `/audio/...`) und zeigen Platzhalter, solange Bilder fehlen. Dateinamen, Formate und Prompts stehen in `briefs/`.

## Tipps

- **Die fertigen Prompts nutzen:** Sie fragen wichtige Punkte zu Tech-Stack und Anforderungen ab.
- **Eigene Hinweise ergänzen:** Prompts bei Bedarf um projektspezifischen Kontext erweitern.
- **Sorgfältig prüfen:** Pläne und Umsetzungen kontrollieren, um Details und Widersprüche zu finden.
- **Die Komponenten sind flexibel:** Sie bekommen Daten und lösen Callbacks aus. Wie das Backend aussieht, entscheidet die Umsetzung.

---

*Erstellt mit Design OS*
