# Spec: Konten, Teil 2 – E-Mail-Bestätigung, Passwort vergessen, Hinweis-Mails, Rate-Limiting

## Context

Das Deployment steht (Spec `2026-10-31-1320-deployment`, Mailjet verschickt mit SPF/DKIM/DMARC PASS). Während der netcup-Server auf sich warten lässt, kommt der Roadmap-Punkt „Konten“ aus Phase 2 dran. Shaping-Entscheidungen mit dem Nutzer:

- **E-Mail-Bestätigung weich:** Konto sofort nutzbar. Bis zur Bestätigung gehen keine E-Mail-Benachrichtigungen raus, Lobby und Einstellungen zeigen einen Hinweis mit „Erneut senden“.
- **Passwort vergessen:** Link geht auch an unbestätigte Adressen; wer ihn nutzt, bestätigt die Adresse damit.
- **Hinweis-Mail an die alte Adresse**, wenn eine E-Mail-Änderung wirksam wird. Dazu (klein, gleiche Vorlage) eine Hinweis-Mail bei Passwortänderung.
- **Rate-Limiting** je IP für Anmeldung, Registrierung, Passwort-vergessen, Mailversand und Konto-Aktionen; dazu ein Abstand von 2 Minuten je Konto zwischen zwei Bestätigungs-/Reset-Mails (schützt das Mailjet-Kontingent von 200 Mails am Tag).
- **Konto löschen** existiert bereits (`DELETE /api/account`, Gefahrenzone in den Einstellungen, laufende Partien an KI). Was fehlt: Bestätigung mit dem aktuellen Passwort.
- **Nicht in dieser Spec:** Moderation von Anzeigenamen (vom Nutzer abgewählt), 2FA, Anmeldung über Dritte.

Vorhandenes, auf dem alles aufbaut (aus der Erkundung):

- E-Mail-Änderung mit Bestätigungslink: `requestEmailChange`/`confirmEmailChange` in `apps/server/src/profile/service.ts:380-445`, Tabelle `email_changes` (`db/schema.ts:293`), Token = 32 Byte base64url, gespeichert als SHA-256 (`hashToken`, Kopien in `auth/accounts.ts:27` und `profile/service.ts`), Route `GET /api/account/email/confirm?token=` mit 303 auf `/einstellungen?email=bestaetigt|ungueltig|vergeben` (`routes/profile.ts:135`), Toasts in `pages/profil/SettingsPage.tsx:17`.
- Mail: `Mailer`/`MailMessage` in `notifications/channels.ts:15-22`, gestaltete Vorlage `mailFor` in `notifications/service.ts:70` (fester Button „Zur Partie“), Mailer-Stub in Tests über `buildApp({ notifications: { mail: async (m) => mails.push(m) } })` (`profile.test.ts:145`).
- Auth-Routen `routes/auth.ts` (`register` loggt sofort ein, kein Mailversand), Service `auth/accounts.ts` (`register`, `login`, `createSession`, `deleteAllSessions`, `deleteExpiredSessions`), Cookie in `session.ts`.
- Web: `pages/anmeldung/AuthLayout.tsx` (`AuthLayout`, `Field`, `FormError`, `SubmitButton`, `linkClass`), `LoginPage` mit `location.state.notice`, `data/session.ts` (`useAuthActions`, `meKey`), `data/api.ts` (`ApiRequestError`), `routes.ts`, `router.tsx` (öffentlich nur `/anmelden`, `/registrieren`), `useToast` in `pages/shared/toast.tsx`, Konto-Abschnitt in `sections/profil/components/Einstellungen.tsx:278-316` mit `Sheet`/`SettingRow`.
- Origin für Links: `requestOrigin(req)` in `routes/setup.ts:12` (berücksichtigt `PUBLIC_URL`).
- Hintergrund: `lobby/sweeper.ts` (`sweep` alle 15 s), `deleteExpiredSessions` läuft nur beim Start (`index.ts:20`).
- Kein Rate-Limiting, `req.ip` ungenutzt, `trustProxy` seit dem Deployment vorhanden.

## Task 1: Spec-Dokumentation

`agent-os/specs/2026-10-31-HHMM-konten-bestaetigung/`: `plan.md` (dieser Plan), `shape.md` (Entscheidungen oben, Mailtexte, Limits), `standards.md`, `references.md` (Stellen aus „Vorhandenes“). `visuals/`: Screenshots nach der Umsetzung (`umsetzung-passwort-vergessen.png`, `umsetzung-hinweis-lobby.png`, `umsetzung-mail.png` aus Mailpit).

