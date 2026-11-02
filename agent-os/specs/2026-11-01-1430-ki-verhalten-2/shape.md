# KI-Verhalten, zweiter Block: Shaping-Notizen

## Umfang

Roadmap Phase 1c Punkt 7, Fortsetzung von `2026-11-01-1358-ki-regeln`. Vier Verhaltensbausteine in `packages/shared/src/game/engine/ai.ts`, nachgemessen mit `pnpm sim`: Belagerung verteidigter Städte, Verfolgung versprengter Feinde, Flugzeuge (Aufklärung und Bomber), Transporte mit Landungen, und die Befestigungs-Persönlichkeit (Ostrow) mit eigenem Verhalten. Keine Regel-, Server- oder Oberflächenänderung; das Simulationspaket bekommt die neuen Profilfelder für den Sweep und zwei Inselkarten-Configs.

Außerhalb des Umfangs: Sondereinheiten je Fraktion mit eigenem Verhalten (Blitzkorvette, Wolkenkreuzer), Flugzeugträger als Basis, Seekrieg gegen Schiffe, Sparringsgegner, der Eisenbund-Bonus (Regelfrage).

## Befunde, die den Block geprägt haben

- **Patts kommen nicht von Inseln.** Der Kartengenerator erzeugt bei 55 % Land praktisch immer eine Landmasse (0 von 30 Karten mit getrennten Hauptstädten auf „Mittel“, 1 von 30 auf „Groß“; erst bei 30 % Land auf „Groß“ 13 von 30). Die Rundenlimit-Enden der Stufen-Serie waren Belagerungen: „schwer“ stand mit 72 Einheiten vor drei Städten und griff in 100 Runden 23-mal an, weil jeder Einzelangriff auf einen Verteidiger in der Stadt (Grenadiere gegen Grenadiere 2/(2+2+1) = 0,4) unter der Schwelle lag.
- **Resteinheiten wurden nicht gejagt.** „Schwer gegen leicht“ endete in 294 von 400 Partien am Rundenlimit, obwohl „leicht“ keine Stadt mehr hatte: Ohne Stadtziel blieb die KI stehen.
- **Engine-Fakten für Landungen** (`references.md`): Landeinheiten steigen nur auf einem Wasserfeld in den Frachter (per `move`, danach Bewegung 0); `goto` über mehrere Runden steigt nicht ein; Ladung kann direkt vom Schiff aus angreifen und Städte erobern, `move` an Land behält die Restbewegung, `unload` nicht; versenkte Transporter reißen die Ladung mit. Schiffe laufen nur in eigene Städte ein.
- **Engine-Fakten für Flugzeuge:** `explore` ist ein fertiger Aufklärungsbefehl mit Treibstoffschutz, nur für Luft; Flugzeuge greifen nie leere Städte an, aber Verteidiger in Städten (mit Stadtschaden); `goto` und `patrol` prüfen keinen Treibstoff.

## Entscheidungen

