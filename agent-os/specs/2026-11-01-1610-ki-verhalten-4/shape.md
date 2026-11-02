# KI-Verhalten, vierter Block: Shaping-Notizen

## Umfang

Roadmap Phase 1c Punkt 9, Fortsetzung von `2026-11-01-1530-ki-verhalten-3`. Drei Punkte: Produktion nach Bedrohungslage als Stellschraube für „schwer“, Tauchboote als Schiffsjäger, zwei weitere Sparringsgegner (Turtle, Marine). Nur `packages/shared/src/game/engine/ai.ts`, seine Tests und Simulations-Configs.

Außerhalb des Umfangs: Träger als Flugbasis (die KI baut keine Träger; Flugzeuge landen heute schon auf vorhandenen), Verhalten der Tauchboote jenseits der Schiffsjagd (Sichtbarkeit von Tauchbooten ist eine offene Regelfrage), Sparringsgegner mit Skript statt Profil.

## Entscheidungen

- **Garnisonsziel (`garrisonTarget`):** Eine bedrohte Stadt baut Grenadiere nur, bis die angegebene Zahl Landeinheiten in ihr steht, danach wieder den üblichen Mix (bei „schwer“ 80 % Panzer). Bisher baute eine bedrohte Stadt endlos Grenadiere, auch wenn sie schon voll war; die Grenadiere blieben als Garnison stehen und fehlten im Angriff. Wert aus dem Sweep über 1, 2, 3 und „unbegrenzt“ (siehe `plan.md`).
- **Tauchboote (`subShare`, schwer 0,3, „Seekrieg“ mindestens 0,3):** Küstenstädte bauen ein Tauchboot (höchstens zwei), solange feindliche Schiffe in Sicht sind. Tauchboote greifen nur Schiffe an (`canAttack`), die Kriegsschiff-Planung (Geleit, Schiffsjagd) gilt für sie mit; als Geleit nützen sie wenig, als Jäger mit Stärke 5 und Schaden 3 versenken sie Frachter und Kanonenboote mit einem Treffer.
- **Sparringsgegner:** „turtle“ (Schwelle 0,65, keine Belagerung, Stadtverteidigung, Grenzgarnison, Garnison überall) und „navy“ (zwei Frachter, Schiffe 0,5, Bomber 0,3, Tauchboote 0,3) ergänzen passiv, expander und rusher. Die Turtle prüft, ob eine Stufe befestigte Städte knackt; die Marine, ob sie Transporte schützt.

## Kontext

- **Referenzen:** siehe `references.md`.
- **Produktbezug:** Roadmap Phase 1c Punkt 9; Zahlen in `agent-os/product/ki-balance.md`, Abschnitt „Nachmessung 4“.

## Angewandte Standards

Noch keine, siehe `standards.md`.
