# Plan: KI-Verhalten, vierter Block

## Context

Nach dem dritten Block (`2026-11-01-1530-ki-verhalten-3`) lag „schwer“ bei 63 % gegen „normal“ (Ziel ≥ 65 %); die Roadmap nannte als Rest Produktion nach Bedrohungslage, Träger als Flugbasis, Tauchboote und weitere Sparringsgegner. Dieser Block setzt davon um, was ohne neue Engine-Befehle messbar Wirkung hat.

## Entscheidungen (Shaping, 1. November 2026)

Siehe `shape.md`. Kurz: Garnisonsziel 2 für bedrohte Städte von „schwer“ (Sweep über 1, 2, 3, unbegrenzt: 73–78 %, 2 und 3 vorn), Tauchboote als Schiffsjäger für „schwer“ und „Seekrieg“, Sparringsgegner „turtle“ und „navy“. Träger bleiben außen vor.

## Task 1: Spec-Dokumentation

Dieser Ordner. Nachgezogen: `agent-os/product/roadmap.md` (Punkt 9 umgesetzt, Rest als Punkt 10), `agent-os/product/ki-balance.md` („Nachmessung 4“), `agent-os/product/ki-simulation/README.md` (Serie G erweitert, neue Berichte).

## Task 2: Garnisonsziel (`ai.ts`)

Profil `garrisonTarget` (schwer 2, sonst unbegrenzt). `chooseProduction`: Eine bedrohte Stadt baut Grenadiere nur, solange weniger Landeinheiten in ihr stehen als das Ziel; danach gilt der übliche Mix. Test: mit Ziel 2 baut eine Stadt mit einer Einheit Grenadiere, mit zwei Einheiten wieder Panzerwagen; unbegrenzt immer Grenadiere.

## Task 3: Tauchboote (`ai.ts`)

Profil `subShare` (schwer 0,3; „Seekrieg“ mindestens 0,3). Küstenstädte bauen ein Tauchboot (höchstens zwei), solange feindliche Schiffe in Sicht sind. Die Kriegsschiff-Planung (Geleit, Schiffsjagd, Erkunden) gilt für Tauchboote mit. Test: feindliches Kanonenboot in Sicht des eigenen Schiffs, Stadt nicht bedroht, Produktion enthält über die Seeds ein Tauchboot.

## Task 4: Simulation

`PROFILE_KEYS` um `garrisonTarget` und `subShare` erweitert; `sweep-hard-6.json` (Garnisonsziel); `sparring.json` um „turtle“ (Schwelle 0,65, keine Belagerung, Stadtverteidigung, Grenzgarnison, Garnison überall) und „navy“ (zwei Frachter, Schiffe 0,5, Bomber 0,3, Tauchboote 0,3) für jede Stufe ergänzt (15 Matchups).

## Task 5: Nachmessung

Serien A (Stufen), F (Inseln) und G (Sparring) mit dem Endstand; Zahlen in `ki-balance.md`.

## Verifikation

1. `pnpm --filter @dos/shared test` (163 Tests), `pnpm --filter @dos/sim test`, Typecheck je Paket, `pnpm lint`.
2. Serien laut Task 5.
