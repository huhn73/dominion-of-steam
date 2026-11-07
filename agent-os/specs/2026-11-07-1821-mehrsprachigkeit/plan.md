# Mehrsprachigkeit (Deutsch + Englisch)

## Context

Dominion of Steam ist komplett deutsch. Die Texte stehen inline in rund 60 Komponenten, in `packages/shared` (Kompendium, Tutorial, Neuigkeiten, Setup, Fehler und Spielereignisse als fertige Sätze im Spielstand) und auf dem Server (Mails, Push, API-Fehler). Eine i18n-Bibliothek gibt es nicht. Die Roadmap führt „Sprachwahl“ unter Phase 2 → Inhalte. Englisch soll das Spiel für ein internationales Publikum öffnen.

**Entscheidungen aus dem Shaping:**
- Sprachen: Deutsch (Quelle und Rückfall) + Englisch. Die Struktur bleibt offen für weitere Sprachen.
- Umfang: Web-UI, Kompendium und Spielinhalte, Server-Texte (Mails, Push, Fehler), Neuigkeiten und Rechtsseiten
- Sprachwahl: Vorgabe aus der Browsersprache, Wahl in den Einstellungen, gespeichert im Profil. Damit gilt sie auch für Mails und Push.
- Technik: eine eigene typisierte Lösung ohne Abhängigkeit
- Englisch im Dieselpunk-Ton, nicht wörtlich übersetzt
- Übersetzt werden Einheiten, Gebäude, Fraktionsnamen sowie Titel und Beschreibungen der KI-Kommandanten. Städtenamen und die Namen der Kommandanten bleiben deutsch.
- Spielereignisse werden als Schlüssel + Parameter gespeichert. Alte Einträge zeigen den gespeicherten deutschen Text.
- Rechtsseiten auf Englisch tragen den Hinweis, dass die deutsche Fassung maßgeblich ist.
- Lieferung in Etappen, je Etappe ein Commit. Die Sprachwahl wird erst freigeschaltet, wenn alles übersetzt ist.
- Routen bleiben deutsch (`/einstellungen`, `/partie/…`). Manifest und die statischen Meta-Tags in `index.html` bleiben deutsch.

## Task 1: Spec-Dokumentation speichern

`agent-os/specs/2026-11-07-1821-mehrsprachigkeit/` mit `plan.md` (dieser Plan), `shape.md` (Umfang, Entscheidungen, Kontext), `standards.md` (es gibt kein `agent-os/standards/`, deshalb gelten die Projektregeln wie im Avatare-Spec: Typecheck je Paket, Fehlerformat `{error:{code,message}}`, NEWS 0.11.0 sammelt, Push nur nach Rückfrage) und `references.md`. Kein `visuals/`.

## Task 2: Grundgerüst und Sprachwahl (noch versteckt)

**Shared, `packages/shared/src/i18n/`:**
- `types.ts`: `Locale = 'de' | 'en'`, `LOCALES`, `DEFAULT_LOCALE = 'de'`, `pickLocale(acceptLanguage | navigator.languages)`
- Wörterbücher je Namensraum: `de/*.ts` ist die Quelle (`as const`), `en/*.ts` ist als `Dict<typeof de>` typisiert. Der Typecheck schlägt fehl, wenn in `en` ein Schlüssel fehlt.
- `translate(locale, key, params)`: Schlüssel mit Punkten, Platzhalter `{name}`. Plural über `{ one, other }`-Objekte, die mit `Intl.PluralRules` und dem Parameter `count` gewählt werden.
- `format.ts`: `formatDate`, `formatDateTime`, `formatNumber`, `timeLeft`, `timeAgo` mit Locale. Sie ersetzen die rund 10 fest verdrahteten `'de-DE'` (z. B. `sections/lobby/components/format.ts`, `sections/profil/components/format.ts`, `shell/AppVersion.tsx`, `data/match.ts`, `server notifications/events.ts`).
- `Message = { key, params? }` als Rückgabetyp für Prüfungen in shared, statt eines fertigen Satzes

**Server:**
- Spalte `players.locale text not null default 'de'`, Migration `0010_sprache.sql` über `pnpm db:generate`. Sie ist eine eigene Spalte wie `news_seen_version`, damit `enqueue` und `deliverEmail` sie direkt lesen können.
- Die Registrierung nimmt `locale` an (vom Client aus der Browsersprache). `PUT /api/locale` speichert sie (`routes/profile.ts`, `profile/service.ts`).
- `requestLocale(req)`: angemeldet gilt `player.locale`, sonst der Header `X-Locale`, sonst `Accept-Language`, sonst `de`.

