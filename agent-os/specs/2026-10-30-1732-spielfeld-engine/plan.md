# Spec: 02a Spielfeld & Züge — Board, rules engine, server API, persistence

## Context
Milestone 02 (`product-plan/instructions/incremental/02-spielfeld-and-zuge.md`) is the playable core: hex map with fog of war, moving units, orders, combat, city capture, production, transport, opponent replay, end turn. The milestone is too big for one change, so it is split:
- **02a (this spec):** board UI from the handoff, shared rules engine, server API with validation, saved game state in Postgres, seeded demo match. AI opponents only end their turn.
- **02b (next spec):** simple AI that actually plays, procedural map generator from seed.

Shaping decisions:
- **DB:** Postgres 17 in Docker (docker-compose). Prerequisite: enable WSL integration for this distro in Docker Desktop (Settings → Resources → WSL integration).
- **Identity:** fixed dev player — the server treats every request as participant `p1` ("Björn"), matching the shell mock user. One function `currentPlayer(req)` to be replaced by auth later.
- **Turn order:** sequential in seat order. A round = every active participant plays once; the next participant's turn starts with their replay of everything visible to them since their last turn.
- **Static data:** factions and unit types live as constants in `packages/shared` (from sample-data), also used by milestone 03.
- **Out of scope (02a):** AI moves, map generator (02b); audio hooks (separate audio spec); WebSockets (05 — 02a polls while waiting); settings from 06; match end screen (not in handoff).
- Spec docs in German, like the earlier ones.

## Task 1: Save spec documentation
`agent-os/specs/2026-10-30-1732-spielfeld-engine/` with `plan.md`, `shape.md` (decisions above + rules model below), `standards.md` (still none), `references.md` (section folder, guide, tests.md, hex.ts, data-shapes), `visuals/spielfeld.png` (copy of section screenshot).

## Task 2: Shared game types & rules (packages/shared)
- `src/game/types.ts`: the data types (Basics + Data parts) from `product-plan/sections/spielfeld-and-zuge/types.ts`, plus `PlayerView` (= component data props) and `Command` union: `move`, `goto`, `sentry`, `patrol`, `cancelOrder`, `skip`, `attack`, `unload`, `setProduction`, `markEventRead`, `skipReplay`, `endTurn`.
- `src/game/hex.ts`: handoff `components/hex.ts` moved here verbatim (only the type import path changes) — single source for client preview and server validation. `src/game/bonus.ts` likewise (`withBonus`).
- `src/game/catalog.ts`: `FACTIONS`, `UNIT_TYPES` from sample-data.
- Package exports: `@dos/shared/game`.

