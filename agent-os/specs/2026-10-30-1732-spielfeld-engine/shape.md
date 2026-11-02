# 02a Spielfeld & Züge: Shaping-Notizen

## Umfang

Meilenstein 02 ist zu groß für eine einzige Änderung und wird deshalb geteilt.

- **02a (diese Spec):** Spielfeld-UI aus der Übergabe, eine gemeinsame Regel-Engine in `packages/shared`, eine Server-API mit Prüfung jeder Aktion, dauerhafte Spielstände in Postgres und eine vorbereitete Demo-Partie. KI-Gegner beenden ihren Zug vorerst sofort.
- **02b (folgt):** einfache KI, die tatsächlich spielt, und ein prozeduraler Kartengenerator aus dem Seed.

## Entscheidungen

- **Datenbank:** Postgres 17 in Docker (docker-compose). Voraussetzung ist die WSL-Integration in Docker Desktop.
- **Identität:** Bis es eine Anmeldung gibt, ist jede Anfrage der feste Dev-Spieler `p1` („Björn“). Das steckt in einer einzigen Funktion `currentPlayer(req)`.
- **Zugfolge:** nacheinander in Sitzreihenfolge. Eine Runde bedeutet, dass jeder aktive Teilnehmer einmal zieht. Zu Beginn seines Zugs sieht jeder die Wiederholung aller für ihn sichtbaren Aktionen seit seinem letzten Zug.
- **Stammdaten:** Fraktionen und Einheitentypen liegen als Konstanten in `packages/shared` (aus den Beispieldaten).
- **Eine Regelquelle:** `hex.ts` und `bonus.ts` aus der Übergabe liegen in `packages/shared/src/game/`. Client-Vorschau und Serverprüfung nutzen denselben Code.
- **Speicherung:** Der vollständige Spielzustand liegt als JSONB-Schnappschuss in `matches.state` mit Versionsprüfung. Er wird nach jeder angenommenen Aktion gespeichert. Abgeschlossene Züge stehen zusätzlich in `turns`.
- **Nicht enthalten:** KI-Züge und Kartengenerator (02b), Audio (eigene Spec), WebSockets (05; bis dahin fragt die Web-App alle 5 s nach, solange sie wartet), Einstellungen aus 06, Endbildschirm.

## Regelmodell

- **Bewegung:** Jedes Feld kostet 1. Das Budget ist `min(movesLeft, fuel)`, die Bewegung gilt mit Fraktionsbonus. Ein verborgener Feind auf dem Pfad stoppt die Bewegung am letzten freien Feld und löst das Ereignis `enemySighted` aus.
- **Kampf:**
  - Angriff = Stärke × Zustand; Abwehr = Abwehr × Zustand, +1 in einer Stadt, +1 zusätzlich in Städten der Salzküsten-Liga.
  - Die Siegchance ist Angriff / (Angriff + Abwehr). Das Ergebnis wird mit einem Zufallsgenerator gezogen, der vom Seed abhängt, und ist damit reproduzierbar.
  - Der Verlierer wird zerstört, seine Ladung mit ihm. Der Sieger erleidet `round(50 × (1 − Siegchance))` Schaden, mindestens 5.
  - Ein Angriff verbraucht alle restlichen Bewegungspunkte.
- **Stadt erobern:** Nur Einheiten mit `canCaptureCities` können eine leere Stadt angreifen. Die Siegchance ist Angriff / (Angriff + 1), bei der Salzküsten-Liga +1. Bei einem Sieg wechselt der Besitzer, die Einheit zieht ein und die Produktion wird zurückgesetzt.
- **Zugbeginn:**
  - Bewegungspunkte werden zurückgesetzt. Flugzeuge in einer eigenen Stadt oder auf einem Träger tanken auf; Flugzeuge außerhalb mit 0 Treibstoff gehen verloren.
  - Die Produktion schreitet um 1 voran. Einheiten in eigenen Städten heilen um +20.
  - Stehende Befehle werden ausgeführt und `needsOrders` neu berechnet.
- **Sicht:** Radius 1 für Landeinheiten und Städte, Radius 2 für See- und Lufteinheiten. Erforschte Felder bleiben erforscht.
- **Ausscheiden:** Wer weder Städte noch Einheiten hat, scheidet aus.

## Kontext

- **Visuals:** `visuals/spielfeld.png`
- **Referenzen:** siehe `references.md`
- **Produktbezug:** Laut Mission soll die Partie solo gegen eine KI spielbar sein (mit 02b erfüllt). Spielstände werden dauerhaft gespeichert.

## Angewandte Standards

Noch keine, siehe `standards.md`.
