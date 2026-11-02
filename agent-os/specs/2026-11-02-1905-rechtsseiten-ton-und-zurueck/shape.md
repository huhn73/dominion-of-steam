# Rechtsseiten: Ton und Zurück-Link — Shaping-Notizen

## Umfang

Zwei Fehler auf Impressum, Datenschutz und Lizenzen, gemeldet vom Spieler am 2. November 2026:

- **Ton:** Ist der Ton stumm geschaltet und tippt man auf eine der drei Seiten, klingt kurz Musik auf und verstummt wieder.
- **Zurück:** „Zurück“ springt im Browserverlauf einen Schritt zurück. Von der Lobby über das Impressum zum Datenschutz führt „Zurück“ wieder ins Impressum statt in die Lobby. Abgemeldet geht es nicht direkt zur Anmeldung.

## Ursache

- Die Rechtsseiten liegen außerhalb von `RequireAuth`. Beim Wechsel dorthin wird `SignedInAudio` abgebaut.
- Dessen Aufräumfunktion blendet mit `stopAll()` aus und setzt im selben Moment die Standardlautstärken. Damit ist die Stummschaltung aufgehoben, solange die Musik ausblendet. Beim Abmelden passiert dasselbe.
- Verwandt: Nach dem Login ist der Query-Cache leer. Die Menümusik startet mit den Standardlautstärken, bevor die Einstellungen geladen sind.

## Entscheidungen

- **Die Rechtsseiten bleiben still**, auch für angemeldete Spieler. Die Menümusik blendet beim Öffnen aus und startet bei der Rückkehr neu. Verworfen: Menümusik auf den Rechtsseiten weiterlaufen lassen.
- Beim Verlassen des angemeldeten Bereichs werden die Lautstärken nicht mehr zurückgesetzt. Beim nächsten Mount setzt `SignedInAudio` sie aus den Einstellungen.
- Die Menümusik startet erst, wenn die Einstellungen geladen sind.
- **Der Link nennt sein Ziel:** angemeldet „Zur Lobby“, abgemeldet „Zur Anmeldung“. Es ist ein echter Link mit festem Ziel statt `navigate(-1)`.

## Kontext

- **Visuals:** keine
- **Referenzen:** siehe `references.md`
- **Produktbezug:** Online-Auftritt (`agent-os/specs/2026-10-31-1900-online-auftritt/`), Ton beim Wechsel (`agent-os/specs/2026-11-01-1139-ton-beim-wechsel/`)

## Angewandte Standards

Keine; `agent-os/standards/` ist nicht angelegt.