## Task 2: Gemeinsame Regeln (`packages/shared/src/account/index.ts`)

- `Me` um `emailVerified: boolean`.
- `validatePassword(password): string | null` aus `validateRegistration` herausziehen (gleiche Texte), dort und in `profile/service.ts changePassword` (bisher eigene Texte) wiederverwenden.
- Konstanten `EMAIL_VERIFY_TTL_HOURS = 24`, `PASSWORD_RESET_TTL_MINUTES = 60`, `ACCOUNT_MAIL_COOLDOWN_MINUTES = 2`.
- Typen `ForgotPasswordRequest { email }`, `ResetPasswordRequest { token; password }`.
- `packages/shared/src/profile/types.ts` `Account` um `emailVerified: boolean`; `EMAIL_CHANGE_TTL_HOURS` bleibt.

## Task 3: Datenbank (`apps/server/src/db/schema.ts`, Migration `0005_konten_bestaetigung.sql`)

- `players.emailVerifiedAt timestamp null`. Migration setzt `email_verified_at = now()` für alle bestehenden Spieler (Dev-Konten, bisherige Tester; die Produktions-DB ist noch leer).
- Neue Tabelle `account_tokens` ersetzt `email_changes`: `id` (SHA-256 des Tokens, PK), `player_id` (FK cascade), `purpose` (`'verify_email' | 'reset_password' | 'change_email'`), `email` (Ziel bei `change_email`, sonst die Adresse, für die der Link galt), `created_at`, `expires_at`; Unique-Index `(player_id, purpose)`, ein offener Token je Zweck. Migration: Tabelle anlegen, Zeilen aus `email_changes` mit `purpose = 'change_email'` kopieren, `email_changes` löschen.
- `pnpm --filter @dos/server db:generate`, danach die Backfill- und Kopier-Statements von Hand in die SQL-Datei ergänzen (Snapshot bleibt vom Generator).

## Task 4: Server, Token- und Mail-Bausteine

- `apps/server/src/auth/tokens.ts` (neu): `hashToken` (einzige Kopie, aus `accounts.ts` und `profile/service.ts` hierher), `issueToken(db, { playerId, purpose, email, ttlMs, now })` → Upsert auf `(player_id, purpose)`, gibt den Klartext zurück; `consumeToken(db, raw, purpose, now)` → Zeile oder `null`, löscht sie sofort (einmal nutzbar, wie bisher); `recentlyIssued(db, playerId, purpose, withinMs, now)` für den 2-Minuten-Abstand; `deleteExpiredTokens(db, now)`.
- `apps/server/src/notifications/mail.ts` (neu): `escapeHtml` (ersetzt die zwei Kopien) und `renderMail({ title, name, body, cta?: { label, url }, footer? })` als Verallgemeinerung von `mailFor`; `mailFor` ruft `renderMail` mit `cta.label = 'Zur Partie'` und dem bisherigen Footer. Account-Mails nutzen den Footer „Diese E-Mail hast du bekommen, weil für diese Adresse ein Konto bei Dominion of Steam besteht.“
- `apps/server/src/auth/accountMails.ts` (neu), alle Funktionen `(mail: Mailer, origin, player, …)`:
  - `sendVerification(token)`: Betreff „Willkommen bei Dominion of Steam: E-Mail-Adresse bestätigen“, Button „E-Mail-Adresse bestätigen“ auf `${origin}/api/account/verify?token=`, Hinweis auf 24 Stunden.
  - `sendPasswordReset(token)`: Betreff „Neues Passwort für Dominion of Steam“, Button „Neues Passwort festlegen“ auf `${origin}/passwort-zuruecksetzen?token=`, 60 Minuten, „Wenn du das nicht warst, ignoriere diese E-Mail; dein Passwort bleibt unverändert.“
  - `sendEmailChanged(oldAddress, newAddress)`: an die alte Adresse, Betreff „Deine E-Mail-Adresse wurde geändert“, Text nennt die neue Adresse, Button „Passwort zurücksetzen“ auf `${origin}/passwort-vergessen`, „Wenn du das nicht warst, setze sofort dein Passwort zurück und melde dich bei uns unter postmaster@huhn73.de“ (Adresse aus `MAIL_FROM`-Domain ableiten ist Overkill; Konstante `SUPPORT_EMAIL` mit Env `SUPPORT_EMAIL`, Vorgabe aus `MAIL_FROM`-Absender).
  - `sendPasswordChanged()`: Betreff „Dein Passwort wurde geändert“, gleicher „Wenn du das nicht warst“-Block.
  - Hinweis-Mails sind best effort: Fehler werden geloggt, die Aktion schlägt nicht fehl.

