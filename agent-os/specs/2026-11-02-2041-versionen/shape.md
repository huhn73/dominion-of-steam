# Versionen — Shaping-Notizen

## Umfang

Bisher gibt es keine Versionsnummer: Alle `package.json` stehen auf `0.0.0`, es gibt keine Git-Tags, und im deployten Spiel sieht man nicht, welcher Stand läuft. Ziel ist eine Version, die der Spieler selbst festlegt, die der Deploy als Release markiert und die das Spiel anzeigt.

## Entscheidungen

- **Quelle:** Die Version steht im Root-`package.json`, die Workspace-Pakete ziehen mit. Gesetzt wird sie mit `pnpm release <patch|minor|major|x.y.z>`.
- **Release beim Deploy:** Liegt zur Version noch kein Tag `v…` vor, legt der Workflow nach erfolgreichem Deploy Git-Tag, Image-Tag `v…` und GitHub-Release mit automatisch erzeugten Notizen an. Weitere Pushes ohne neue Version laufen als `0.9.0+abc1234`.
- **Anzeige:** In der Fußzeile der Menüseiten und unter der Anmeldekarte, klein neben den Rechtslinks. Commit und Build-Datum stehen im Tooltip. Zusätzlich liefert `/api/health` Version und Commit.
- **Startversion:** 0.9.0. Die 1.0.0 setzt der Spieler bewusst zum öffentlichen Start.
- **Verworfen:** Deploy nur per Git-Tag; nur Commit und Datum ohne Versionsnummer.

## Kontext

- **Visuals:** keine
- **Referenzen:** siehe `references.md`
- **Produktbezug:** Betrieb (`agent-os/specs/2026-10-31-1320-deployment/`)

## Angewandte Standards

Keine; `agent-os/standards/` ist nicht angelegt.
