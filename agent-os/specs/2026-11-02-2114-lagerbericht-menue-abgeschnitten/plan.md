# Bugfix: ⋮-Menü auf der großen Partie-Karte im Lagerbericht abgeschnitten

## Context

Im Lagerbericht (Lobby, Abschnitt „Du bist am Zug“) öffnet der ⋮-Button neben „Weiterspielen“ ein Menü mit „Partie-Details“ und „Aufgeben“. Auf dem Screenshot sieht man davon nur den oberen Rand: Das Menü wird abgeschnitten.

**Ursache:** `apps/web/src/sections/lobby/components/MatchCard.tsx:117`. Das `<article>` der Variante `feature` hat `overflow-hidden`, damit die Kopfgrafik (MiniMap) die runden Ecken bekommt. Das Menü (`MatchMenu`, `absolute top-full`, Zeile 60) ragt unten aus der Karte heraus und wird deshalb weggeschnitten. Die kompakte Variante (Zeile 161) hat kein `overflow-hidden` und ist nicht betroffen.

## Task 1: Spec-Dokumentation speichern

`agent-os/specs/2026-11-02-HHMM-lagerbericht-menue-abgeschnitten/` (Zeitstempel beim Ausführen) mit:
- **plan.md**: dieser Plan
- **shape.md**: Umfang (nur dieser Bug), Ursache, Entscheidung (Clipping auf die Kopfgrafik verlagern statt Portal)
- **standards.md**: Hinweis, dass es kein `agent-os/standards/` gibt und deshalb keine Standards gelten
- **references.md**: `MatchCard.tsx` (beide Varianten), `MatchMenu`, `Lobby.test.tsx`
- **visuals/**: Screenshot aus `/tmp/claude-1001/-home-anwender-projects-dominion-of-steam/71ab0143-dec7-45d8-8668-ab13cdff7764/images/6.png` als `menue-abgeschnitten.png`

## Task 2: Clipping von der Karte auf die Kopfgrafik verlagern

In `MatchCard.tsx` (Variante `feature`):
- Am `<article>` (Zeile 117) `overflow-hidden` entfernen.
- Am Kopf-`div` (Zeile 121, hat schon `relative h-36 overflow-hidden`) die oberen Ecken runden: `rounded-t-[10px]`. Das entspricht dem inneren Radius von `rounded-xl` (12px) bei `border-2`. So bleibt die Optik gleich, auch beim Hover-Zoom der MiniMap.
- Kein Portal und kein neues Popover. Das Menü bleibt, wie es ist.

Vorher prüfen, ob ein Elternelement der Karte in `Lobby.tsx` (Abschnitt „Du bist am Zug“) ebenfalls abschneidet. Laut grep tut das nur die Einladungs-`li` (Zeile 179), die mit dem Menü nichts zu tun hat.

## Task 3: Regressionstest

In `apps/web/src/pages/lobby/Lobby.test.tsx` gibt es schon einen Test, der über die Region „Du bist am Zug“ das Menü öffnet (Zeile ~172). jsdom berechnet aber kein Layout, deshalb ergänzen wir einen schlanken Klassen-Check in einem Komponententest: Das `<article>` der Feature-Karte darf kein `overflow-hidden` haben. Das ist pragmatisch und verhindert einen Rückfall.

## Verifikation

1. `pnpm --filter web test` (bzw. Vitest für Lobby/MatchCard). Typecheck nur für das Paket `web` (`pnpm -r typecheck` stirbt mit SIGKILL).
2. Im Browser (Skill `run` oder Playwright-Screenshot wie in den Memories beschrieben): Lobby mit einer Partie „Du bist am Zug“ öffnen, ⋮ anklicken. Beide Menüeinträge müssen vollständig sichtbar sein, die Ecken der Karte weiter rund (hell und dunkel), der Hover-Zoom der MiniMap darf nicht über die Ecken hinausragen.

## Nachtrag: zweite Ursache

Task 2 allein brachte sichtbar keine Änderung. Der Karten-Wrapper in `apps/web/src/sections/lobby/components/Lobby.tsx` (Einblend-Animation mit `fill-mode-both`) behält ein `transform`. Dadurch bildet jede Karte einen eigenen Stapelkontext, und die nächste Karte verdeckt das Menü. Fix: Der Wrapper bekommt `relative has-[[aria-expanded=true]]:z-10`.
