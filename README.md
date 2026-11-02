# Dominion of Steam

Rundenbasiertes Eroberungsspiel in einer alternativen Dieselpunk-Welt, im Browser auf Desktop und Mobilgeräten, mit Multiplayer (live und asynchron) und KI-Gegnern.

## Entwicklung

Voraussetzungen: Node 24 (`.nvmrc`), pnpm über `corepack enable pnpm`, Docker (für Postgres)

```bash
pnpm install
cp apps/server/.env.example apps/server/.env
docker compose up -d     # Postgres 17 auf Port 5442 (dos, dos_test), Mailpit, App auf 8080
pnpm dev        # Web (http://localhost:5173) und Server (http://localhost:3000)
pnpm test       # Vitest in allen Paketen (Server-Tests mit Datenbank nur mit TEST_DATABASE_URL)
pnpm typecheck
pnpm lint       # Prettier
```

## Aufbau

- `apps/web/`: Vite, React, Tailwind CSS v4, React Router (Shell, Seiten)
- `apps/server/`: Fastify-Server mit Konten-, Partie- und Lobby-API, Benachrichtigungen (Web-Push, E-Mail) und Hintergrundaufgaben (Fristen), Drizzle-Schema und Migrationen (`drizzle/`); führt beim Start die Migrationen aus und legt Dev-Konten und Demo-Partie an
- `packages/sim/`: Headless-Simulation KI gegen KI mit Berichten und Parameter-Sweep (siehe „KI-Simulation“)
- `packages/shared/`: gemeinsame Typen, Prüfregeln für Konten (`src/account/`), Hex-Regeln, die Regel-Engine (`src/game/engine/`), die Stammdaten von Fraktionen und Einheiten (`src/compendium/`), Regeln, KI-Persönlichkeiten und Prüfung des Partie-Setups (`src/setup/`), Lobby (`src/lobby/`), Benachrichtigungen (`src/notifications/`) sowie Profil und Einstellungen mit Vorgaben und Prüfung (`src/profile/`)
- `agent-os/`: Produktdokumentation und Specs
- `product-plan/`: Design-Übergabe aus Design OS (Komponenten, Typen, Spezifikationen, Test-Spezifikationen, Screenshots, Art- und Audio-Brief). Einstieg: `product-plan/README.md`
- `public/art/`: Ablage für Illustrationen laut `product-plan/briefs/art-brief.md`
- `public/audio/`: Musik, Umgebungsschleifen und Soundeffekte (OGG/Opus) laut `product-plan/briefs/audio-brief.md`; `manifest.json` ordnet IDs den Dateien zu (Effekte mit Varianten als Listen), `credits.json` nennt die CC0-Quellen der Effekte. abgespielt von `apps/web/src/audio/` (siehe „Ton“)
- `public/`: außerdem Icons (`icon.svg`, PNGs, `favicon.ico`), `manifest.webmanifest` und der Service Worker; `scripts/icons.mjs` rendert die PNGs aus `icon.svg`
- `.claude/commands/agent-os/`: Agent-OS-Befehle für Produktplanung, Standards und Specs

## Anmeldung

Alle Seiten außer `/anmelden` und `/registrieren` verlangen eine Anmeldung (Sitzungs-Cookie `dos_session`). Mit Dev-Werkzeugen (lokal und im Docker-Setup) legt der Server beim Start diese Konten an, alle mit dem Passwort `dampfmaschine`:

| Name                       | E-Mail                 |
| -------------------------- | ---------------------- |
| Björn                      | `bjoern@dominion.test` |
| Lena Hartmann              | `lena@dominion.test`   |
| Mira Okonkwo               | `mira@dominion.test`   |
| Jonas Vogt                 | `jonas@dominion.test`  |
| Tobias Brenner             | `tobias@dominion.test` |
| Selin Arslan               | `selin@dominion.test`  |
| Paul Kretschmer-Wittenberg | `paul@dominion.test`   |

Björn ist mit allen befreundet. In der Demo-Partie spielen Björn und Lena Hartmann (zweites Browserprofil oder privates Fenster für Lena). Neu registrierte Konten nehmen an der Demo nicht teil, können aber Solo-Partien anlegen.

