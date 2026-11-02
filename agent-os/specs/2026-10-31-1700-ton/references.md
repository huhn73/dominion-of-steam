# Referenzen für Ton

### Audio-Brief und Manifest

- **Ort:** `product-plan/briefs/audio-brief.md`, `public/audio/manifest.json` (`playback.adaptive_field`, `music_loop_ids`, Varianten)
- **Bezug:** Zuordnung aller Sounds, Schichtregeln, Ambiente-Tabelle; das Manifest legt fest, dass die Schichten komplette Mixe sind.

### Engine

- **Ort:** `apps/web/src/audio/engine.ts` (`WebAudioEngine`, `pickVariant`, `nextBarTime`, `volumeGain`), `audio/ids.ts`, `audio/fakeEngine.ts`
- **Bezug:** Busse, Decks, Schichten, Stinger, Ambiente, Entsperren; Attrappe für Tests.

### Provider und Oberfläche

- **Ort:** `audio/AudioProvider.tsx` (`AudioProvider`, `RouteMusic`, `uiSoundFor`, `musicForPath`), `auth/RequireAuth.tsx`, `settings/MuteButton.tsx`, `shell/AppShell.tsx` (`headerExtra`), `layouts/MenuLayout.tsx`, `layouts/GameLayout.tsx`, `pages/shared/toast.tsx`, `pages/profil/SettingsPage.tsx`
- **Bezug:** Einstellungen → Busse, erster Klick, Delegation für Klick/Schalter/Dialog, Menümusik nach Route, Stummschalter, Fehler- und Speicherton.

### Spielfeld

- **Ort:** `sections/spielfeld/types.ts` (`BoardCue`, `onCue`), `sections/spielfeld/components/Spielfeld.tsx` (Cues in `selectUnit`, `handleDrag`, `sendMove`, `handleTap`, `confirmAttack`, Kampfsequenz, Replay-Timer, Zugbeginn, Ereignisse, Ambiente-Effekt), `audio/ambience.ts`
- **Bezug:** Das Spielfeld meldet, spielt aber nichts.

### Partie

- **Ort:** `pages/useMatchAudio.ts`, `audio/fieldMusic.ts` (`nextField`, `enemyVisible`, `cityThreatened`), `pages/MatchPage.tsx`
- **Bezug:** Schichten starten und wechseln, Fraktionsthema, Sieg/Niederlage, Cue → Sound, abgelehnte Befehle.

### Lobby

- **Ort:** `audio/useLobbySounds.ts` (`lobbyChanges`), `data/lobby.ts` (`useLobby`, Polling 15 s)
- **Bezug:** Benachrichtigungstöne aus dem Diff zweier Lobby-Antworten.

### Tests

- **Ort:** `audio/ids.test.ts`, `audio/engine.test.ts`, `audio/fieldMusic.test.ts`, `audio/ambience.test.ts`, `audio/AudioProvider.test.tsx`, `pages/MatchPage.test.tsx` („Ton in der Partie“), `sections/spielfeld/Spielfeld.test.tsx` (Cues), `test/renderApp.tsx` (`audio`)
