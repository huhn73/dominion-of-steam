# Einheitenliste: Fraktionsbilder der allgemeinen Einheiten überblenden

## Context

In „Fraktionen & Einheiten“ zeigt die Einheitenliste nur bei den drei Sondereinheiten ein Bild. Die neun allgemeinen Einheiten zeigen das Icon. Der Grund: Für sie gibt es nur Fraktionsausführungen (`variantIllustrationUrls`, je 4 Bilder unter `public/art/units/<fraktion>/`). Die Liste fragt aber nur `illustrationUrl` ab (`FraktionenUndEinheiten.tsx:200`), und `/art/units/grenadiere.webp` usw. gibt es nicht. In der Fraktionsansicht (`FraktionDetail.tsx:228`) und in der Einheitenansicht sind die Bilder dagegen schon da.

Der Nutzer will: In der Gesamtliste überblenden die allgemeinen Einheiten langsam und synchron zwischen den vier Fraktionsausführungen, alle zur gleichen Zeit dieselbe Fraktion.

Dabei fiel auf, dass die Bilder groß sind: im Schnitt etwa 750 KB, zusammen 27 MB. Für Vorschauen von 64×48 px erzeugen wir deshalb kleine Thumbnails.

**Entscheidungen (mit dem Nutzer abgestimmt):**
- Takt: alle 6 s ein Wechsel, 1,5 s Blende, Reihenfolge der Fraktionen wie in den Stammdaten (Eisenbund, Aurelia, Nordmark, Salzküste)
- Der Bildrahmen nimmt die Farbe der gerade gezeigten Fraktion an und blendet mit
- Bei „Animationen reduzieren“ (Einstellung oder `prefers-reduced-motion`) gibt es keinen Wechsel, es bleibt bei der ersten Fraktion (Eisenbund)
- Vorschaubilder: ein Skript erzeugt einmalig kleine WebP-Dateien nach `public/art/units/thumbs/`; Liste und Fraktionsansicht laden diese, die Einheitenansicht weiter das große Bild
- Das Überblenden betrifft nur die Gesamtliste. Der Filter „Herkunft = Sondereinheiten: X“ zeigt ohnehin nur Sondereinheiten, „Allgemeine Einheiten“ und „Alle Herkünfte“ blenden über.

**Nachgereicht vom Nutzer (Screenshot Fraktionsseite Eisenbund):**
- Die Sondereinheit oben auf der Fraktionsseite (`FraktionDetail.tsx:143–199`) zeigt nur ein rundes Icon statt ihres Bildes → Bild anzeigen
- Die Bilder in den Einheitenzeilen dürfen größer sein
- In den Zeilen überlagern die Namen die Werte („GRENADIERE“ läuft über „ST“), und die Zusatzzeile bricht Wort für Wort um („SEE · LADUNG 6 LANDEINHEITEN“). Das passiert in der Fraktionsseite und in der Gesamtliste. Ursache: `UnitRow` legt Name und sechs Wertekästen (je `min-w-14`) ab `sm` in eine Zeile, in der zweispaltigen Liste (`xl:grid-cols-2`) bleibt für den Namen zu wenig Platz, und lange Wörter in Big Shoulders laufen über

## Task 1: Spec-Dokumentation speichern

