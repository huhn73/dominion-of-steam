# Spec: 02b — Simple AI & procedural map generator

## Context
02a delivered the board, the rules engine (`packages/shared/src/game/engine/`), the server API with Postgres and the demo match. AI participants only end their turn (`runAITurns` in `apps/server/src/matches/service.ts`), and the only map is the fixed demo from the sample data. 02b makes the game playable solo, as the mission requires: AI opponents that actually play, and a generator that builds a world from a seed plus the map settings of the setup wizard (milestone 04: size, land share, neutral cities, terrain, seed — `product-plan/sections/partie-setup-and-ki-gegner/types.ts`, `MapSettings`/`SetupOptions`).

## Task 0: Commit the current state (requested by the user)
Two commits on `master`: (1) 02a + Docker setup + moved hero images' code side, (2) the art in `public/art/` as its own commit. Message with the Co-Authored-By line.

## Task 1: Save spec documentation
`agent-os/specs/<timestamp>-ki-und-kartengenerator/` with `plan.md`, `shape.md` (scope, decisions, AI heuristics, generator algorithm), `standards.md` (none yet), `references.md` (engine files, setup types/sample data, 04 guide notes on seed and map params). No visuals.

## Task 2: Map generator (`packages/shared/src/game/engine/mapgen.ts`)
`generateWorld({ width, height, landShare, neutralCities, terrain, seed }, seats) → { tiles, cities, capitals }`, pure and deterministic (same seed + settings = same world, as required by the 04 guide).
- Seeded RNG from the seed string (reuse the hash/mulberry32 from `state.ts`, extracted into `rng.ts`).
- Land: smoothed value noise + falloff toward the border (outer ring always deep sea), threshold chosen so the land share hits the target (±3 %); water next to land becomes `shallows`, the rest `deepSea`.
- Terrain level (low/normal/high → ~10/20/30 % of land): forest and hills by a second noise layer, a few mountains at noise peaks.
- Capitals: one per seat on plains/forest of the largest landmasses, chosen by farthest-point sampling (min. distance grows with map size); every capital gets at least 2 free land tiles around it.
- Neutral cities: count by level (low/normal/high ≈ 1 per 18/12/8 land tiles), min. distance 3 to other cities, prefer coast; names from a fixed dieselpunk name list (shuffled by seed).
- City names for capitals from the faction (e.g. "Eisenhafen" for Eisenbund) with fallback to the list.

## Task 3: New matches (`packages/shared/src/game/engine/create.ts`)
`createMatch({ id, name, mode, seed, map settings, participants: [{ id, name, factionId, color, isAI, aiDifficulty }] }, now) → GameState`: generated world, each participant gets their capital (production Grenadiere with faction bonus) plus one Grenadiere, explored = sight around the capital, round 1, seat 0, phase `yourTurn`. `MAP_SIZES` (14×10 … 36×24) as constants in shared, matching the setup options.

## Task 4: AI (`packages/shared/src/game/engine/ai.ts`)
`playAITurn(state, participantId, now) → GameState`: plays using only the AI's own view (`projectView`/`knowledge`), issues commands through `applyCommand` (so every AI move is validated like a player's), catches `CommandError` per unit, caps the number of commands per turn. Heuristics in order per unit:
1. **Attack** the best target from `attackTargets` if the win chance ≥ threshold (easy 0.7 / normal 0.55 / hard 0.45); cities preferred.
2. **Expand:** land units with `canCaptureCities` head (goto) for the nearest reachable neutral or enemy city it knows.
3. **Explore:** otherwise goto the nearest explored tile next to unexplored land/sea within its domain.
4. **Defend:** if nothing to do, sentry; keep one unit in the capital when an enemy is in sight.
5. **Air units** return to the nearest own city/carrier when fuel would not suffice for the way back; sea units explore/attack only.
- **Production:** idle cities build by need — Grenadiere/Panzerwagen mainly, Kanonenboot in coastal cities now and then, the faction special unit when affordable (hard only); easy re-evaluates rarely.
- **Difficulty:** easy skips ~30 % of units each turn (seeded RNG), hard re-plans goto targets each turn.
- Known limitation (documented): the AI does not use transports/carriers yet, so it expands only on its own landmass and by sea combat. Personalities (style tags) come with milestone 04.

## Task 5: Server & web
- `service.ts`: `runAITurns` calls `playAITurn` before `endTurn`, records the turn as before.
- Dev endpoint `POST /api/dev/matches/solo` `{ size?, opponents? (1–3), seed?, difficulty? }` → creates a solo match (dev player p1 "Björn", Eisenbund vs AI factions) with a generated map, returns its id.
- Lobby dev bar: "Neue Solo-Partie" (size + opponents select) → creates and opens `/partie/<id>`; "Demo-Partie öffnen" stays.
- Docker image rebuilt.

## Task 6: Tests
- **Generator:** deterministic for same seed/settings, differs for other seeds; outer ring is water; land share within tolerance for 20/45/70 %; capitals on land, far enough apart, not adjacent to other cities; neutral city count grows with the level; terrain level changes forest/hill share.
- **createMatch:** participants, capitals, start units, explored tiles, view of p1 shows only own surroundings.
- **AI:** captures an adjacent neutral city; attacks a weak enemy but not a strong one (threshold per difficulty); sets production in idle cities; air unit returns to base.
- **Simulation smoke test:** 3 AI players on a generated medium map for 40 rounds → no exceptions, no invalid state (units on valid tiles, cargo consistent), at least one city changed owner; same seed → identical result.
- **Server:** solo endpoint creates a playable match; end turn → AI turns are played and recorded in `turns`.

## Critical files
- New: `packages/shared/src/game/engine/{rng,mapgen,create,ai}.ts` + tests; `MAP_SIZES` in `packages/shared/src/game/catalog.ts`
- Changed: `packages/shared/src/game/engine/{state,index}.ts`, `apps/server/src/matches/service.ts`, `apps/server/src/routes/dev.ts`, `apps/web/src/pages/LobbyPage.tsx`, `apps/web/src/data/match.ts`
- Reused: `applyCommand`, `knowledge`, `projectView`, `attackTargets`/`findPath`/`reachableTiles` (`hex.ts`), `endTurn`, `withBonus`

## Verification
- `pnpm test`, `pnpm typecheck`, `pnpm lint`.
- `docker compose up -d --build`, lobby → "Neue Solo-Partie": map looks plausible (coasts, shallows, forests, cities), end several turns → AI moves appear in the replay, AI captures neutral cities, events report losses/sightings.
- Same seed twice → identical map.