**E-Mail-Bestätigung:** Nach der Registrierung schickt der Server eine Willkommensmail mit Bestätigungslink (lokal in Mailpit, 24 Stunden gültig). Das Konto ist sofort spielbar; bis zum Klick auf den Link gehen aber keine E-Mail-Benachrichtigungen raus, und Lobby und Einstellungen zeigen einen Hinweis mit „Erneut senden“ (höchstens alle 2 Minuten). Dev-Konten gelten als bestätigt. Eine bestätigte E-Mail-Änderung schickt einen Hinweis an die alte Adresse, eine Passwortänderung einen an die aktuelle.

**Passwort vergessen:** Link auf der Anmeldeseite, Seite `/passwort-vergessen`. Die Antwort verrät nicht, ob ein Konto existiert. Der Link in der Mail führt zu `/passwort-zuruecksetzen?token=…`, gilt 60 Minuten und einmal; das neue Passwort meldet auf diesem Gerät an, beendet alle anderen Sitzungen und bestätigt die Adresse mit.

**Rate-Limits** je IP (außer in Tests, `@fastify/rate-limit`, im Prozess): Anmeldung 20 in 15 Minuten, Registrierung 5 pro Stunde, Passwort vergessen 5, Zurücksetzen 10, Bestätigung erneut senden 5, E-Mail und Passwort ändern 10, Konto löschen 5. Antwort 429 mit `RATE_LIMITED`. Konto löschen verlangt das aktuelle Passwort. Die Kontaktadresse in den Hinweis-Mails kommt aus `SUPPORT_EMAIL` (Vorgabe: Absender aus `MAIL_FROM`).

Neue Partien entstehen über den Assistenten unter `/neue-partie`: Solo-Partien (nur KI-Gegner oder freie Plätze mit KI) starten sofort, Partien mit Freunden, Einladungslink oder offenen Plätzen warten im Warteraum `/warteraum/<id>`, bis der Ersteller sie startet.

Die Demo-Partie liegt unter `/partie/demo`. Die Dev-Leiste unter der Lobby legt Solo-Partien gegen die KI auf einer erzeugten Karte an (Größe, Anzahl und Schwierigkeit wählbar), setzt die Demo zurück und lässt in der Demo Mitspieler ihren Zug beenden.

## Kampfregeln

Die Regeln liegen in `packages/shared/src/game/rules.ts` und `engine/combat.ts`; Angriffsdialog, Stadt-Panel und Kompendium („Gefecht“) lesen dieselben Werte. Stand nach Playtest Runde 2 (`agent-os/specs/2026-11-01-1238-kampf-trefferpunkte/`; Domänen, Boni und Stadtschaden aus `agent-os/specs/2026-10-31-0207-kampfregeln/`):