**Web:**
- `apps/web/src/i18n/LocaleProvider.tsx` sitzt über dem Router und hält den Zustand: localStorage `dos.locale`, sonst die Browsersprache. Er abonniert **keine** Spieler-Queries (siehe Memory „Query-Cache beim Login“). Er setzt `document.documentElement.lang`. Hooks: `useT()`, `useLocale()`, `useFormat()`.
- `ApplyPlayerSettings.tsx` übernimmt nach dem Login die Sprache aus dem Profil, nach dem Muster beim Theme.
- `data/api.ts` sendet `X-Locale` mit. Die Rückfalltexte NETWORK/UNKNOWN kommen aus dem Wörterbuch.
- Die Sprachwahl kommt als Rubrik in `sections/profil/components/Einstellungen.tsx`, mit Auswahl Deutsch/English, und speichert über `PUT /api/locale`. Sichtbar ist sie vorerst nur mit `DEV_TOOLS`. Auf der Anmeldekarte gibt es einen kleinen Umschalter DE/EN für Besucher, ebenfalls hinter dem Flag.
- Der Test-Wrapper rendert mit `de`. Bestehende Tests bleiben unverändert.

## Task 3: Web-UI, Rahmen und Menüseiten

Inline-Texte werden durch `t('…')` ersetzt, die englischen Texte gleich mitgeschrieben: `shell/`, `layouts/`, `pages/` (Anmeldung, Registrierung, Passwort, Lobby, Profil, Einstellungen, Neuigkeiten-Rahmen, Admin), `sections/lobby`, `sections/profil`, `sections/admin`. Die lokalen Label-Maps (`DIFFICULTY_LABEL`, `RUBRICS`, `Listen.tsx`) werden zu Schlüsseln. Die rund 15 Plural-Ternaries werden auf `{one, other}` umgestellt. Commit.

## Task 4: Web-UI, Partie-Setup und Spielfeld

Gleiches Vorgehen für `sections/partie-setup` und `sections/spielfeld` (Kopfzeile, Panels, Rundenbericht-Rahmen, Ergebniskarte, TutorialPanel-Knöpfe, `report.ts`-Labels, `unitIcons.tsx`), außerdem `sections/fraktionen` und `audio/`. Einheiten- und Fraktionsnamen löst der Client über die ID aus dem lokalisierten Kompendium auf, statt den Namen aus der View zu nehmen. Commit.

## Task 5: Spielinhalte in shared

- **Kompendium:** `compendium/data.en.json` mit derselben Struktur wie `data.json`. Ein Test prüft, dass IDs und Felder übereinstimmen und kein Feld leer ist. Ein Zugriff `compendiumFor(locale)` kommt dazu, und `game/catalog.ts` bleibt sprachneutral (IDs).
- **Namensliste vorab:** Bevor das Kompendium eingebaut wird, lege ich die englischen Namen für Fraktionen, Einheiten und Gebäude zur Bestätigung vor (Dieselpunk-Ton).
- **Setup:** Optionslabels in `setup/data.ts` werden zu Schlüsseln. Titel, Stil und Beschreibung der KI-Kommandanten gibt es zweisprachig, die Namen bleiben.
- **Tutorial:** `TUTORIAL_STEPS` in `engine/tutorial.ts` liefert Schlüssel statt Text. `tutorialView()` gibt die Schlüssel weiter, das `TutorialPanel` übersetzt. Der Partiename „Tutorial: Erste Schritte“ wird beim Anzeigen über `isTutorial` lokalisiert.
- **Neuigkeiten:** `news/index.ts`-Items werden zu `{ de: {title,text}, en: {title,text} }`, auch für alle alten Releases. Der bestehende Test verlangt zusätzlich beide Sprachen.

Commit.

## Task 6: Spielereignisse und Fehler

