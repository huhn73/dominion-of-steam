# Referenzen für Konten, Teil 2

### Token-Verwaltung

- **Ort:** `apps/server/src/auth/tokens.ts` (`issueToken`, `consumeToken`, `recentlyIssued`, `deleteExpiredTokens`, `hashToken`), Tabelle `account_tokens` in `db/schema.ts`, Migrationen `0005_konten_tokens.sql` und `0006_email_changes_weg.sql`
- **Bezug:** Ein Mechanismus für Bestätigung, Passwort-Reset und E-Mail-Änderung; ersetzt `email_changes`.

### Konto-Service

- **Ort:** `apps/server/src/auth/accounts.ts` (`sendVerificationMail`, `resendVerification`, `verifyEmail`, `requestPasswordReset`, `resetPassword`), `auth/accountMails.ts` (Mailtexte), `routes/auth.ts` (`/auth/forgot`, `/auth/reset`), `routes/profile.ts` (`/account/verify`, `/account/verify/resend`, `DELETE /account` mit Passwort)
- **Bezug:** Abläufe und Fehlercodes (`INVALID_TOKEN`, `RESEND_COOLDOWN`, `MAIL_UNAVAILABLE`, `RATE_LIMITED`).

### E-Mail-Änderung (Vorbild)

- **Ort:** `apps/server/src/profile/service.ts` (`requestEmailChange`, `confirmEmailChange`, `changePassword`, `deleteAccount`)
- **Bezug:** Bestehender Link-Ablauf, jetzt auf `account_tokens`; Hinweis-Mails an alte Adresse und nach Passwortänderung.

### Mail-Vorlage und Zustellung

- **Ort:** `apps/server/src/notifications/mail.ts` (`renderMail`, `escapeHtml`), `notifications/service.ts` (`mailFor`, `deliverEmail` mit Prüfung auf `emailVerifiedAt`)
- **Bezug:** Einheitliches Aussehen aller Mails; keine Benachrichtigungen an unbestätigte Adressen.

### Rate-Limiting und Aufräumen

- **Ort:** `apps/server/src/app.ts` (Plugin im Routen-Scope, `errorResponseBuilder`, `setErrorHandler`), `lobby/sweeper.ts` (`housekeeping`)
- **Bezug:** Limits je Route über `config.rateLimit`; stündliches Löschen abgelaufener Tokens und Sitzungen.

### Web

- **Ort:** `apps/web/src/pages/anmeldung/ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `LoginPage.tsx` (Link), `RegisterPage.tsx` (Hinweis), `pages/shared/EmailVerifyNotice.tsx`, `pages/lobby/LobbyPage.tsx`, `pages/profil/SettingsPage.tsx`, `sections/profil/components/Einstellungen.tsx` (Badge, „Bestätigung senden“, Passwort im Löschdialog), `data/session.ts`, `data/profile.ts`, `routes.ts`, `router.tsx`
- **Bezug:** Bausteine aus `AuthLayout.tsx` (`Field`, `FormError`, `SubmitButton`), Toasts über `location.state.notice`.

### Tests

- **Ort:** `apps/server/src/auth/auth.test.ts`, `profile/profile.test.ts`, `lobby/lobby.test.ts` („keine E-Mail an unbestätigte Adressen“), `apps/web/src/pages/anmeldung/Anmeldung.test.tsx`, `pages/lobby/Lobby.test.tsx`, `pages/profil/Profil.test.tsx`
