# Prompt für die Umsetzung in einem Durchgang

Ich möchte, dass du eine vollständige Webanwendung umsetzt, basierend auf ausgearbeiteten UI-Designs und Produktspezifikationen, die ich dir bereitstelle.

## Anweisungen

Lies und analysiere sorgfältig diese Dateien:

1. **@product-plan/product-overview.md**: Produktzusammenfassung mit Bereichen und Entitäten
2. **@product-plan/instructions/one-shot-instructions.md**: vollständige Umsetzungsanleitung für alle Meilensteine

Sieh dir danach außerdem an:
- **@product-plan/design-system/**: Farb- und Schrift-Tokens
- **@product-plan/data-shapes/**: UI-Datenverträge (welche Datenformen die Komponenten erwarten)
- **@product-plan/shell/**: Komponenten der Anwendungs-Shell
- **@product-plan/sections/**: alle Bereichskomponenten, Typen, Beispieldaten und Test-Spezifikationen
- **@product-plan/briefs/**: Art-Brief (Bilder, Pfade, Fraktionsvarianten) und Audio-Brief (adaptive Musik, Umgebung, Soundeffekte)

## Bevor du beginnst

Sieh dir alle Dateien an und stelle mir dann Rückfragen zu:

1. **Meinem Tech-Stack:** Framework, Sprache, Werkzeuge und Konventionen einer vorhandenen Codebasis
2. **Server und Spielstände:** Partien müssen nach jedem Zug dauerhaft gespeichert werden und Neustarts überstehen. Wie soll das umgesetzt werden (Datenbank, Echtzeit für Live-Partien, Hintergrundjobs für Fristen und KI-Züge)?
3. **Anmeldung und Benutzer:** wie sich Spieler registrieren und anmelden
4. **Spiellogik und KI:** Kampfberechnung, Produktion, Sicht und KI-Verhalten sind in den Designs nur als Oberfläche angelegt. Was ist bereits festgelegt, was soll vorgeschlagen werden?
5. **Produktanforderungen:** alles, was in Spezifikationen oder Abläufen unklar ist
6. **Sonstiges:** was du vor der Umsetzung wissen musst

Frage mich zum Schluss, ob ich weitere Hinweise für die Umsetzung habe.

Wenn ich deine Fragen beantwortet habe, erstelle zuerst einen umfassenden Umsetzungsplan, bevor du programmierst.