## Task 5: Server, Abläufe

**Registrierung und Bestätigung**

- `accounts.register` nimmt `emailVerifiedAt?` entgegen; `ensureDevAccounts` legt Dev-Konten bestätigt an. `toMe` liefert `emailVerified: !!p.emailVerifiedAt`.
- `routes/auth.ts register`: nach `createSession` bei vorhandenem Mailer `issueToken(verify_email)` und `sendVerification`; ohne Mailer nichts (lokal ohne Mailpit bleibt das Konto unbestätigt, Dev-Konten sind bestätigt).
- `GET /api/account/verify?token=` (ohne Login, in `routes/profile.ts` neben `email/confirm`): `consumeToken(verify_email)`; gültig und `token.email === player.email` → `emailVerifiedAt = now`, 303 auf `/einstellungen?email=verifiziert`; sonst `?email=ungueltig`.
- `POST /api/account/verify/resend` (Login): bereits bestätigt → 200 `{ ok: true, alreadyVerified: true }`; `recentlyIssued` innerhalb 2 Minuten → 429 `RESEND_COOLDOWN` „Wir haben dir gerade erst eine E-Mail geschickt. Warte kurz und sieh auch im Spam-Ordner nach.“; kein Mailer → 503 `MAIL_UNAVAILABLE` (Text existiert); sonst neuer Token und Mail.
- `confirmEmailChange` (Zweck `change_email`): setzt zusätzlich `emailVerifiedAt = now`, schickt danach `sendEmailChanged` an die alte Adresse.
- `getSettings` liefert `account.emailVerified`.
- `notifications/service.ts deliverEmail`: `if (!p.emailVerifiedAt)` → `emailStatus: 'cancelled'` (vor der Einstellungsprüfung). Push bleibt unberührt.

**Passwort vergessen**

- `POST /api/auth/forgot { email }` (ohne Login): `validateEmail` → 422; danach immer 200 `{ ok: true }`, auch bei unbekannter Adresse (keine Auskunft, ob ein Konto existiert). Intern: Spieler per `findByEmail`; `recentlyIssued(reset_password, 2 min)` → still überspringen; sonst `issueToken(reset_password, 60 min, email = player.email)` und `sendPasswordReset`. Ohne Mailer 503 `MAIL_UNAVAILABLE` (ehrlich, der Nutzer kann sonst nichts tun).
- `POST /api/auth/reset { token, password }`: `validatePassword` → 422 `INVALID_INPUT`; `consumeToken(reset_password)` leer oder abgelaufen → 422 `INVALID_TOKEN` „Der Link ist ungültig oder abgelaufen. Fordere einen neuen an.“; sonst in einer Transaktion `passwordHash` setzen, `emailVerifiedAt ??= now` (nur wenn `token.email === player.email`), alle Sitzungen löschen, dann neue Sitzung + Cookie, 200 `toMe` (direkt angemeldet). Danach `sendPasswordChanged`.
- `accounts.ts`: neue Funktionen `setPassword(playerId, hash)`, `markEmailVerified(playerId, now)`; `changePassword` in `profile/service.ts` nutzt `validatePassword` und schickt `sendPasswordChanged`.

**Konto löschen mit Passwort**

- `DELETE /api/account` erwartet Body `{ currentPassword }`; `deleteAccount(me, currentPassword)` prüft mit `checkPassword` → 403 `WRONG_PASSWORD` (Text existiert). Alles Weitere unverändert.

**Rate-Limiting**

- Abhängigkeit `@fastify/rate-limit`. In `buildApp` Option `rateLimit?: boolean` (Vorgabe `process.env.NODE_ENV !== 'test'`); registriert mit `global: false`, Speicher im Prozess (eine Instanz, reicht), Schlüssel `req.ip` (hinter Caddy dank `trustProxy` die Client-IP), `errorResponseBuilder` → 429 `{ error: { code: 'RATE_LIMITED', message: 'Zu viele Versuche. Bitte warte {n} Minuten.' } }` passend zu `ApiError`, Header `Retry-After` bleibt.
- Je Route `config: { rateLimit: { max, timeWindow } }`: `login` 20 / 15 min, `register` 5 / h, `forgot` 5 / h, `reset` 10 / h, `verify/resend` 5 / h, `account/email` und `account/password` 10 / h, `DELETE /api/account` 5 / h. Die Zahlen in `shape.md` festhalten, nach dem ersten öffentlichen Playtest prüfen.
- `data/api.ts` kennt `RATE_LIMITED` nicht gesondert; die Meldung kommt wie andere Fehler über `FormError`/Toast.