- **Trefferpunkte und Schaden:** Jeder Einheitentyp hat Trefferpunkte (Grenadiere 1, Panzerwagen 2, Dampfkoloss 3, Doppeldecker 1, Schwerbomber 1, Wolkenkreuzer 2, Frachter 3, Kanonenboot 3, Tauchboot 2, Blitzkorvette 8, Panzerkreuzer 12, Flugzeugträger 8) und einen Schadenswert je Treffer (Dampfkoloss, Schwerbomber, Wolkenkreuzer und Blitzkorvette 2, Tauchboot und Panzerkreuzer 3, sonst 1). Anzeige als „2/3“; Reparatur +1 je Runde in einer eigenen Stadt.
- **Kampf:** Die Trefferchance je Runde ist Stärke gegen Abwehr samt Boni (a / (a + d)), unabhängig vom Zustand. Der Kampf läuft in Runden, bis eine Seite keine Trefferpunkte mehr hat: Trifft der Angreifer, verliert der Verteidiger dessen Schadenswert, sonst umgekehrt. Der Dialog zeigt Siegchance (`exchangeOdds` in `rules.ts`, exakt berechnet), Trefferchance, Schaden je Treffer und den erwarteten eigenen Verlust; der Toast nennt die Rundenzahl. Angriffe gehen immer auf ein Nachbarfeld; entfernte Ziele fährt die Einheit erst an (der Dialog nennt die Felder).
- **Angriffskosten:** Ein Angriff kostet einen Bewegungspunkt (Flugzeuge zusätzlich einen Treibstoff). Mit Restbewegung kann die Einheit erneut angreifen oder fahren; die KI nutzt das (fahren, angreifen, nochmals angreifen).
- **Stadtangriff:** Eine Stadt ohne Verteidiger wird mit einem Wurf gegen ihre Abwehr angegriffen; die Einheit ist danach immer verbraucht. Bei Sieg wechselt die Stadt den Besitzer, ein unbeschädigter Panzerwagen oder Dampfkoloss hinterlässt Grenadiere darin, Grenadiere hinterlassen eine leere Stadt. Verteidiger in der Stadt werden vorher wie Einheiten bekämpft. Alte Spielstände mit Prozent-Zustand werden beim Laden umgerechnet.
- **Domänen:** Land greift Land, Flugzeuge über Land und Schiffe auf Nachbarfeldern (Küste, Hafen) an. See greift See, Landeinheiten an der Küste und Flugzeuge an; das Tauchboot nur Schiffe, der Frachter nie. Luft greift alles an. Städte erobern nur Landeinheiten.
- **Tauchboote sind getarnt:** Feindliche Tauchboote sieht man nur mit einem eigenen Tauchboot im Umkreis von zwei Feldern oder wenn eine eigene Einheit gegen sie fährt (die Bewegung endet davor, Ereignis „Weg … versperrt“); dann bleiben sie bis zum nächsten Zug ihres Besitzers sichtbar und angreifbar. In Rundenbericht und Wiedergabe tauchen getarnte Tauchboote nicht auf.
- **Flugzeugträger sind Flugbasen:** Flugzeuge landen per Bewegung auf einem eigenen Träger (bis vier), tanken dort zu Zugbeginn auf, stürzen dort nicht ab und starten wieder. Die KI baut auf „schwer“ einen Träger, sobald Bomber und Frachter unterwegs sind; er begleitet den Konvoi.
- **Nachrücken:** Wer eine Einheit vernichtet, rückt auf ihr Feld, wenn er es betreten darf, dort kein weiterer Gegner steht und keine fremde Stadt liegt (kostet keine Bewegung).
- **Abwehrboni (additiv):** Landeinheiten im Wald +1, auf Hügeln +1, im Gebirge +2. Jede Einheit in einer Stadt +1, bei der Salzküsten-Liga +2. Leere Städte verteidigen sich mit 1 (+ Befestigung).
- **Städte unter Beschuss:** Jeder Angriff auf eine Stadt oder eine Einheit darin erhöht ihren Schaden (max. 3) und verlängert die laufende Produktion um eine Runde; neue Bauaufträge dauern pro Schadenspunkt eine Runde länger. Jede eigene Runde ohne Angriff heilt einen Punkt. Das Stadt-Panel zeigt den Schaden.

## Spielfeld-Bedienung

Stand nach Playtest Runde 1 (`agent-os/specs/2026-10-31-0241-spielfeld-bedienung/`):

- **Stapel:** Mehrere Einheiten auf einem Feld zeigen ein Token mit Zähler; in Städten zeigt das versetzte Token die Garnisonsgröße. Ladung zählt nicht zum Stapel.
- **Auswahl:** Tippen wechselt reihum Einheit 1 → Einheit 2 → … → Stadt → nichts. Das Einheiten-Panel listet unter „Auf diesem Feld“ alle Einheiten und die Stadt zum direkten Umschalten, das Stadt-Panel die Garnison.
- **Nächste Einheit:** Springt zur nächsten offenen Einheit hinter der zuletzt gewählten, am Ende von vorn. Tastenkürzel N oder Leertaste (nicht in Dialogen und Eingabefeldern), Esc geht einen Schritt zurück.
- **Kampfsequenz:** Nach der Serverantwort fährt die Einheit als Ghost heran, Mündungsblitz, je Kampfrunde eine Explosion auf dem Ziel (höchstens vier), der Verlierer verblasst, der Sieger rückt nach, dann der Toast; der neue Spielstand wird solange zurückgehalten und das Spielfeld gesperrt (1,2 s; „Animationen reduzieren“ 0,3 s; „Kampfanimationen“ aus: nur Toast).
- **Produktionsübersicht:** Im Bauauftrag-Wähler steht je Typ „Bestand N · N im Bau (hier, Stadt …)“, darüber „Reichsweit N Einheiten · N im Bau“.

