# Avatare: Zuschnitt, Verkleinerung und Aufräumen — Shaping Notes

## Scope

Ein hochgeladenes Profilbild wird im Browser zugeschnitten und auf dem Server auf ein kleines WebP verkleinert. Bestehende Avatare werden einmal umgerechnet, verwaiste Dateien gelöscht. Das ist der Roadmap-Punkt „Avatare“ in Phase 2.

## Decisions

- Zuschnitt in einem Dialog im Browser: runder Ausschnitt, Verschieben, Zoom. Der Browser schickt das Original und den Ausschnitt in Bildpixeln (`cropX`, `cropY`, `cropSize`). Der Server schneidet zu, damit das Ergebnis nicht vom Browser abhängt.
- Ausgabe: WebP 256×256, das Doppelte der größten Anzeige (128 px). Animierte GIFs werden zum Standbild. Metadaten (EXIF, GPS) werden verworfen.
- Upload-Limit 10 MB statt 2 MB, weil Handyfotos oft 3–8 MB haben.
- Bestand: Beim Serverstart wird jeder Avatar, der noch kein WebP ist, mittig quadratisch umgerechnet.
- Aufräumen: Beim Serverstart werden Dateien ohne Verweis gelöscht, die älter als eine Stunde sind. Ein Cron ist nicht nötig, weil jeder Deploy den Server neu startet.
- Bibliothek `sharp` (libvips, vorgebaute Binärdateien auch für Alpine). Für den Zuschnitt-Dialog gibt es keine Fremdbibliothek, er wird selbst gebaut.

## Context

- **Visuals:** keine
- **References:** siehe `references.md`
- **Product alignment:** Roadmap Phase 2, „Avatare: Zuschnitt und Verkleinerung auf dem Server, Aufräumen verwaister Dateien“

## Standards Applied

Es gibt kein `agent-os/standards/`. Stattdessen gelten die Projektregeln, siehe `standards.md`.

## Ergebnis (7. November 2026)

- Im echten Browser (Chrome über Playwright, Dev-Server) getestet mit einem JPEG mit EXIF-Ausrichtung 8: Die Vorschau im Dialog und das gespeicherte Bild stimmen überein (`visuals/zuschnitt-start.png`, `zuschnitt-gewaehlt.png`, `profil-mit-bild.png`). Ergebnis 256×256 WebP, 1,4 KB, ohne EXIF.
- Gefunden im Browser: Eine per `useMemo` erzeugte Objekt-URL wird im StrictMode beim probeweisen Abräumen freigegeben und nicht neu erzeugt. Die URL entsteht deshalb im Effekt.
- Aufräumen beim Start gegen die Dev-Datenbank: Ein alter PNG-Avatar wurde zu WebP umgerechnet und eine drei Stunden alte verwaiste Datei gelöscht (Log „Avatare: 1 umgerechnet, 0 ohne Datei entfernt, 1 verwaiste Dateien gelöscht“).
- `sharp` braucht keinen Eintrag unter `allowBuilds`, weil es mit vorgebauten Paketen kommt. Die Lockfile enthält `@img/sharp-linuxmusl-x64` für das Alpine-Image. Docker-Build geprüft: sharp 0.35.5 mit libvips 8.18.7 lädt im Alpine-Image, und ein Upload mit Ausschnitt im Container (`localhost:8080`) liefert 256×256 WebP ohne EXIF.
- `apps/web/src/sections/profil/components/` steht in `.prettierignore` (Design-Übergabe). Neue Dateien dort sind formatiert, bestehende bleiben im Originalstil.