**Aufräumen**

- `createSweeper(db, notifier, { housekeeping })`: alle 60 Minuten `deleteExpiredTokens` und `deleteExpiredSessions` (letzte Ausführung im Sweeper gemerkt). `index.ts` übergibt beide; der Startaufruf von `deleteExpiredSessions` bleibt.

## Task 6: Web

**Routen und Datenzugriff**

- `routes.ts`: `forgotPassword: '/passwort-vergessen'`, `resetPassword: '/passwort-zuruecksetzen'`; beide öffentlich in `router.tsx` neben Login und Registrierung.
- `data/session.ts useAuthActions`: `forgotPassword(email)`, `resetPassword(token, password)` (setzt `meKey` wie `login`).
- `data/profile.ts useAccountActions`: `resendVerification()`, `deleteAccount(currentPassword)`.

**Seiten in `pages/anmeldung/`** (bestehende Bausteine aus `AuthLayout.tsx`)

- `LoginPage`: unter dem Passwortfeld Link „Passwort vergessen?“ (`linkClass`) auf `/passwort-vergessen`, E-Mail als `state.email` mitgeben.
- `ForgotPasswordPage`: Titel „Passwort vergessen“, ein Feld E-Mail (vorbelegt aus `state.email`), Button „Link anfordern“ / „Schicke Link …“. Nach Erfolg statt des Formulars ein teal `role="status"`-Kasten: „Wenn zu {email} ein Konto gehört, haben wir dir gerade einen Link geschickt. Er ist 60 Minuten gültig. Sieh auch im Spam-Ordner nach.“ Footer „Zurück zur Anmeldung“. 503 und 429 über `FormError`.
- `ResetPasswordPage`: liest `?token=`; ohne Token sofort `FormError` „Der Link ist unvollständig. Fordere einen neuen an.“ mit Link. Felder „Neues Passwort“ und „Passwort wiederholen“ (Hinweis „Mindestens 8 Zeichen.“, Abgleich wie im Passwort-Dialog), Button „Passwort speichern“. Erfolg → `navigate(routes.lobby, { state: { notice: 'Passwort geändert. Du bist angemeldet, andere Geräte wurden abgemeldet.' } })`; `INVALID_TOKEN` → `FormError` mit Link „Neuen Link anfordern“.
- `LobbyPage`: `location.state.notice` einmal als `toast.info` zeigen (wie `LoginPage` es für Notices tut), danach `navigate(…, { replace: true, state: null })`.

**Hinweis auf unbestätigte Adresse**

- `pages/shared/EmailVerifyNotice.tsx` (neu): amber Kasten mit Mail-Icon, Text „Bitte bestätige deine E-Mail-Adresse {email}. Bis dahin bekommst du keine E-Mails von uns.“, Buttons „Erneut senden“ (ruft `resendVerification`, Toast „Wir haben dir eine neue Bestätigungsmail geschickt.“ bzw. Fehlertext) und „Adresse ändern“ (Link zu `/einstellungen`). Sichtbar, wenn `me.emailVerified === false`. Eingebunden in `LobbyPage` oberhalb von `<Lobby>` (die Lobby-Komponente selbst bleibt unverändert, sie stammt aus der Design-Übergabe).
- `Einstellungen.tsx` Konto-Abschnitt: Zeile „E-Mail-Adresse“ zeigt den Status als kleines Badge „bestätigt“ (teal) oder „nicht bestätigt“ (amber) und bei unbestätigt einen zweiten Button „Bestätigung senden“; Props `emailVerified`, `onResendVerification` in `sections/profil/types.ts EinstellungenProps`. `SettingsPage` reicht beides durch und ergänzt `EMAIL_RESULT.verifiziert = 'Deine E-Mail-Adresse ist bestätigt.'`.
- Dialog „Endgültig löschen“ bekommt ein Passwortfeld (`TextInput type="password"`), Bestätigen erst mit Eingabe; `WRONG_PASSWORD` als Fehlertext im Dialog.
- `RegisterPage`: nach erfolgreicher Registrierung zeigt die Lobby den Hinweis-Kasten; zusätzlich Toast über `state.notice` „Konto angelegt. Wir haben dir eine Bestätigungsmail an {email} geschickt.“ (nur wenn `me.emailVerified === false`).

