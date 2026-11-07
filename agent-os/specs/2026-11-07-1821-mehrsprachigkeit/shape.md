# Mehrsprachigkeit — Shaping Notes

## Scope

Dominion of Steam bekommt Englisch als zweite Sprache neben Deutsch. Übersetzt werden die Web-Oberfläche, die Spielinhalte (Kompendium, Setup, KI-Kommandanten, Tutorial), die Spielereignisse, Fehlermeldungen, Mails und Push sowie die Neuigkeiten und die Rechtsseiten. Die Sprache ergibt sich zuerst aus dem Browser, lässt sich in den Einstellungen wählen und wird im Profil gespeichert.

## Decisions

- **Sprachen:** Deutsch ist die Quelle und der Rückfall, Englisch die zweite Sprache. Weitere Sprachen sollen später möglich sein.
- **Technik:** Eine eigene typisierte Lösung ohne Bibliothek in `packages/shared/src/i18n`. `de` ist die Quelle, und `en` muss jeden Schlüssel haben, sonst schlägt der Typecheck fehl. Web und Server nutzen dieselbe Lösung.
- **Speicherort:** Die Sprache steht in einer eigenen Spalte `players.locale`, nicht in den Settings, weil der Server sie für Mails und Push direkt lesen muss. Besucher ohne Anmeldung bekommen sie aus localStorage oder dem Browser.
- **Ton:** Das Englisch soll den Dieselpunk-Ton treffen und nicht wörtlich übersetzt sein.
- **Eigennamen:** Einheiten, Gebäude und Fraktionen bekommen englische Namen. Bei den KI-Kommandanten werden Titel und Beschreibungen übersetzt, die Namen bleiben deutsch. Städtenamen bleiben ebenfalls deutsch. Die englischen Namen lege ich vor dem Einbau zur Bestätigung vor.
- **Ereignisse:** Ereignisse werden als Schlüssel und Parameter gespeichert. Altstände zeigen ihren gespeicherten deutschen Text weiter.
- **Rechtsseiten:** Die englischen Fassungen tragen einen Hinweis, dass die deutsche Fassung maßgeblich ist.
- **Routen und Meta:** Die Routen bleiben deutsch. Manifest und die Meta-Tags in `index.html` bleiben deutsch, nur `<html lang>` wird zur Laufzeit gesetzt.
- **Lieferung:** In Etappen, je Etappe ein Commit. Die Sprachwahl bleibt hinter `DEV_TOOLS`, bis alles übersetzt ist.

## Context

- **Visuals:** keine
- **References:** Spielfeld-Einstellungen und Profil (Sprachwahl speichern, `ApplyPlayerSettings`), Neuigkeiten (Test je Release), Spalte `news_seen_version` als Muster für eine eigene Spalte
- **Product alignment:** Die Roadmap führt unter Phase 2 → Inhalte den Punkt „Sprachwahl“. Englisch öffnet das Spiel für Strategie-Veteranen außerhalb des deutschen Sprachraums.

## Standards Applied

Es gibt kein `agent-os/standards/`, deshalb gelten die Projektregeln (siehe standards.md).