- **Ereignisse:** `GameEvent` (`game/types.ts`) bekommt `key` und `params`. `message` wird optional und bleibt nur für Altstände. `addEvent` (`engine/state.ts:297`) nimmt einen `Message` entgegen. Die rund 23 Aufrufe in `combat.ts`, `turn.ts`, `explore.ts`, `movement.ts`, `victory.ts` und `surrender.ts` werden umgestellt. Die Parameter enthalten IDs (`unitTypeId`, `factionId`) und Städtenamen. Dasselbe gilt für `CombatResult.message` und `LogEntry.result`. `report.ts` und `EventLog.tsx` übersetzen und greifen auf `message` zurück, wenn `key` fehlt. Die Engine-Tests prüfen künftig `key` statt Sätzen.
- **Befehlsfehler:** `fail(code, message)` in `engine/commands.ts` wird zu `fail(code, messageKey, params)`, ebenso `setup/validate.ts`, `profile/index.ts` (`validateSettings`, `validateDisplayName`) und `account`.
- **API-Fehler:** Die Fehlerklassen des Servers (`LobbyError`, `SetupError`, `ProfileError`, `AccountError`, Routen-Helfer) nehmen einen Schlüssel und übersetzen beim Senden mit `requestLocale(req)`. Das Format `{error:{code,message}}` bleibt.

Commit.

## Task 7: Mails und Push

- `auth/accountMails.ts` (5 Mails), `notifications/mail.ts` (Layout, `lang`, Gruß, Fußzeile) und `notifications/service.ts` (`mailFor`, Knopf „Zur Partie“) rendern mit der Sprache des Empfängers (`Recipient` bekommt `locale`).
- `notifications/events.ts`, `lobby/service.ts:842` und `setup/service.ts:437`: Titel und Text werden in `enqueue` in der Sprache des Empfängers erzeugt. `enqueue` liest dafür `locale` bei den Spielern mit. `formatDeadline` arbeitet mit Locale.
- Die Server-Tests decken beide Sprachen für eine Mail und einen Push ab.

Commit.

## Task 8: Rechtsseiten

Es gibt englische Fassungen von Impressum, Datenschutz und Lizenzen. Dafür bekommt `pages/rechtliches/` je Seite einen Teil `…En.tsx`, und die Seite wählt nach Sprache. Oben auf den englischen Seiten steht der Hinweis „This translation is provided for convenience; the German version is legally binding.“ `anbieter.ts` bleibt gleich. Commit.

## Task 9: Freischalten und absichern

- Das Flag fällt weg. Die Sprachwahl erscheint in den Einstellungen und auf der Anmeldekarte.
- **Wächtertest** (`apps/web/src/i18n/noInlineGerman.test.ts`): Er durchsucht die `.tsx`-Dateien außerhalb von Tests und `i18n/` nach String- und JSX-Literalen mit `äöüÄÖÜß` oder typischen deutschen Wörtern und schlägt fehl, wenn neue Inline-Texte dazukommen. Eine Ausnahmeliste gibt es für Eigennamen.
- Test: Kein englischer Wert ist leer oder gleich dem deutschen (mit Ausnahmeliste, z. B. „Dominion of Steam“).
- NEWS-Eintrag 0.11.0 bekommt ein Item zur englischen Sprache (zweisprachig), das Datum bleibt offen. In der Roadmap wird „Sprachwahl“ abgehakt, mit Verweis auf den Spec. `tech-stack.md` bekommt einen Absatz i18n.

Commit, Push nur nach Rückfrage (`main:dev`).

## Kritische Dateien

`packages/shared/src/i18n/*` (neu), `packages/shared/src/game/{types.ts,engine/state.ts,engine/combat.ts,engine/commands.ts,engine/tutorial.ts}`, `packages/shared/src/{compendium,news,setup,profile}`, `apps/server/src/db/schema.ts`, `apps/server/src/notifications/*`, `apps/server/src/auth/accountMails.ts`, `apps/web/src/{data/api.ts,settings/ApplyPlayerSettings.tsx,sections/profil/components/Einstellungen.tsx,main.tsx}`

## Verification

- Je Etappe: Typecheck je Paket einzeln (`pnpm --filter @dos/shared typecheck`, dann server, dann web, siehe Memory), dazu `pnpm --filter … test` für alle drei Pakete
- Migration lokal mit `pnpm db:migrate`. Danach legt die Registrierung mit englischem Browser `locale='en'` an.
- Manuell bzw. mit Playwright (Memory „Spec-Screenshots“): Sprache in den Einstellungen umschalten. Lobby, Setup, Spielfeld mit Rundenbericht und Kampf, Tutorial, Kompendium, Neuigkeiten und Rechtsseiten müssen dann vollständig englisch sein. Eine laufende Altpartie muss alte Ereignisse weiter deutsch zeigen, ohne Fehler.
- Testmail (Passwort vergessen) und Push „Du bist am Zug“ bei einem Konto mit `en` prüfen (lokaler Mailer bzw. Log).
- Der Wächtertest ist grün, nachdem Task 3 und 4 abgeschlossen sind.