## Task 7: Tests

- `apps/server/src/auth/auth.test.ts` (Mailer-Stub wie in `profile.test.ts`): Registrierung verschickt Bestätigungsmail mit Link, `Me.emailVerified === false`; Verify-Link setzt `verifiziert`, zweiter Aufruf `ungueltig`; Resend mit Cooldown 429, danach (mit `now`-Manipulation über `createdAt` in der DB) neue Mail; Forgot bei unbekannter Adresse 200 ohne Mail; Forgot + Reset: Token aus `mails[].text`, neues Passwort meldet an, altes nicht mehr, andere Sitzung 401, Adresse gilt als bestätigt, zweite Nutzung `INVALID_TOKEN`, abgelaufen `INVALID_TOKEN`; Reset mit zu kurzem Passwort 422; Rate-Limit: `buildApp({ rateLimit: true })`, 21. Login-Versuch 429 mit `RATE_LIMITED` und `Retry-After`.
- `apps/server/src/profile/profile.test.ts`: bestehender E-Mail-Test erweitert um Hinweis-Mail an die alte Adresse und `emailVerified` nach Bestätigung; Passwortänderung verschickt Hinweis-Mail; `DELETE /api/account` ohne oder mit falschem Passwort 403, mit richtigem wie bisher.
- `apps/server/src/notifications/*.test.ts` (vorhandener Notifier-Test, sonst in `lobby.test.ts`): unbestätigter Spieler bekommt `emailStatus: 'cancelled'`.
- `apps/web/src/pages/anmeldung/Anmeldung.test.tsx`: Link „Passwort vergessen?“, Forgot-Seite zeigt Erfolgskasten und schickt `POST /auth/forgot`, Reset-Seite ohne Token zeigt Fehler, mit Token schickt `POST /auth/reset` und navigiert zur Lobby, `INVALID_TOKEN` zeigt Fehler mit Link.
- `apps/web/src/pages/lobby/Lobby.test.tsx`: Hinweis-Kasten bei `emailVerified: false`, „Erneut senden“ ruft `POST /account/verify/resend`; kein Kasten bei `true` (`testUser` in `test/mockApi.ts` bekommt `emailVerified: true` als Vorgabe).
- `apps/web/src/pages/profil/Profil.test.tsx`: Badge „nicht bestätigt“ und Button, Löschen-Dialog verlangt Passwort, `?email=verifiziert`-Toast.

## Task 8: Dokumentation

- `README.md` Abschnitt „Anmeldung“: Bestätigungsmail (lokal in Mailpit), Passwort vergessen, Hinweis-Mails, Rate-Limits, `SUPPORT_EMAIL`; Abschnitt „Betrieb“: `SUPPORT_EMAIL` in `deploy/.env.example` (`postmaster@huhn73.de`).
- `agent-os/product/roadmap.md`: Konten-Punkt in zwei Teile: umgesetzt (diese Spec) und offen (Moderation von Anzeigenamen).
- `apps/server/.env.example` und `deploy/.env.example`: `SUPPORT_EMAIL`.

## Verifikation

- `pnpm lint`, `pnpm typecheck`, `pnpm test` grün (Server-Tests mit `TEST_DATABASE_URL` gegen das lokale Docker-Postgres).
- Migration gegen die lokale Dev-DB: `pnpm --filter @dos/server db:migrate`, bestehende Spieler sind bestätigt, offene E-Mail-Änderung ist in `account_tokens` gewandert.
- Durchspielen mit `pnpm dev` und Mailpit (`docker compose up -d`): neues Konto registrieren → Hinweis-Kasten in der Lobby, Mail in Mailpit, Link klicken → Toast „bestätigt“, Kasten weg. Abmelden, „Passwort vergessen?“ → Mail, Link → neues Passwort → in der Lobby angemeldet, Toast. In den Einstellungen E-Mail ändern → Bestätigungsmail an neue und nach dem Klick Hinweis an alte Adresse in Mailpit. Passwort ändern → Hinweis-Mail. Konto löschen verlangt Passwort.
- Rate-Limit von Hand: 21 falsche Logins hintereinander per `curl` → 429 mit deutscher Meldung und `Retry-After`.
- Screenshots für `visuals/` wie in der Memory-Notiz (Playwright aus npx-Cache, System-Chrome).
