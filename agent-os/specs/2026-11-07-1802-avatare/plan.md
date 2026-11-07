# Avatare: Zuschnitt, Verkleinerung und Aufräumen

## Context

Roadmap Phase 2, Punkt „Avatare“. Heute wird ein hochgeladenes Bild unverändert gespeichert (`apps/server/src/profile/service.ts`, `setAvatar`). Der Server prüft nur das Format über `sniffImage` (PNG, JPEG, WebP, GIF) und die Größe über `AVATAR_MAX_BYTES` (2 MB). Angezeigt wird es höchstens 128 px groß, mit `object-cover` rund beschnitten. Ein Handyfoto mit mehreren MB wird so an jeden Lobby-Besucher ausgeliefert, und wer im Bild zu sehen ist, landet womöglich außerhalb des Kreises. Dateien, die nach Abstürzen oder Fehlern liegen bleiben, räumt niemand auf.

Im Shaping festgelegt:
- **Zuschnitt:** Nach der Dateiauswahl öffnet sich ein Dialog im Browser mit rundem Ausschnitt, Verschieben und Zoom. Der Browser schickt die Originaldatei und den Ausschnitt in Bildpixeln. Der Server schneidet zu und verkleinert.
- **Ausgabe:** WebP, 256×256 px, ein Format und eine Größe. Animierte GIFs werden zum Standbild (erstes Bild).
- **Upload-Limit:** 10 MB statt 2 MB.
- **Bestand:** Vorhandene Avatare werden beim Serverstart einmal umgerechnet, dabei mittig quadratisch zugeschnitten.
- **Verwaiste Dateien:** Dateien in `uploads/avatars/`, auf die kein Konto zeigt und die älter als eine Stunde sind, werden beim Serverstart gelöscht.

## Task 1: Spec-Dokumentation speichern

Ordner `agent-os/specs/2026-11-07-1802-avatare/` mit:
- `plan.md`: dieser Plan
- `shape.md`: Umfang, Entscheidungen (oben), Kontext, Produktbezug Roadmap Phase 2
- `standards.md`: Es gibt kein `agent-os/standards/`. Es gelten die Projektregeln: Typecheck je Paket, CSP-Hinweis aus `deploy/README.md` (`img-src` erlaubt `blob:` bereits), Release gesammelt mit NEWS 0.11.0, Push nur nach Rückfrage.
- `references.md`: Upload-Route `apps/server/src/routes/profile.ts:66`, `setAvatar`/`deleteAvatarFile`/`sniffImage` in `profile/service.ts`, Avatar-Test `profile/profile.test.ts:317`, `Sheet` und `Avatar` in `apps/web/src/sections/profil/components/ui.tsx`, Upload in `apps/web/src/data/profile.ts:50`, Start-Hooks in `apps/server/src/index.ts`
- Keine Visuals.

## Task 2: Bildverarbeitung auf dem Server

- `sharp` als Abhängigkeit von `@dos/server`, in `pnpm-workspace.yaml` unter `allowBuilds` freigeben. Es bringt vorgebaute Binärdateien mit, auch für `node:24-alpine` (linuxmusl-x64).
- Neues Modul `apps/server/src/profile/avatarImage.ts`:
  - `renderAvatar(data, crop?)` → `Buffer` (WebP)
  - Ablauf: `sharp(data, { limitInputPixels: 40_000_000, animated: false })`, dann `.rotate()` (EXIF-Ausrichtung, damit die Koordinaten aus dem Browser passen), dann `.extract(crop)` bzw. mittiges Quadrat ohne `crop`, dann `.resize(256, 256)`, dann `.webp({ quality: 82 })`.
  - Metadaten werden verworfen (Standard bei sharp). Das entfernt auch GPS-Daten aus Handyfotos.
  - Der Ausschnitt wird auf die Bildgrenzen geklemmt. Ist er ungültig (nicht quadratisch, unter 32 px, außerhalb des Bildes), gibt es 422 `INVALID_CROP`.
  - Ein beschädigtes Bild, bei dem sharp wirft, gibt 415 `UNSUPPORTED_IMAGE` mit der bisherigen Meldung.
- `setAvatar(me, data, crop?)`: `sniffImage` bleibt als erste Prüfung. Danach wird `renderAvatar` aufgerufen und `<id>-<hex>.webp` geschrieben, der Rest bleibt wie bisher.
- Route `POST /api/profile/avatar`: Die Felder `cropX`, `cropY` und `cropSize` werden aus `file.fields` gelesen. Der Browser hängt sie vor der Datei an, alle drei oder keins.
- `AVATAR_MAX_BYTES` in `packages/shared/src/profile` wird auf 10 MB gesetzt. Das wirkt auf das Multipart-Limit in `app.ts:89`, auf die Prüfung im Browser und auf die Fehlermeldung. Caddy setzt kein Body-Limit.

## Task 3: Bestand umrechnen und verwaiste Dateien löschen

