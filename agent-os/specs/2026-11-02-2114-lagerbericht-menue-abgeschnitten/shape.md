# Lagerbericht: ⋮-Menü abgeschnitten — Shaping-Notizen

## Umfang

Bugfix: Auf der großen Partie-Karte („Du bist am Zug“) öffnet der ⋮-Button ein Menü (Partie-Details, Aufgeben), von dem nur der obere Rand sichtbar ist.

## Entscheidungen

- Zwei Ursachen (mit Playwright am Docker-Build per `elementFromPoint` bestätigt):
  1. `overflow-hidden` am `<article>` der Feature-Variante von `MatchCard` schneidet das absolut positionierte Menü ab.
  2. Der Wrapper in `Lobby.tsx` (`animate-in … fill-mode-both`) behält nach der Animation ein `transform` und bildet damit einen eigenen Stapelkontext. Die nächste Karte im Raster wird über das Menü gemalt, `z-20` am Menü hilft nicht.
- Der erste Fix (nur Punkt 1) brachte sichtbar keine Änderung. Erst zusammen mit Punkt 2 ist das Menü sichtbar.
- Der Wrapper bekommt `relative has-[[aria-expanded=true]]:z-10`: Die Karte mit offenem Menü liegt über ihren Nachbarn.
- Clipping auf die Kopfgrafik verlagern (`rounded-t-[10px]` = innerer Radius von `rounded-xl` bei `border-2`), statt das Menü per Portal zu rendern. Kleinster Eingriff, Optik bleibt gleich.
- Regressionstest als Klassen-Check, weil jsdom kein Layout berechnet.

## Kontext

- **Visuals:** `visuals/menue-abgeschnitten.png` (Bug), `visuals/umsetzung-menue-sichtbar.png` (Docker-Build mit simuliertem Fix)
- **Referenzen:** `apps/web/src/sections/lobby/components/MatchCard.tsx`
- **Produktausrichtung:** keine Auswirkungen

## Angewandte Standards

Keine (`agent-os/standards/` existiert nicht).