`agent-os/specs/2026-11-03-HHMM-einheiten-ueberblenden/` (Zeitstempel beim Ausführen) mit:
- **plan.md**: dieser Plan
- **shape.md**: Umfang, die Entscheidungen oben, Ursache (fehlende `illustrationUrl` der allgemeinen Einheiten), Bildgrößen
- **standards.md**: Hinweis, dass es kein `agent-os/standards/` gibt
- **references.md**: `UnitRow.tsx`, `useImageLoaded.ts` (`useFirstLoadedImage`), `FraktionDetail.tsx` (Variantenbilder), `EinheitDetail.tsx` (Ausführungs-Tabs), `CardImage` in `FraktionenUndEinheiten.tsx` (fade-in), `settings/motion.ts` + `styles/index.css` (Reduce Motion), `scripts/icons.mjs` (Chromium-Rendering)
- **visuals/**: Screenshot `/tmp/claude-1001/-home-anwender-projects-dominion-of-steam/8233c793-9f42-4e36-8b8d-c04c8d5e9663/images/4.png` als `einheitenliste-ohne-bilder.png` und `…/images/7.png` als `fraktionsseite-eisenbund-ueberlappung.png`

## Task 2: Vorschaubilder erzeugen

- Neues Skript `scripts/unit-thumbs.mjs`, das den Chromium-Weg von `scripts/icons.mjs` wiederverwendet (Playwright aus Abhängigkeit oder npx-Cache, sonst System-Chrome; Gemeinsames ggf. in eine kleine Hilfsfunktion ziehen statt kopieren)
- Liest alle `public/art/units/**/*.webp` (außer `thumbs/`), skaliert per Canvas auf 320×240 (4:3 wie die Originale; reicht in 2× für die größeren Zeilenbilder und die Sondereinheiten-Karte), schreibt `canvas.toDataURL('image/webp', 0.8)` nach `public/art/units/thumbs/<gleicher relativer Pfad>`
- Einmal ausführen und die 39 Thumbnails committen. Ziel: etwa 15–30 KB je Datei, zusammen rund 1 MB statt 27 MB
- Aufruf in `docs/ENTWICKLUNG.md` neben `scripts/icons.mjs` erwähnen („nach neuen Einheitenbildern ausführen“)

## Task 3: Thumbnail-URLs und synchroner Takt

- In `apps/web/src/sections/fraktionen/components/` eine kleine Hilfsfunktion `unitThumbUrl(url)`: `/art/units/x` → `/art/units/thumbs/x`. Kandidatenlisten nehmen zuerst das Thumbnail, dann das Original, damit ein fehlendes Thumbnail nicht das Bild kostet (`useFirstLoadedImage` wählt den ersten geladenen Kandidaten)
- Hook `useVariantCycle(count, { intervalMs: 6000 })` in derselben Mappe: ein `setInterval` liefert den aktuellen Index. Kein Weiterzählen, wenn `html.dos-reduce-motion` gesetzt ist oder `matchMedia('(prefers-reduced-motion: reduce)')` zutrifft (beim Tick prüfen, damit ein Umschalten in den Einstellungen sofort wirkt), oder wenn der Tab verborgen ist (`document.hidden`)
- `FraktionenUndEinheiten` ruft den Hook einmal auf (ein Timer für alle Zeilen, damit es synchron bleibt) und reicht die aktuelle Fraktion an die Zeilen der allgemeinen Einheiten

## Task 4: Layout von `UnitRow` reparieren und Bild vergrößern

- Zeile wird ein Container (`@container`, Tailwind v4 bringt Container-Queries mit). Schmal: oben Bild + Name + Zusatzzeile, darunter die Wertekästen über die volle Breite. Erst wenn der Container breit genug ist (etwa `@2xl`, ~42rem), stehen die Werte rechts daneben. Damit passt es in der zweispaltigen Liste wie auf dem Handy, unabhängig von der Fensterbreite
- Name darf umbrechen statt überzulaufen (`break-words`/`hyphens-auto`, `lang="de"` ist gesetzt), Zusatzzeile („See · Ladung 6 Landeinheiten“) bricht nur zwischen den Teilen um (Teile als `whitespace-nowrap`-Spans)
- Bild größer: `h-18 w-24` (72×96, 4:3) statt `h-12 w-16`; Icon-Kreis entsprechend `size-14`
- Gilt für alle Aufrufer: Gesamtliste, Fraktionsseite (allgemeine Einheiten)

## Task 5: Bild der Sondereinheit auf der Fraktionsseite

- `FraktionDetail.tsx:157–162`: statt des runden Icons das Bild der Sondereinheit in einem 4:3-Rahmen in Fraktionsfarbe (etwa `h-30 w-40`, `sm:h-36 sm:w-48`), Kandidaten `[thumb(illustrationUrl), illustrationUrl]` über `useFirstLoadedImage`; solange nichts geladen ist, bleibt das runde Icon (wie heute)
- Hover-Effekt passend umstellen (leichter Zoom statt Drehen; Drehen gilt nur noch für den Icon-Fallback)

## Task 6: Überblenden in `UnitRow`

- `UnitRow` bekommt optional `variants?: { url: string; color: string }[]` und `activeVariant?: number`. Ohne `variants` bleibt alles wie heute (`imageUrls`, Fraktionsansicht unverändert bis auf Thumbnails)
- Mit `variants`: alle Bilder übereinander im Bildrahmen aus Task 4 (`relative`, Bilder `absolute inset-0 object-cover`), das aktive mit `opacity-100`, die anderen `opacity-0`, `transition-opacity duration-[1500ms]`. Rahmenfarbe = Farbe der aktiven Fraktion mit `transition-[border-color] duration-[1500ms]`. Die globale Reduce-Motion-Regel in `index.css` macht Übergänge dann ohnehin sofort
- Bilder einer Zeile erst zeigen, wenn mindestens das aktive geladen ist, sonst Icon wie heute (Ladezustand über die vorhandene Bildlogik aus `useImageLoaded.ts`, ggf. um „alle geladenen URLs“ erweitert)
- `FraktionenUndEinheiten.tsx:200`: allgemeine Einheiten bekommen `variants` aus `factions.map(f => ({ url: unitThumbUrl(u.variantIllustrationUrls[f.id]), color: FACTION_HEX[f.color].base }))` (nur Fraktionen mit Bild), Sondereinheiten `imageUrls={[thumb(illustrationUrl), illustrationUrl]}`
- `FraktionDetail.tsx:228`: Kandidaten auf Thumbnail + Original umstellen

## Task 7: Tests

In der vorhandenen Testdatei der Fraktionsseite (per `grep -rl "Fraktionen" apps/web/src/**/*.test.tsx` finden) mit Fake-Timern:
- Hook `useVariantCycle`: zählt alle 6 s weiter, bleibt bei gesetzter Klasse `dos-reduce-motion` stehen
- `UnitRow` mit `variants`: genau ein Bild hat die aktive Opazität, nach einem Takt das nächste; Rahmenfarbe folgt
- Fraktionsseite: Sondereinheit zeigt nach geladenem Bild ein `img` statt des Icons
(jsdom lädt keine Bilder: `Image`-Load wie in bestehenden Tests simulieren oder den Ladezustand für den Test injizieren; vorhandenes Muster dort übernehmen)

## Verifikation

- `pnpm --filter web test`, Typecheck je Paket (`pnpm --filter web typecheck`, nicht `pnpm -r`), `pnpm lint`
- Lokal (`pnpm dev`, läuft schon): `http://localhost:5173` → Fraktionen & Einheiten. Alle neun allgemeinen Einheiten zeigen ein Bild und blenden alle 6 s gleichzeitig zur nächsten Fraktion, der Rahmen wechselt die Farbe mit. Mit „Animationen reduzieren“ in den Einstellungen bleibt Eisenbund stehen
- In den Entwicklerwerkzeugen (Netzwerk) lädt die Liste nur `thumbs/`-Dateien, insgesamt etwa 1 MB
- Fraktionsseite Eisenbund: Dampfkoloss mit Bild, keine Namen über den Werten (auch „Transportfrachter“, „Flugzeugträger“), Zusatzzeilen sauber; dasselbe in der Gesamtliste bei 1280 px und auf Handybreite (375 px)
- Screenshots nachher (Gesamtliste, Fraktionsseite) zusätzlich in `visuals/`
- Screenshot per Playwright (Muster aus der Memory „Spec-Screenshots per Playwright“) in `visuals/` ablegen

## Danach

Commit zusammen mit den offenen Änderungen dieser Sitzung (Push-Hinweis in `data/push.ts`, Lobby- und Einstellungsseite; Workflow-Update `3c161f1` ist schon committet). Push auf `main` (= Live-Deploy) nur nach Rückfrage.