Neu in `profile/service.ts` ist `maintainAvatars(now)`. Es wird in `index.ts` nach `listen` im Hintergrund gestartet, Fehler gehen nur ins Log:
1. Jedes Konto, dessen `avatarUrl` mit `AVATAR_PATH` beginnt und nicht auf `.webp` endet: Die Datei wird mittig zugeschnitten umgerechnet und als neue `.webp` gespeichert. Danach wird `avatar_url` aktualisiert und die alte Datei gelöscht. Fehlt die Datei, wird `avatar_url` auf `null` gesetzt. Ist sie nicht lesbar, bleibt sie unverändert und es gibt einen Log-Eintrag.
2. Jede Datei in `avatarDir`, auf die kein `players.avatar_url` zeigt und deren `mtime` älter als 1 h ist, wird gelöscht. Die Stunde schützt einen Upload, der gerade läuft.

Die Zahlen (umgerechnet, gelöscht) kommen ins Log. Es ist kein Cron nötig, weil der Server bei jedem Deploy neu startet.

## Task 4: Zuschnitt-Dialog im Browser

- Neue Komponente `AvatarCropper` in `apps/web/src/sections/profil/components/` auf Basis von `Sheet`. Sie zeigt das Bild über `URL.createObjectURL`, das beim Schließen wieder freigegeben wird.
- **Bedienung:**
  - Quadratische Bühne mit runder Maske, darin ein Rahmen für den Ausschnitt.
  - Verschieben per Pointer-Events (Maus und Touch).
  - Zoom mit Schieberegler von 1× bis 4× und Mausrad, zusätzlich Pinch, falls es mit wenig Aufwand geht.
  - Pfeiltasten verschieben, +/− zoomen.
  - Startzustand: das größte mittige Quadrat.
  - Buttons „Abbrechen“ und „Übernehmen“.
- Die Werte werden in natürlichen Bildpixeln gerechnet (`naturalWidth/Height`, Browser zeigen EXIF-gedreht an wie sharp nach `.rotate()`). Eine reine Hilfsfunktion `cropFromView(...)` macht das in einer eigenen Datei, damit sie testbar ist.
- **Ablauf:** In `Profil.tsx` öffnet die Dateiauswahl jetzt den Dialog statt sofort `onUploadAvatar(file)` aufzurufen. „Übernehmen“ ruft dann `onUploadAvatar(file, crop)`. Das Datei-Input wird zurückgesetzt, damit dieselbe Datei erneut gewählt werden kann.
- `apps/web/src/data/profile.ts`: `uploadAvatar(file, crop?)` hängt `cropX`, `cropY` und `cropSize` vor der Datei an. Die Größenprüfung nutzt das neue Limit. `accept` wird auf `image/png,image/jpeg,image/webp,image/gif` eingeschränkt.
- `ProfilePage.tsx` reicht den Ausschnitt durch, die Typen in `sections/profil/types.ts` werden angepasst.

## Task 5: Tests, Doku, Neuigkeit

- **Server** (`profile.test.ts`), mit Testbildern, die per sharp im Test erzeugt werden:
  - Upload mit Ausschnitt ergibt `.webp` mit 256×256 (per `sharp(...).metadata()` geprüft).
  - Ohne Ausschnitt wird mittig geschnitten.
  - Ein ungültiger Ausschnitt gibt 422.
  - Ein beschädigtes Bild gibt 415.
  - Eine Datei über 10 MB gibt 413.
  - `maintainAvatars`: PNG wird zu WebP und die URL ist aktualisiert. Eine verwaiste alte Datei wird gelöscht, eine frische bleibt.
- **Web:** `cropFromView` als Unit-Test. Im `Profil.test.tsx` öffnet die Dateiauswahl den Dialog, und „Übernehmen“ ruft den Upload mit Ausschnitt (der Mock prüft die FormData-Felder).
- **Doku:** Die Roadmap streicht den Punkt „Avatare“. `deploy/README.md` bekommt bei Bedarf einen Hinweis auf sharp im Image.
- **NEWS:** Ein Satz unter 0.11.0: „Profilbilder lassen sich beim Hochladen zuschneiden und werden klein gespeichert.“

## Verifikation

- `pnpm --filter @dos/server test`, `pnpm --filter @dos/web test`, Typecheck je Paket (`@dos/shared`, `@dos/server`, `@dos/web`).
- **Lokal im Browser:**
  - Profil → Bild hochladen mit einem großen Handyfoto im Hochformat mit EXIF-Drehung.
  - Ausschnitt verschieben und zoomen, dann übernehmen.
  - Das Bild in Profil, Kopfzeile und Lobby prüfen.
  - In `uploads/avatars/` liegt eine `.webp` mit 10–30 KB.
- **Bestand:** Eine alte PNG-Datei mit `avatar_url` per psql setzen, den Server neu starten, dann prüfen, dass sie umgerechnet und die alte Datei weg ist. Eine verwaiste Datei mit alter `mtime` (`touch -d`) verschwindet beim nächsten Start.
- **Docker:** `docker compose build` läuft durch, und ein Upload im Container funktioniert. So ist geprüft, dass sharp unter Alpine geladen wird.