## Kartengrößen

Stand nach Playtest Runde 2 (`agent-os/specs/2026-11-01-1707-kartengroessen/`):

- **Stufen:** Klein 20×20, Mittel 40×40, Groß 75×75, Riesig 130×130, Imperium 200×200 Felder (`packages/shared/src/game/mapSizes.ts`, eine Quelle für Setup, Server, Lobby und DevBar). Rundenlimit 50 bis 500 oder „Ohne Limit“ (nur mit anderer Siegbedingung), Vorgabe je Stufe; der Assistent zieht sie beim Stufenwechsel nach, solange man das Limit nicht selbst geändert hat. Neutrale Städte wachsen mit der Landfläche (45 / 30 / 20 Landfelder je Stadt), Namen ab der 41. Stadt werden aus Vorsilbe und Grundwort erzeugt. Laufende Partien behalten ihre Maße; passt keine Stufe, zeigt die Lobby „Breite×Höhe“.
- **Weltform** (`agent-os/specs/2026-11-01-1830-inselwelt/`): Kontinent (Rauschfeld wie bisher), Inseln (jede Hauptstadt auf einer eigenen Küsteninsel, neutrale Inseln dazwischen) oder Archipel (viele kleine Inseln). Inseln entstehen aus Kuppeln um gesetzte Zentren; ein Wasserband entlang der Voronoi-Grenzen der Heimatzentren trennt die Sitze garantiert, der Landanteil-Regler steuert die Inselgröße (ab etwa 50 % wachsen die Inseln zusammen). Kartencodes mit Kontinent ergeben dieselbe Welt wie vorher. `pnpm sim maps --shape islands` vermisst Welten (Trennung, Küste, Heimatgrößen, Städte, Laufzeit).
- **Datenformat:** Der Spielstand hält das Gelände als Zeichenkette (ein Zeichen je Feld, Codes wie in den Engine-Tests: `~` Tiefsee, `s` Flachwasser, `.` Ebene, `f` Wald, `h` Hügel, `m` Gebirge) und die Erkundung je Teilnehmer als Base64-Bitset (`game/bits.ts`); die Sicht geht als `terrain` plus `visibility` (`u`/`e`/`v`) über die Leitung (`game/mapcodec.ts`, `expandMap` für Feldobjekte). Alte Spielstände werden in `normalizeState` umgerechnet. Der Server komprimiert Antworten (`@fastify/compress`). Log und Ereignisse werden am Rundenende auf das gekürzt, was noch jemand sehen kann.
- **Leistung:** Sicht und Index ohne Feldobjekte, Küstenprüfung über Nachbarn, Wegsuche als BFS über Indizes mit Budget (`PathBudget`), KI mit deterministischem Arbeitsbudget (60.000 Einheiten je Zug, 3.000 Knoten je Suche) und Wanduhr-Ventil von 10 s, das nur der Server setzt (`AI_TURN_BUDGET_MS`). Imperium: Generierung unter zwei Sekunden, Spielstand ≈ 300 KB, Sicht ≈ 80 KB unkomprimiert.
- **Darstellung:** Gelände und Nebel zeichnet `TerrainCanvas` als gekachelte Bitmaps je Zoomstufe (nur geänderte Felder werden neu gezeichnet), SVG bleibt für Overlays im Sichtbereich, die Minikarte ist ein Canvas. Die Kamera liegt in einem Store außerhalb des React-States mit Pan-Clamping; Mindestzoom bis zum Einpassen der ganzen Karte, Knopf „Karte einpassen“, Tasten `+`/`−`, Pfeile (Shift schneller) und `f`.

## Spielabschluss

