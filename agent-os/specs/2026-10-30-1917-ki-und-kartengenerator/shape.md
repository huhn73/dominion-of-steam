# 02b KI & Kartengenerator: Shaping-Notizen

## Umfang

Zweiter Teil von Meilenstein 02. Mit 02a sind Spielfeld, Regel-Engine, Server und Spielstände fertig, KI-Gegner beenden ihren Zug aber nur. 02b ergänzt:

- eine einfache KI, die tatsächlich spielt,
- einen prozeduralen Kartengenerator, der aus Seed und Karteneinstellungen eine Welt erzeugt (dieselben Parameter wie im Assistenten aus Meilenstein 04),
- das Anlegen neuer Partien in der Engine; bis zum Assistenten startet man sie über die Dev-Leiste als Solo-Partie.

## Entscheidungen

- **Kartengenerator:**
  - Deterministisch: Gleicher Seed und gleiche Einstellungen ergeben dieselbe Welt (Vorgabe aus der Anleitung zu 04).
  - Land: geglättetes Rauschen mit Abfall zum Rand; der äußere Ring ist immer Tiefsee, der Landanteil trifft den Zielwert auf ±3 %.
  - Gelände: Die Stufe Wenig/Normal/Viel steuert den Anteil von Wald, Hügeln und Bergen.
  - Hauptstädte: auf den größten Landmassen, möglichst weit voneinander entfernt.
  - Neutrale Städte: Anzahl nach Stufe, mit Mindestabstand, bevorzugt an der Küste.
- **KI:**
  - Sie spielt nur mit ihrer eigenen Sicht (Kriegsnebel gilt auch für sie).
  - Alle Aktionen laufen über `applyCommand` und werden damit genauso geprüft wie die eines Spielers.
  - Reihenfolge je Einheit: angreifen (bei ausreichender Siegchance), Städte erobern, erkunden, Wache halten. Flugzeuge kehren rechtzeitig zum Tanken zurück.
  - Schwierigkeit: Schwelle für die Siegchance 0,7 (Leicht) / 0,55 (Normal) / 0,45 (Schwer). Leicht lässt Einheiten aus, Schwer baut auch die Sondereinheit.
  - Bekannte Grenze: Die KI nutzt noch keine Frachter und Träger. Persönlichkeiten (Spielweise) kommen mit Meilenstein 04.
- **Neue Partien:** Jeder Teilnehmer startet mit Hauptstadt, Grenadieren in Produktion (mit Fraktionsbonus) und einer Einheit Grenadiere.

## Kontext

- **Visuals:** keine
- **Referenzen:** siehe `references.md`
- **Produktbezug:** Mit 02b ist eine Partie laut Mission solo gegen die KI spielbar.

## Angewandte Standards

Noch keine, siehe `standards.md`.
