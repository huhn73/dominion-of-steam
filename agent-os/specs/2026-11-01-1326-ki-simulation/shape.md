# KI-Simulation und Parameter-Sweep: Shaping-Notizen

## Umfang

Werkzeug, das viele Partien KI gegen KI ohne Server und Datenbank spielt, Kennzahlen sammelt, Berichte schreibt und Profilparameter rastert, plus eine erste Auswertung mit Regelvorschlägen je Stufe und Fraktion. Keine Änderung am Verhalten der KI; die folgt als eigene Spec. Keine neuen Screens.

## Fragen aus dem Shaping

- **Umfang des ersten Schritts:** Werkzeug plus erste Auswertung mit Regelvorschlägen (gewählt). Verworfen: nur Werkzeug; Werkzeug, Auswertung und erste KI-Änderungen in einem Zug.
- **Sweep:** einfacher Raster-Sweep (gewählt). Verworfen: erst manuell; evolutionäre Suche.
- **Arbeitsstand:** auf der Trefferpunkte-Spec aufbauen (gewählt), weil die KI-Bewertung die neue Kampfformel nutzt.
- **Spec-Konvention:** eigene Spec mit Roadmap- und Playtest-Nachzug (gewählt).

## Entscheidungen

- **Was „Lernen“ hier heißt:** keine Modellanpassung, sondern eine Messschleife. Serien über Stufe × Fraktion × Karte, Kennzahlen, Auswertung, daraus Regeln; nach jeder Änderung an der KI erneut messen und vergleichen.
- **Paket `packages/sim`** statt Skript in `packages/shared`: braucht Node-Typen und Worker-Threads, die der Client-Bundle nicht sehen soll.
- **tsx als Laufzeit**, in Worker-Threads per `--import` des Loaders. Belegt durch `worker.test.ts`.
- **Hooks statt Textauswertung:** `playAITurn` bekommt `options.profile` und `options.onCommand`. Der Server setzt beides nie. Kämpfe kommen exakt aus `CombatResult`, Produktion und sonstige Verluste aus dem Diff der Einheitenliste zwischen Zügen.
- **Sitzrotation** je Seed, damit der Startvorteil beide Seiten trifft; der Bericht weist den Sitzvorteil getrennt aus.
- **Wilson-Intervall** für die Siegquote; Hinweis, dass Rotationen desselben Seeds nicht unabhängig sind.
- **Rohdaten gitignoriert, Berichte committet.** `agent-os/` steht in `.prettierignore`, generiertes Markdown bricht `pnpm lint` nicht.
- **Rundendeckel** gilt auch für die Siegbedingungen `elimination` und `capitals`, damit kein Lauf hängen bleibt (Siegart `aborted`).
- **Laufzeit:** erst gemessen, dann entschieden. Rund 3 s je Partie machen Optimierungen unnötig; 1 000 Partien laufen mit 28 Workern in wenigen Minuten.

## Grenzen

- KI gegen KI misst Stärke relativ zueinander, nicht Spielspaß gegen Menschen. Sparringsgegner mit festem Verhalten (passiv, reiner Expandierer, Rusher) wären ein späterer Schritt.
- Bei drei und mehr Teilnehmern ist die Siegquote grob; der Bericht führt Platz und Eliminierungsrunde mit.
- Ein Profil-Override gilt nur innerhalb der Verzweigungen der Stufe (`ai.ts`: Weiterfahren bei `goto` nur „hard“, „easy“ baut nur Grenadiere), es sei denn `difficulty` wird mitgerastert.

## Kontext

- **Referenzen:** siehe `references.md`.
- **Produktbezug:** Roadmap Phase 1c, Punkte 5 und 6; `playtest-runde-2.md` Punkt 7 (Zugdauer).

## Angewandte Standards

Noch keine, siehe `standards.md`.
