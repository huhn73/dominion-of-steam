# Prompt für die Umsetzung eines Bereichs

## Bereichs-Variablen festlegen

- **SECTION_NAME** = [lesbarer Name, z. B. „Lobby & Multiplayer“]
- **SECTION_ID** = [Ordnername in sections/, z. B. „lobby-and-multiplayer“]
- **NN** = [Meilenstein-Nummer: 02 Spielfeld, 03 Fraktionen, 04 Partie-Setup, 05 Lobby, 06 Profil (01 ist die Shell)]

---

Ich möchte, dass du den Bereich **SECTION_NAME** meiner Anwendung umsetzt.

## Anweisungen

Lies und analysiere sorgfältig diese Dateien:

1. **@product-plan/product-overview.md**: Produktzusammenfassung als Gesamtkontext
2. **@product-plan/instructions/incremental/NN-SECTION_ID.md**: Anleitung für diesen Bereich

Sieh dir außerdem die Dateien des Bereichs an:
- **@product-plan/sections/SECTION_ID/README.md**: Überblick und Gestaltungsabsicht
- **@product-plan/sections/SECTION_ID/tests.md**: Test-Spezifikationen für das UI-Verhalten
- **@product-plan/sections/SECTION_ID/components/**: zu integrierende React-Komponenten
- **@product-plan/sections/SECTION_ID/types.ts**: TypeScript-Interfaces
- **@product-plan/sections/SECTION_ID/sample-data.json**: Testdaten

Falls der Bereich Bilder oder Töne nutzt, siehe auch **@product-plan/briefs/**.

## Bevor du beginnst

Sieh dir alle Dateien an und stelle mir dann Rückfragen zu:

1. **Integration:** wie der Bereich an vorhandene Funktionen und bereits gebaute Schnittstellen anschließt
2. **Produktanforderungen:** alles, was in Spezifikation oder Abläufen unklar ist
3. **Sonstiges:** was du vor der Umsetzung wissen musst

Frage mich zum Schluss, ob ich weitere Hinweise für die Umsetzung habe.

Wenn ich deine Fragen beantwortet habe, setze den Bereich um.
