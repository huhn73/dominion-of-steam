# KI-Verhalten, fünfter Block: Shaping-Notizen

## Umfang

Roadmap Phase 1c Punkt 14, Fortsetzung von `2026-11-02-2209-ki-neutrale-inseln`. Zwei Bausteine in `packages/shared/src/game/engine/ai.ts`, nachgemessen mit `pnpm sim`: koordinierte Angriffe mehrerer Einheiten auf ein Ziel („Schwerpunkt“) und ein Gedächtnis für fremde Einheiten, die im Nebel verschwunden sind.

Außerhalb des Umfangs (Ideen für spätere Blöcke): Gegenbau nach der Produktion des Gegners, Zielwahl bei mehreren Gegnern (Schwächster, Führender), Hauptstadt als Schwerpunkt, Suche nach vorn für „schwer“, Messung gegen echte Partien von Menschen.

## Befunde im Code

- `playAITurn` plant jede Einheit für sich (`planUnit` in der Schleife über `unitIds`). Ein Angriff kommt nur zustande, wenn er sich einzeln lohnt (`attackThreshold`, `siegePaysOff`); die Belagerung zählt nur eigene Einheiten im Abstand ≤ 2. Eine geplante Folge „erst anschlagen, dann nachsetzen und einrücken“ gibt es nicht, obwohl Kämpfe seit den Trefferpunkten Schaden hinterlassen.
- `knowledge()` → `projectBoard` liefert fremde Einheiten nur, solange sie sichtbar sind. Städte bleiben über `knownBy` mit dem zuletzt gesehenen Besitzer in Erinnerung, Einheiten nicht.

## Entscheidungen (Spieler, 6. November 2026)

- Beide Bausteine für „normal“ und „schwer“ als Profilfelder (`strike`, `memoryRounds`), Werte aus dem Sweep; „leicht“ bleibt ohne.
- Das Gedächtnis wirkt auf Stadtbedrohung, Verfolgung, Zielwahl der Frachter und Belagerung. Die KI merkt sich nur, was sie selbst gesehen hat, sie sieht also nicht mehr als ein Mensch.
- Das Gedächtnis liegt im Spielstand (`ParticipantState.aiMemory`) und geht nicht an Clients.
- Ziele: schwer gegen normal ≥ 65 % der entschiedenen Partien, Fraktionsduelle 40–60 %, Inseln und Archipel fallen nicht ab, Ø KI-Zug < 100 ms, Budget nie erschöpft.

## Befunde aus Sweep und Nachmessung

- Beide Bausteine bewegen KI-gegen-KI-Quoten nicht messbar (Sweeps mit 200 Partien je Punkt: normal neu gegen alt 50–52 %, schwer gegen normal 61–64 %); Zahlen in `ki-balance.md`, „Nachmessung 5“.
- Der Schwerpunkt löst in etwa 5 % der Angriffe aus. Die Einzelplanung greift schon nacheinander an, Panzerwagen nehmen ihre Ziele meist allein, die Belagerung mit Übermacht deckt Städte ab.
- Das Gedächtnis zielt auf Gegner, die sich in den Nebel zurückziehen. Das tun Menschen, KI-Gegner kaum.
- Wirkung des Gedächtnisses auf die Belagerung: Angegriffen wird nur, was sichtbar ist, deshalb zählen erinnerte Verteidiger in `siegePaysOff` praktisch nie. Wirksam wird es über die Wahl des Marschziels: Ein erinnerter Verteidiger macht eine Stadt um `GHOST_DEFENDER` = 2 Felder „weiter“.
- Zugdauer unverändert.
- **Entscheidung:** `strike` und `memoryRounds` 5 bleiben für normal und schwer eingeschaltet. **Verworfen:** die Bausteine wieder auszubauen, weil sie nichts kosten und gegen Menschen wirken. Feinabstimmung der Werte, weil der Sweep keinen Unterschied zeigt.
- **Folgeidee:** Sammeln vor dem Angriff. Einheiten warten vor einer verteidigten Stadt, bis genug zusammen sind, statt einzeln heranzulaufen.

## Kontext

- **Visuals:** keine
- **Referenzen:** siehe `references.md`
- **Produktbezug:** Roadmap Phase 1c Punkt 14, `ki-balance.md`

## Angewandte Standards

Keine; `agent-os/standards/` ist nicht angelegt.
