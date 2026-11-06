# Neuigkeiten: Shaping-Notizen

## Umfang

Spieler sehen nach einem Update beim nächsten Besuch einmal einen Hinweis mit den neuen Funktionen aller Versionen, die sie noch nicht kennen, je Funktion ein Satz. Ohne neues Update gibt es keinen Hinweis, nur den Link „Neuigkeiten“ in der Fußzeile zu einer Seite mit allen Update-Infos.

Außerhalb des Umfangs: E-Mail oder Push zu Updates, GitHub-Release-Text aus derselben Datei.

## Entscheidungen (Spieler, 6. November 2026)

- **Quelle:** gepflegte Datei im Repo (`packages/shared/src/news`), nur spielerrelevante Neuerungen; ein Test verlangt einen Eintrag für die aktuelle Version.
- **Gesehen:** im Spielerkonto (`players.news_seen_version`), gilt auf allen Geräten.
- **Neue Spieler:** kein Hinweis; die Registrierung setzt die neueste Version als gesehen.
- **Zeitpunkt:** beim nächsten Besuch einer Menüseite, auch mit bestehender Sitzung; nie in einer Partie.
- **Rückwirkend:** Einträge ab 0.9.0; bestehende Spieler gelten als bis 0.10.1 informiert.
- **Visuals:** keine; Dialog im Stil der App, Seite im Stil der Rechtstexte, öffentlich.

## Kontext

- **Visuals:** keine
- **Referenzen:** siehe `references.md`
- **Produktbezug:** Phase 2 (nach dem Launch)

## Angewandte Standards

Keine; `agent-os/standards/` ist nicht angelegt.
