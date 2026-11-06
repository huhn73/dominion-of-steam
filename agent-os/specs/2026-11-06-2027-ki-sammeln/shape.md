# KI-Verhalten, sechster Block: Shaping-Notizen

## Umfang

Roadmap Phase 1c Punkt 15, Folgeidee aus `2026-11-06-1851-ki-verhalten-5`. Eroberungseinheiten sammeln sich außer Reichweite vor einer verteidigten Stadt und rücken gemeinsam vor, sobald genug da sind (`musterDistance`). Nur `packages/shared/src/game/engine/ai.ts`, Tests und Simulation.

Außerhalb des Umfangs: Sammeln vor Feldarmeen, Sammeln für Landungen über See.

## Befund

- Nachmessung 5: Der Schwerpunkt löst nur bei etwa 5 % der Angriffe aus, weil Einheiten einzeln ankommen. `planUnit` Schritt 2 schickt jede Einheit per `goto` direkt neben die Zielstadt (`approach`); dort wartet sie allein, bis die Übermacht für `siegePaysOff` da ist, und steht in Reichweite der Verteidiger.
- „Normal“ plant Einheiten auf Wache nie neu (`replan: 'goto'`). Wartende Einheiten dürfen deshalb nicht auf Wache gehen; sie warten mit `skip`, das zu Zugbeginn zurückgesetzt wird.

## Entscheidungen (Spieler, 6. November 2026)

- Diese Folge-Spec vor Gegenbau, Zielwahl im Mehrspieler und Auswertung echter Partien.
- Bedarf wie in `siegePaysOff`: mehr als `siegeRatio` × Verteidiger; Verteidiger aus Sicht und Gedächtnis.
- Kein Warten, wenn auf der Landmasse nicht genug eigene Kampfeinheiten stehen.
- Der Sweep entscheidet über den Wert; ohne Effekt wird ausgeschaltet.

## Befunde aus Sweep und Nachmessung

- Erster Sweep: Das Sammeln löste fast nie aus, weil Landeinheiten aus dem Sammelabstand nicht in die Stadt sehen. Korrektur: Eine feindliche Stadt außer Sicht zählt mit mindestens einem Verteidiger, wie ein Mensch es annehmen würde; neutrale Städte mit keinem.
- Zweiter Sweep (200 Partien je Punkt, `musterDistance` 0/2/3/4): normal 49–52 %, schwer 61–64 %, Verluste vor Städten unverändert. Wartezüge je Partie: schwer etwa 2, normal 6–8. Einheiten laufen meist auf verschiedene Ziele zu, an einem Sammelpunkt kommen selten genug zusammen.
- **Entscheidung:** `musterDistance` 0 für alle Stufen; Code und Tests bleiben als Option. **Verworfen:** Einheiten zusätzlich auf ein gemeinsames Ziel festzulegen (Armee-Planung). Das wäre ein größerer Umbau ohne Hinweis, dass er in der Simulation messbar wirkt.
- Zahlen in `ki-balance.md`, „Nachmessung 6“.

## Kontext

- **Visuals:** keine
- **Referenzen:** siehe `references.md`
- **Produktbezug:** Roadmap Phase 1c Punkt 15, `ki-balance.md`

## Angewandte Standards

Keine; `agent-os/standards/` ist nicht angelegt.
