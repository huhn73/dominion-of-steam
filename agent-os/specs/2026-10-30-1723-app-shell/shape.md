# 01 Shell: Shaping-Notizen

## Umfang

Erster Meilenstein der Roadmap. Gebaut werden das pnpm-Monorepo laut Tech-Stack und die dauerhafte Anwendungs-Shell. Sie hat einen Menü-Modus (Top-Navigation bzw. Tab-Leiste auf dem Smartphone, Benutzermenü) und einen Spiel-Modus (kompakte Kopfleiste, Spielfeld in voller Höhe). Alle Bereiche sind zunächst Platzhalter-Seiten. Grundlage ist `product-plan/instructions/incremental/01-shell.md`.

## Entscheidungen

- **Umfang:** Monorepo (`apps/web`, `apps/server`, `packages/shared`) mit vollständiger Web-Shell. Benutzer und Lobby-Badge kommen aus einer Mock-Datenschicht. Der Server ist nur ein Fastify-Stub mit `GET /api/health`. Auth und Datenbank folgen in späteren Specs.
- **Router:** React Router v7 im SPA-Modus mit je einem Layout für Menü- und Spiel-Modus.
- **Tests:** Vitest mit Testing Library, noch keine E2E-Tests.
- **Dunkler Modus:** Hell, Dunkel oder System; Vorgabe ist System. Die Wahl wird in localStorage (`dos.theme`) gespeichert. Meilenstein 06 verbindet später die Einstellung „Farbschema“ damit.
- **Spielmenü:** ein einfaches Menü mit Partie-Details, Einstellungen, Aufgeben (noch deaktiviert) und Zurück zur Lobby, solange es nicht gestaltet ist.
- Die Shell-Komponenten aus der Übergabe werden unverändert übernommen.

## Kontext

- **Visuals:** `visuals/menu-modus.png` (Menü-Modus), `visuals/spiel-modus.png` (Spielfeld im Spiel-Modus)
- **Referenzen:** `product-plan/shell/`, `product-plan/design-system/`
- **Produktbezug:** Dieselpunk-Stil, Browser auf Desktop und Touch, mobile Tab-Leiste, Wechsel zwischen Geräten ohne Bruch (`agent-os/product/mission.md`)

## Angewandte Standards

Noch keine, siehe `standards.md`.