- **Belagerung nach Ertrag mit Übermacht:** Ein Angriff auf einen Verteidiger in einer fremden Stadt lohnt, wenn Siegchance × (Wert des Verteidigers + Stadtwert / Verteidiger) ≥ Verlustchance × eigener Wert, und nur, wenn um die Stadt mehr eigene Kampfeinheiten (Abstand ≤ 2) stehen als `siegeRatio` × Verteidiger darin. Verhältnis je Stufe aus dem Sweep (siehe `plan.md`). Verworfen: Belagerung über eine niedrigere Schwelle (ignoriert den Wert der Einheiten); Belagerung ohne Übermacht (füttert Einheiten einzeln, „schwer“ fiel von 57 auf 51 %).
- **Verfolgung:** Ohne erreichbare fremde Stadt rückt eine Landeinheit an den nächsten sichtbaren Feind an Land heran (`approach`), damit Partien enden statt am Rundenlimit zu kleben.
- **Aufklärer:** Doppeldecker werden nur bis Runde 30 gebaut, solange Nebel bleibt und weniger als `maxScouts` fliegen; nach dem Sweep nur noch für „Aufklärung“ (`scoutShare` 0,15, ein Aufklärer). Sie bekommen den Befehl `explore`; die Engine bringt sie zum Tanken heim und bricht bei Sichtkontakt ab, die KI erteilt ihn dann neu. Ohne Nebel kehren sie zur Basis zurück.
- **Bomber:** Schwerbomber nur auf „schwer“ und mit „Luftkrieg“ (`bomberShare`), gebaut wenn Feinde in Sicht sind. Sie greifen mit der normalen Bewertung an, aber nur, wenn nach Anflug und Angriff (ein Zug, ein Nachrücken) der Treibstoff für den Rückweg zur nächsten Basis reicht; ohne Ziel warten sie an der Basis statt in den Nebel zu fliegen. Flugzeuge expandieren und erkunden nicht per `goto`.
- **Transporte (`transports`, normal und schwer):** Ein Frachter wird in einer Küstenstadt gebaut, wenn bekannte fremde Städte auf einer anderen Landmasse liegen, mindestens vier Landeinheiten da sind und weniger als `maxTransports` Frachter existieren („Seekrieg“ 2). Landmassen kommen aus einer Flutfüllung über die bekannten Landfelder, einmal je KI-Zug. Der leere Frachter wartet auf dem Wasserfeld neben der eigenen Stadt mit den meisten Landeinheiten in der Nähe. Landeinheiten, die zu Fuß keine fremde Stadt erreichen, steigen per `move` ein, wenn das Schiff in Reichweite liegt, sonst marschieren sie an die Küste daneben. Mit mindestens drei Einheiten an Bord fährt der Frachter an die Küste der nächsten fremden Stadt. Ladung greift von Bord aus an oder geht per `move` auf der fremden Landmasse an Land, nie auf der eigenen. Transporter und Ladung werden jede Runde neu geplant, unabhängig von `replan`. Verworfen: `unload` (Bewegung 0 danach), `goto` auf das Schiff (steigt nicht ein), Geleitschutz (später, mit Seekrieg).
- **Befestigung (Ostrow, Tag „Befestigung“):** Grenzstädte, also eigene Städte mit einer bekannten fremden Stadt oder einem Feind im Abstand ≤ 5, behalten eine Landeinheit als Garnison und bauen zu 60 % Panzerwagen statt 40 %. Städte im Hinterland bleiben frei. Neutrale Städte zählen nicht als Grenze. „Defensiv“ bleibt Schwelle +0,1 und Stadtverteidigung. Verworfen: Garnison überall (Sweep: −4 bis −8 Punkte).
- **Panzeranteil als Profilfeld (`armourShare`):** normal 0,4 wie bisher, schwer 0,8. Der Sweep zeigte für „schwer“ 65–67 % mit 0,6–0,8 gegen 58 % mit 0,4: Panzerwagen knacken verteidigte Städte (0,82 gegen 0,4 der Grenadiere). Belagerungsverhältnis für schwer 1,5, für normal 2.
- **Was der Sweep verworfen hat:** Aufklärer für alle Stufen (schwer fiel mit `scoutShare` 0,2 von 70 auf 40–53 %; Doppeldecker werden endlos nachgebaut, solange irgendwo Nebel bleibt), Grenzgarnison für „schwer“ (−5 bis −15 Punkte), Belagerung ohne Übermacht. Nachdem „normal“ ebenfalls belagert und verfolgt, ist der frühere Vorsprung von „schwer“ aus Neuplanung und Stadtverteidigung allein verschwunden (Sweep 3: alle Punkte 47–52 %); der Panzeranteil stellt ihn wieder her.
- **Sweep über alle Profilfelder:** `PROFILE_KEYS` im Simulationspaket umfasst jetzt auch `siege`, `siegeRatio`, `cityValue`, `replan`, `defend`, `fortify`, `armourShare`, `transports`, `maxTransports`, `scoutShare`, `maxScouts`, `bomberShare`, `maxBombers`.

## Kontext

- **Referenzen:** siehe `references.md`.
- **Produktbezug:** Roadmap Phase 1c Punkt 7; Vorher-Werte in `agent-os/product/ki-balance.md` (Nachmessung der Spec 1358).

## Angewandte Standards

Noch keine, siehe `standards.md`.