Ist eine Partie entschieden (`view.result`), legt sich die Ergebniskarte über die Karte: Stempel „Sieg“, „Niederlage“ oder „Aufgegeben“, Rangliste nach Platzierung mit Städten, Einheiten und Punkten (3 je Stadt, 1 je Einheit), ausgeschiedene Teilnehmer gedämpft. „Karte ansehen“ schließt die Karte, eine Pille „Beendet · Sieg“ mit „Ergebnis“ öffnet sie wieder, „Zur Lobby“ verlässt die Partie. Die Kopfzeile zeigt „Beendet · …“, die Aktionsleiste bleibt gesperrt („Partie beendet“), das Polling endet. Beim erneuten Öffnen einer beendeten Partie erscheint die Karte wieder; Sieges- und Niederlagenmusik spielt nur einmal je Sitzung. Logik in `packages/shared` (`matchOutcome`, `participantScore`), Karte in `sections/spielfeld/components/Partieabschluss.tsx` (`agent-os/specs/2026-10-31-1945-spielabschluss/`).

## Rundenbericht

Stand nach Playtest Runde 1 (`agent-os/specs/2026-10-31-1026-rundenbericht/`):

- **Karte zu Zugbeginn:** Sobald der eigene Zug beginnt, erscheint eine Berichtskarte mit den Abschnitten Verluste, Städte, Gefechte, Entdeckt, Gegnerbewegungen und Eigenes Reich (leere Abschnitte entfallen). Ein Klick auf einen Eintrag zentriert die Karte und markiert das Ereignis als gelesen. In ruhigen Runden ohne Ereignisse und Bewegungen bleibt die Karte aus.
- **Vor der Wiedergabe:** Steht eine Wiedergabe der Gegnerzüge an, hält der Bericht sie an: „Gegnerzüge ansehen“ startet sie, „Überspringen“ schließt beides. Ist „Gegnerzüge automatisch abspielen“ aus, zeigt die Karte nur „Weiter“. Im eigenen Zug schließt „Weiter“, Esc ebenso.
- **Einmal pro Zug:** Der Browser merkt sich je Partie Runde und Spieler; ein Reload zeigt den Bericht nicht erneut. Über „Rundenbericht anzeigen“ im Ereignisprotokoll lässt er sich jederzeit wieder öffnen.
- **Einstellung:** „Rundenbericht zu Zugbeginn“ unter Darstellung (Standard an).
- **Neue Ereignisse der Engine:** Jeder Teilnehmer merkt sich am Zugende, welche Städte er mit welchem Besitzer kennt und welche fremden Einheiten er sieht (`seenAtTurnEnd`). Zu Beginn des nächsten Zuges, nach den stehenden Befehlen, meldet die Engine Feindeinheiten, die neu im Sichtbereich stehen („Feindliche Panzerwagen (Admiral Kessler) bei 5,7 gesichtet.“, eine Meldung je Feld), sowie Städte, die erstmals gesehen wurden oder den Besitzer gewechselt haben (`cityDiscovered`). Meldungen der Wache oder eines blockierten Marsches werden nicht wiederholt; eigene verlorene Städte stehen weiter nur als Verlust im Protokoll.

## Flugzeuge: Erkunden und Treibstoff

Stand nach Playtest Runde 1 (`agent-os/specs/2026-10-31-1225-flugzeuge-erkunden/`):

- **Erkunden:** Befehl nur für Flugzeuge. Das Flugzeug fliegt sofort und dann jede Runde zum nächsten Nebelrand, den es mit sicherem Rückweg erreicht, und lichtet den Kriegsnebel. Reicht der Treibstoff nur noch für den Heimweg, fliegt es zur nächsten Basis (eigene Stadt oder eigener Träger), tankt dort und erkundet weiter. Sobald eine Feindeinheit oder eine bisher unbekannte fremde Stadt in Sicht kommt, bleibt es stehen, der Befehl endet und das Flugzeug braucht wieder Befehle (Ereignis „Erkundung: … entdeckt“). Ist auch mit vollem Tank kein Nebel mehr erreichbar, endet der Befehl mit „Erkundung abgeschlossen“.
- **Rote Felder:** Bei einem gewählten Flugzeug sind alle Felder der Reichweite rot schraffiert, von denen aus der Resttreibstoff nicht mehr bis zur nächsten Basis reicht (Luftlinie).
- **Kein Rückweg:** Ein Zug oder Marschbefehl auf ein solches Feld öffnet die Nachfrage „Kein Rückweg“ mit Resttreibstoff und Entfernung zur Basis. „Trotzdem fliegen“ führt den Befehl aus, „Abbrechen“ oder Esc lässt das Flugzeug stehen.
- **Zugende:** Der Dialog „Zug beenden?“ warnt zusätzlich vor Flugzeugen, die mit ihrem Treibstoff keine Basis mehr erreichen; „Zu den Einheiten“ springt zum ersten davon.
- **Zur Basis:** Button im Einheiten-Panel, schickt das Flugzeug zur nächsten erreichbaren Basis (Zug oder Marschbefehl, mit derselben Prüfung).

