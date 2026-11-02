# Nutzungsübersicht für Admins — Shaping-Notizen

## Umfang

Wer das Spiel betreibt, sieht bisher nicht, wie es genutzt wird. Eine Seite `/admin` zeigt nur Admins Kennzahlen zu Konten und Partien, einen Verlauf über 7, 30 oder 90 Tage und Listen der letzten Konten und Partien. Es werden keine neuen Daten erhoben; ausgewertet wird, was in `players`, `matches`, `match_seats` und `turns` ohnehin steht.

## Entscheidungen

- **Admin-Rolle:** Env-Variable `ADMIN_EMAILS` (kommagetrennt, ohne Unterscheidung von Groß- und Kleinschreibung). Keine Migration, keine Verwaltungsoberfläche. Ohne Variable gibt es keine Admins.
- **Keine E-Mail-Adressen:** Weder in der Oberfläche noch in den Antworten des Servers, nur Anzeigenamen. `/api/me` bekommt nur `isAdmin`.
- **Testdaten:** Dev-Konten (`@dominion.test`), die Demo-Partie und Partien, die ein Dev-Konto angelegt hat, zählen nicht mit. Gezählte Züge sind nur die menschlicher Spieler.
- **Verlauf:** umschaltbar 7/30/90 Tage, eigene SVG-Balken ohne Chart-Bibliothek.
- **Ort:** eigene Seite `/admin`, Eintrag „Verwaltung“ im Benutzermenü nur für Admins; für andere zeigt `/admin` die 404-Seite, der Server antwortet mit 403.
- **Stil:** wie Profil und Einstellungen.
- **Datenschutz:** Die Datenschutzerklärung erwähnt die interne Übersicht in einem Satz.
- **Verworfen:** Spalte `is_admin`, reiner JSON-Endpunkt, Chart-Bibliothek.

## Kontext

- **Visuals:** keine
- **Referenzen:** siehe `references.md`
- **Produktbezug:** Betrieb (`agent-os/specs/2026-10-31-1320-deployment/`, `2026-11-02-2041-versionen/`)

## Angewandte Standards

Keine; `agent-os/standards/` ist nicht angelegt.
