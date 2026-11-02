# Referenzen für Ton beim Wechsel

### Audio-Engine

- **Ort:** `apps/web/src/audio/engine.ts` (`playMusic`, `stopMusic`, `playStinger`, `stopLoop`, `dispose`), Interface `AudioEngine`
- **Bezug:** Deck mit Token-Schutz gegen verspätete Ladevorgänge (`musicToken`), gleiches Muster für den Stinger. `stopLoop` blendet aus und stoppt zeitversetzt.

### Provider und Einbau

- **Ort:** `apps/web/src/audio/AudioProvider.tsx` (`AudioProvider`, `OwnedAudio`, `RouteMusic`, `musicForPath`), `apps/web/src/auth/RequireAuth.tsx`, `apps/web/src/router.tsx`
- **Bezug:** Lebensdauer der Engine hängt am Provider in `RequireAuth`; öffentliche Routen liegen außerhalb.

### Abmelden

- **Ort:** `apps/web/src/data/session.ts` (`useSignOut`, `useLogout`), Benutzermenü in `layouts/MenuLayout.tsx` und `layouts/GameLayout.tsx`
- **Bezug:** Navigation zur Anmeldeseite, danach Cache leeren; der Provider wird dabei abgebaut.

### Partie-Ton

- **Ort:** `apps/web/src/pages/useMatchAudio.ts`
- **Bezug:** Schichten, Fraktionsthema und Ergebnisstück; Cleanup beim Verlassen der Partie.

### Tests

- **Ort:** `apps/web/src/audio/engine.test.ts` (`FakeContext`, `FakeSource.stopped`, `gainOf`), `apps/web/src/audio/AudioProvider.test.tsx`, `apps/web/src/pages/MatchPage.test.tsx` (Sieg-Ton, „Zur Lobby“), `apps/web/src/audio/fakeEngine.ts`
- **Bezug:** Muster für Engine- und App-Tests.

### Vorherige Spec

- **Ort:** `agent-os/specs/2026-10-31-1700-ton/shape.md`
- **Bezug:** Entscheidungen zu Menümusik nach Route, Stingern und „Anmeldeseiten still“.