## Lobby & Mehrspieler ausprobieren

Die Lobby (`/`) zeigt eigene Partien, Einladungen, offene und beendete Partien; sie fragt alle 15 Sekunden neu nach, der Warteraum alle 4 Sekunden. Zwei Konten gleichzeitig: ein normales und ein privates Fenster (oder zwei Browserprofile), z. B. Björn und Lena.

1. Björn legt unter „Neue Partie“ eine Partie an und lädt im Schritt „Mitspieler“ Lena Hartmann ein (oder teilt den Einladungslink `/einladung/<code>`; wer ihn öffnet, besetzt einen freien Platz).
2. Lena nimmt die Einladung in ihrer Lobby an, landet im Warteraum und meldet sich bereit.
3. Björn startet; freie Plätze füllt auf Wunsch die KI. Nach Björns Zug ist Lena am Zug (Lobby-Badge, Push, E-Mail).
4. „Erinnern“ (asynchrone Partien, 12 Stunden Sperre), „Aufgeben“ im Karten-Menü oder im Spielmenü (eine KI übernimmt).

Abgelaufene Zugfristen beendet der Server selbst (Prüfung alle 15 Sekunden), ebenso „Frist läuft bald ab“ (weniger als 3 Stunden).

**E-Mails:** Der Server verschickt über `SMTP_URL`; `docker compose` startet dafür [Mailpit](http://localhost:8025) (SMTP auf Port 1025), wo alle Mails landen. Lokal (`pnpm dev`) steht `SMTP_URL=smtp://localhost:1025` in `apps/server/.env.example`. E-Mails gehen nur an Spieler, die offline sind (keine Anfrage seit 2 Minuten) und mindestens ihre E-Mail-Verzögerung (Vorgabe 1 Stunde) abwesend waren. Zum schnellen Testen, z. B. für Lena:

```sql
update players set settings = '{"notifications":{"emailDelayHours":0}}', last_seen_at = now() - interval '1 hour' where email = 'lena@dominion.test';
```

**Push:** „Aktivieren“ im Banner der Lobby fragt die Browser-Berechtigung an und registriert den Service Worker `public/sw.js`. Die VAPID-Schlüssel erzeugt der Server beim ersten Bedarf und speichert sie in der Datenbank (oder `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`). Push funktioniert nur über `localhost` oder https.

## Profil & Einstellungen

Über das Benutzermenü der Shell: `/profil` (Bilanz, Statistik je Fraktion, Partieverlauf aus den beendeten und aufgegebenen Partien, Anzeigename und Avatar) und `/einstellungen` (Benachrichtigungen, Darstellung, Ton, Steuerung, Konto).

- **Avatare:** PNG, JPEG, WebP oder GIF bis 2 MB. Der Server speichert sie in `UPLOADS_DIR` (lokal Vorgabe `apps/server/uploads/`, nicht im Repo) und liefert sie unter `/uploads/avatars/<datei>` aus; jeder Upload bekommt einen neuen Dateinamen, die alte Datei wird gelöscht. Im Docker-Setup liegen sie im benannten Volume `dos-uploads` (`/app/uploads`), überleben also Neubauten; `docker compose down -v` löscht sie mit der Datenbank.
- **Einstellungen** stehen in `players.settings` und werden sofort (entprellt) gespeichert. Angewendet werden Farbschema (der Serverwert gilt nach der Anmeldung auf jedem Gerät), „Animationen reduzieren“ (auch kurze Kampfsequenz), „Kampfanimationen“ (Kampfsequenz an/aus), „Gegnerzüge automatisch abspielen“, „Rechte Maustaste“ und „Zoom-Empfindlichkeit“ (Mausrad). „Einheiten ziehen“, „Nachfrage beim Zugende“ und die Ton-Regler werden gespeichert, wirken aber erst mit Anpassungen der Spielfeld-Komponenten bzw. sobald es Ton gibt (Details: `agent-os/specs/2026-10-30-2128-profil-und-einstellungen/shape.md`). Benachrichtigungen liest der Server bei jedem Versand.
- **E-Mail ändern** schickt einen Bestätigungslink (24 Stunden gültig) an die neue Adresse, im Docker-Setup zu Mailpit; erst der Link ändert die Adresse. **Passwort ändern** meldet alle anderen Geräte ab, das aktuelle bleibt angemeldet.
- **Konto löschen:** Laufende Partien übernimmt eine KI (Normal), Warteräume werden verlassen bzw. aufgelöst, danach sind Konto, Sitzungen, Freundschaften, Einladungen, Push-Abos und Avatar weg. Die Dev-Konten legt der Server beim nächsten Start wieder an.

## Ton

Musik, Umgebungsgeräusche und Effekte aus `public/audio/` spielt eine eigene kleine Engine auf der Web Audio API (`apps/web/src/audio/`, keine Bibliothek). Vier Busse (Gesamt, Musik, Effekte, Umgebung) folgen den Reglern in den Einstellungen; der Lautsprecher in der Kopfzeile schaltet stumm und speichert das. Der Browser gibt Audio erst nach einer Interaktion frei; die Engine lebt über dem Router, deshalb zählt schon die Eingabe auf der Anmeldeseite, und die Musik startet direkt nach der Anmeldung. Anmeldeseiten bleiben still, ebenso Tabs im Hintergrund; Abmelden blendet alles aus.

- **Menümusik** nach Route: `menu-lobby` in Lobby, Kompendium, Profil und Einstellungen, `menu-setup` in Partie-Setup, Warteraum und Einladung.
- **Spielfeld:** Die drei Schichten `field-explore`, `field-tension` und `field-combat` laufen synchron und werden auf der nächsten Taktgrenze über zwei Takte überblendet (Zustandsautomat in `audio/fieldMusic.ts`: Anspannung bei Feind in Sicht oder bedrohter Stadt, Kampf bei Angriff oder Gegnerzug mit Angriffen, Rückfall nach einer bzw. zwei Runden). Das Fraktionsthema begrüßt einmal beim ersten Öffnen einer Partie, Sieg und Niederlage beenden die Musik. Alle Spielfeld-Effekte werden beim Betreten der Partie vorgeladen; ein noch ladender Effekt wird nachgeholt, wenn die Datei innerhalb von 1,5 s eintrifft. Es spielt immer höchstens ein Musikstück: Startet Menümusik oder wird die Partie verlassen, blendet ein laufendes Stück aus; Abmelden baut die Engine ab.
- **Umgebung:** Mischung aus den Geländeanteilen im sichtbaren Kartenausschnitt (`audio/ambience.ts`), lauter beim Hineinzoomen, Nebel am Rand.
- **Effekte:** Das Spielfeld meldet Cues (`onCue`: Auswahl, Zug, Angriff, Treffer, Zugende, Wiedergabe, Ereignisse), `pages/useMatchAudio.ts` übersetzt sie in Sounds. Klicks, Schalter und Dialoge erkennt `SignedInAudio` (in `RequireAuth`) zentral per Event-Delegation; die Komponenten der Design-Übergabe bleiben tonlos. Alles Spielerabhängige (Einstellungen, Menümusik, Oberflächen-Töne) sitzt bewusst dort und nicht im `AudioProvider` über dem Router: An- und Abmelden leeren den Query-Cache, und Abonnements aus der Zeit davor bekommen keine Daten mehr. Benachrichtigungstöne kommen aus dem Lobby-Polling (neue Einladung, neuer eigener Zug, knappe Frist); ein Push-Ton ist im Browser nicht möglich.
- **Tests** laufen mit einer Aufzeichnungs-Attrappe (`audio/fakeEngine.ts`), jsdom hat keinen `AudioContext`; `audio/ids.test.ts` prüft die IDs gegen `manifest.json`.

## Rechtliches & Auftritt

Impressum (`/impressum`), Datenschutzerklärung (`/datenschutz`) und Lizenzen (`/lizenzen`) sind ohne Anmeldung erreichbar (`apps/web/src/pages/rechtliches/`). Links stehen unter jeder Anmeldekarte, in der Fußzeile der Menüseiten und im Benutzermenü („Rechtliches“). Die Anbieterdaten (Name, Anschrift, E-Mail) stehen nicht im Repository: `pages/rechtliches/anbieter.ts` liest sie aus `VITE_ANBIETER_*`, beim Deploy aus den Repository-Variablen `ANBIETER_*`, lokal aus `apps/web/.env.local` (siehe `deploy/README.md` §5). Ohne Werte erscheinen Platzhalter, im Dev-Modus warnt das Impressum. Die Lizenzseite liest `LICENSE` und `public/audio/credits.json` direkt ein.

Lesezeichen-Icons: `public/icon.svg` ist die Quelle, `node scripts/icons.mjs` rendert daraus `favicon.ico`, `apple-touch-icon.png` und die Manifest-Icons (braucht Playwright im npx-Cache und Google Chrome). `public/manifest.webmanifest` macht das Spiel auf dem Homescreen installierbar. Die Schriften kommen als `@fontsource`-Pakete aus dem Bundle, der Browser lädt nichts von Dritten.

## KI-Simulation

`packages/sim` spielt Partien KI gegen KI ohne Server und Datenbank, parallel in Worker-Threads, und schreibt Kennzahlen (Siegquoten mit Wilson-Intervall, Eroberungen, Kämpfe, Produktion, Zugdauer, Verlauf) als Rohdaten nach `packages/sim/results/` (gitignoriert) und als Markdown-Bericht nach `agent-os/product/ki-simulation/`.

```bash
pnpm sim --config packages/sim/configs/smoke.json          # 4 kurze Partien
pnpm sim --config packages/sim/configs/stufen.json         # Serie A: hard, normal, easy gegeneinander
pnpm sim sweep --config packages/sim/configs/sweep-normal.json   # Raster über Profilparameter
pnpm sim bench                                             # Laufzeit je Runde und KI-Zug, Spielstandsgröße
pnpm sim --help
```

Konfigurationen sind JSON (`matchups` mit Label, Fraktion, Stufe, Persönlichkeit, optionalem Profil-Override; `maps`, `seeds`, `rotateSeats`, `roundLimit`, `sweep`). Befunde und abgeleitete Maßnahmen: `agent-os/product/ki-balance.md`.

## Betrieb

Produktion läuft unter `https://dominion.huhn73.de` auf einem netcup-VPS mit Docker: Caddy (https über Let's Encrypt) vor der App aus `ghcr.io/huhn73/dominion-of-steam`, Postgres und Uploads in Volumes, tägliche Dumps, E-Mail über Mailjet. Jeder Push auf `main` läuft durch `.github/workflows/deploy.yml` (Tests, Image, SSH-Deploy). Einrichtung, Variablen, Backups und Rollback: `deploy/README.md`.

Ohne `DEV_TOOLS=true` (Produktion) legt der Server weder Dev-Konten noch die Demo-Partie an und die Dev-Endpunkte fehlen; das lokale `docker compose` baut das Image mit `DEV_TOOLS=true`. Hinter dem Reverse-Proxy sorgt `TRUST_PROXY=true` dafür, dass das Sitzungs-Cookie `Secure` bekommt.

## Nächste Schritte

Mission, Roadmap und Tech-Stack stehen in `agent-os/product/`, die Specs der Meilensteine in `agent-os/specs/`.

Alle Meilensteine der Design-Übergabe (Phase 1) sind umgesetzt: 01 (Shell), 02a (Spielfeld, Regel-Engine, Server, Spielstände), 02b (KI, Kartengenerator), 03 (Kompendium Fraktionen & Einheiten), Konten & Anmeldung, 04 (Partie-Setup & KI-Gegner), 05 (Lobby & Multiplayer), 06 (Spielerprofil & Einstellungen). Bekannte Lücken und Kandidaten für Phase 2 stehen in `agent-os/product/roadmap.md`.
