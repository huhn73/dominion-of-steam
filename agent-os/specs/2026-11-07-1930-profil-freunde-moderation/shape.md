# Konten, Profil und Freunde — Shaping Notes

## Scope

Roadmap Phase 2, die offenen Punkte Konten, Profil und Freunde („Inhalte“ entfällt):

1. Moderation von Anzeigenamen mit Sperrliste und reservierten Namen
2. Profil:
   - Ergebnisse werden vorberechnet.
   - Der Verlauf wird auf dem Server gefiltert.
   - Es gibt öffentliche Profile anderer Spieler.
   - Es gibt Abzeichen.
3. Freunde:
   - Eine eigene Seite zum Verwalten.
   - Freundschaftsanfragen statt sofortiger Freundschaft.

## Decisions

- **Moderation:**
  - Die Listen stehen fest im Code (shared), es gibt keine Admin-Pflege.
  - Reservierte Namen müssen als ganzer Name passen, Sperrwörter auch als Teilwort.
  - Vor dem Vergleich werden die Namen normalisiert (Umlaute, Leetspeak, Trennzeichen).
  - Bestehende Namen bleiben.
- **Öffentliches Profil:** Es zeigt Bilanz, Fraktionswerte, Partieverlauf und Abzeichen und hat einen Knopf „Freund hinzufügen“. Sichtbar ist es nur für angemeldete Spieler, ohne E-Mail-Adresse.
- **Abzeichen:**
  - Zum Start gibt es etwa 12, berechnet aus den vorberechneten Ergebnissen und dem Tutorial-Abschluss.
  - Beim Erreichen kommt eine Benachrichtigung (eigene Einstellung „Abzeichen“).
  - Der Nachtrag beim Start benachrichtigt nicht.
- **Freunde:**
  - Eine eigene Seite `/freunde` mit Navigationspunkt und Zähler.
  - Anfragen lassen sich annehmen, ablehnen und zurückziehen, Freunde lassen sich entfernen.
  - Eine gegenseitige Anfrage gilt als angenommen.
  - Anfragen und Annahmen lösen eine Benachrichtigung aus (eigene Einstellung „Freunde“).
- **Vorberechnung:**
  - Die Tabelle `player_results` hat eine Zeile je Spieler und beendeter oder aufgegebener Partie, das Tutorial zählt nicht.
  - Sie wird beim Ende bzw. bei der Aufgabe geschrieben und beim Serverstart für alte Partien nachgetragen.

## Context

- **Visuals:** keine
- **References:**
  - `profile/service.ts` (`playedMatch`, `getProfile`)
  - `auth/accounts.ts` (Freunde)
  - `notifications/*`
  - `realtime/signals.ts`
  - die Avatar-Umrechnung beim Serverstart als Muster für den Nachtrag
- **Product alignment:** Laut Mission braucht gemeinsames Spielen über Tage Mitspieler. Freunde und Profile machen sie auffindbar.

## Standards Applied

Siehe standards.md.