## Task 3: Rules engine (packages/shared/src/game/engine/)
Pure, deterministic functions over a full truth state `GameState` (match meta, participants + seat order + current seat, full map, all cities with production, all units, per-participant explored sets, event log, action log, RNG counter).
- `applyCommand(state, playerId, cmd) → { state, combat?, events } | { error: { code, message } }` — validates turn ownership, phase, unit ownership and rules via `buildIndex`/`reachableTiles`/`findPath`/`attackTargets` from `hex.ts` evaluated on the player's knowledge (explored tiles + truth units/cities; a hidden enemy on the path stops the move at the last free tile and creates an `enemySighted` event).
- **Movement:** cost 1/tile, budget `min(movesLeft, fuel)`, movement bonus via `withBonus`. Loading = moving land unit onto own transport / air onto carrier (cargo moves with transport). `unload` to adjacent land tile. Air takeoff from carrier = normal move of the carried unit.
- **Orders:** goto (stores target + `turnsRemaining`, executed at start of each of the owner's turns), sentry (wakes with `enemySighted` when an enemy comes into sight), patrol (cycles waypoints each turn), cancel, skip (`needsOrders=false` this turn).
- **Combat:** `attack = strength × health%`, `defense = defense × health% (+1 in city, +1 more for Salzküsten-Liga cities)`, `winChance = a/(a+d)`; outcome drawn from seeded RNG (match seed + counter → reproducible). Loser is destroyed (with cargo), winner takes `round(50 × (1 − winChance))` damage, min 5. Attacking an empty city (`canCaptureCities` only): chance `a/(a+1)` (+1 Salzküste); on victory city changes owner, unit moves in, production reset, `cityCaptured`/`cityLost` events. Attack uses all remaining moves.
- **Turn lifecycle:** `endTurn` → next active seat; `startTurn(seat)`: reset moves, refuel air in own city/on carrier, air units outside a base with fuel 0 are lost (`unitLost`), `fuelLow` at ≤ 2, production progress (+1; when done, unit appears in city, `unitBuilt`), heal +20 in own city, execute standing orders, recompute `needsOrders`, update visibility/explored. Phase for the player: `replay` if there are visible replay actions since their last turn, else `yourTurn`. Wrap to next round after last seat.
- **Elimination:** participant without cities and units → `eliminated`, skipped in order.
- **Visibility:** sight radius 1 (land, cities), 2 (sea, air). Explored sets persist.
- `projectView(state, viewerId) → PlayerView`: tiles with visibility, only known cities (last seen owner, production only for own), own units + visible enemies, events since viewer's last turn, replay actions filtered to tiles visible to the viewer (path trimmed), `combatPreviews` for own units, `match.phase` from the viewer's perspective, `turnDeadline` for async.
- `seedDemo()`: builds `GameState` from `sample-data.json` (round 14, p1 to move; p3 Lena Hartmann is human, p2/p4 AI).

## Task 4: Server — DB & API (apps/server)
- `docker-compose.yml` (postgres:17, dev db `dos` + test db `dos_test`), `.env.example` with `DATABASE_URL`.
- Drizzle (`drizzle-orm`, `postgres`, `drizzle-kit`): tables `matches` (id, name, mode, status, round, seed, turn_deadline, state JSONB, version, updated_at) and `turns` (match_id, round, participant_id, actions JSONB, ended_at). Migrations in `apps/server/drizzle/`.
- `MatchRepository`: load, save in a transaction with optimistic version check. Every accepted command is saved immediately (survives restart); `endTurn` also writes a `turns` row.
- Routes (all as dev player via `currentPlayer(req)`):
  - `GET /api/matches/:id/view` → `PlayerView`
  - `POST /api/matches/:id/commands` (`Command` body, validated) → `{ view, combat? }`; rule violations → `422 { error: { code, message } }`, not your turn → `409`, unknown match → `404`.
  - After `endTurn`: AI seats end their turn immediately (02b replaces this with the AI); human seats wait.
  - Dev only (`NODE_ENV !== 'production'`): `POST /api/dev/demo/reset` (reseed match `demo`), `POST /api/dev/matches/:id/pass` (current non-dev human seat ends turn). Demo is seeded on start if missing.
- `pnpm --filter @dos/server db:migrate`, `db:studio` scripts.

## Task 5: Web — board integration (apps/web)
- Copy `product-plan/sections/spielfeld-and-zuge/components/*` to `apps/web/src/sections/spielfeld/components/` unchanged except `hex.ts` and `bonus.ts`, which become re-exports from `@dos/shared/game`. `types.ts` = re-export of shared data types + the unchanged `SpielfeldUndZuegeProps`.
- Add `@tanstack/react-query`. `src/data/match.ts`: `useMatchView(id)` (polls every 5 s while phase is `waiting`), `useMatchCommand(id)` (mutation, writes returned view into the cache, keeps `lastCombat` as a new object per combat).
- `MatchPage`: loading state (board skeleton + "Lade Partie …"), error state (404 / network, retry button), renders `Spielfeld` with view + callbacks mapped to commands. `onSelectUnit` / `onSelectCity` stay client-only (previews are in the view). Rejected command → rose toast "Aktion abgelehnt: <message>" and refetch.
- `GameLayout` header from the view: title `<Name> · Runde <n>`, status "Dein Zug · Frist <Wochentag>, <HH:MM>" (deadline only async) / "Gegnerzüge" / "Warte auf Gegner", `isYourTurn`. Replaces `useMatchHeader` mock.
- Lobby placeholder button points to `/partie/demo`; small dev bar in the lobby: "Demo zurücksetzen", "Mitspieler ziehen lassen".

## Task 6: Tests
- **Engine (Vitest, bulk of coverage):** movement rules (unexplored, enemies, sea/land/air, transport load/unload, fuel), goto over rounds, sentry wake, patrol, skip, combat determinism and damage, city capture incl. production reset, production with faction bonus (Eisenbund Grenadiere 3 rounds), aircraft loss at fuel 0, turn order/round wrap, elimination, fog projection (no unknown cities, no invisible enemies in view, replay filtered).
- **Server (fastify.inject against `dos_test`):** view, command accepted/rejected (422/409/404), persistence across a rebuilt app instance (restart), end turn → AI passes → back to p1 with `replay`/`yourTurn`. Run by `pnpm test` when `TEST_DATABASE_URL` is set, otherwise skipped with a notice.
- **Web (RTL):** selected cases from `tests.md` against `Spielfeld` with sample data (tap move, out-of-range goto, attack dialog + cancel, production incl. running type no-op, end turn confirm, empty replay calls `onSkipReplay`, empty log text); `MatchPage` loading/error/rejected-command toast with mocked fetch.

## Critical files
- New: `packages/shared/src/game/{types,hex,bonus,catalog}.ts`, `packages/shared/src/game/engine/*`, `apps/server/src/{db,routes,matches}/*`, `docker-compose.yml`, `apps/web/src/sections/spielfeld/**`, `apps/web/src/data/match.ts`, `apps/web/src/pages/MatchPage.tsx`
- Changed: `apps/web/src/layouts/GameLayout.tsx`, `apps/web/src/data/session.ts` (drop `useMatchHeader`), `apps/web/src/router.tsx`, `apps/web/src/main.tsx` (QueryClientProvider), `apps/web/src/pages/LobbyPage.tsx`
- Sources reused: `product-plan/sections/spielfeld-and-zuge/components/*`, `types.ts`, `sample-data.json`

## Verification
- `docker compose up -d`, `pnpm --filter @dos/server db:migrate`, `pnpm test` (engine, server with `TEST_DATABASE_URL`, web), `pnpm typecheck`, `pnpm lint`.
- `pnpm dev`, open `/partie/demo`: matches `visuals/spielfeld.png`; move by tap and drag, goto, sentry, patrol, attack + toast, capture opens city panel, production with bonus, unload / takeoff, end turn → AIs pass → "Warte auf Lena Hartmann …" → dev "Mitspieler ziehen lassen" → next round with replay/`yourTurn`.
- Restart the server mid-turn: state unchanged after reload.
- Inspect `GET /api/matches/demo/view`: no enemies outside sight, no cities on unexplored tiles.
- Mobile viewport: bottom sheets, collapsible minimap; Esc/right-click cancel stepwise.
- Tick the "Fertig, wenn" checklist in the guide except items moved to 02b (AI actually playing).
