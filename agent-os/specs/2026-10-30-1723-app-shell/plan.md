# Spec: 01 Shell — Monorepo scaffold, design tokens, app shell

## Context
First roadmap milestone (`agent-os/product/roadmap.md`, guide `product-plan/instructions/incremental/01-shell.md`). The repo currently holds only the design handoff, no code. This spec sets up the pnpm monorepo from `agent-os/product/tech-stack.md` and builds the persistent app shell (menu mode + game mode) around placeholder routes, so later milestones (02–06) only add their section pages.

Shaping decisions (from dialog):
- **Scope:** monorepo + full web shell; user and lobby badge come from a mock data layer; server is only a Fastify health stub. Auth/DB come in later specs.
- **Router:** React Router v7 (SPA / library mode).
- **Tests:** Vitest + Testing Library (no E2E yet).
- **Dark mode:** light/dark/system, default system, persisted in localStorage; milestone 06 wires its "Farbschema" setting to it.
- No `agent-os/standards/` exist yet → no standards applied (noted in standards.md).
- Spec docs written in German, matching `agent-os/product/`.

## Task 1: Save spec documentation
Create `agent-os/specs/2026-10-30-1723-app-shell/`:
- `plan.md` — this plan
- `shape.md` — scope, decisions above, context (visuals, references, product alignment: Dieselpunk style, browser desktop+touch, mobile tab bar)
- `standards.md` — "Noch keine Standards definiert" + pointer to `/agent-os:discover-standards`
- `references.md` — `product-plan/shell/` (components + README), `product-plan/design-system/`, `01-shell.md`
- `visuals/` — copy `product-plan/shell/screenshot.png` (menu mode) and `product-plan/sections/spielfeld-and-zuge/screenshot.png` (game mode)

## Task 2: Monorepo scaffold
- Enable pnpm via `corepack enable pnpm` (pnpm not installed; Node 24 present).
- Root: `package.json` (scripts `dev`, `build`, `test`, `typecheck`, `lint`), `pnpm-workspace.yaml` (`apps/*`, `packages/*`), `tsconfig.base.json` (strict), `.nvmrc` (24), Prettier config.
- `apps/web`: Vite + React 19 + TypeScript.
- `apps/server`: Fastify + TS (tsx for dev), single `GET /api/health` → `{ ok: true }`. Vite dev server proxies `/api` to it.
- `packages/shared`: empty TS package (`@dos/shared`) as home for game rules/types later; web and server depend on it via `workspace:*`.

## Task 3: Design tokens & theme
- Tailwind CSS v4 via `@tailwindcss/vite`, plus `tw-animate-css`, `lucide-react`.
- `apps/web/src/styles/index.css`: `@import "tailwindcss"; @import "tw-animate-css";`, `@custom-variant dark (&:where(.dark, .dark *));`, `@theme` font vars (`--font-heading/body/mono`) taken from `product-plan/design-system/tokens.css`, plus the faction colour vars.
- Google Fonts `<link>`s from `product-plan/design-system/fonts.md` in `apps/web/index.html`; small inline script in `<head>` that applies `.dark` before first paint (no flash).
- `src/theme/useTheme.ts` (+ `ThemeProvider`): `'light' | 'dark' | 'system'`, localStorage key `dos.theme` (wrapped in try/catch), listens to `prefers-color-scheme` when `system`.

## Task 4: Shell components
- Copy `product-plan/shell/components/*` to `apps/web/src/shell/` unchanged (AppShell, MainNav, UserMenu, index.ts).
- Logo: keep default `Cog` (matches the brass gear in the screenshot).

## Task 5: Routing & layouts (React Router v7)
- `src/router.tsx` with `createBrowserRouter`:
  - `MenuLayout` (AppShell `mode="menu"`): `/` Lobby (start page), `/neue-partie`, `/fraktionen`, `/profil`, `/einstellungen` — each a placeholder page (heading + short text, styled like the screenshot's content area).
  - `GameLayout` (AppShell `mode="game"`): `/partie/:matchId` placeholder full-height board area.
  - 404 route.
- Nav items: Lobby (`Castle` icon, badge = your-turn count), Neue Partie (`Swords`), Fraktionen (`Flag`) — icons chosen to match screenshot. `isActive` from `useLocation` (Lobby exact match on `/`).
- Callbacks: `onNavigate` → `navigate()`, `onOpenProfile/Settings` → routes, `onLogout` → mock logout (clears mock user, toast-free; logs for now), `onExitGame` → `/`.
- Lobby placeholder offers a "Spiel-Modus ansehen" button to `/partie/demo` (as in the screenshot).

## Task 6: Mock data layer
- `src/data/session.ts`: `useCurrentUser()` → `{ name: 'Björn' }` (from `spielerprofil-and-einstellungen/sample-data.json`); `useYourTurnCount()` → `2` (as in screenshot); `useMatchHeader(matchId)` → `{ title: 'Die Kohleinseln II · Runde 14', status: 'Dein Zug · Frist So., 19:00', isYourTurn: true }`.
- Hooks shaped so they can later be swapped for API queries without touching layouts.

## Task 7: Game menu (open item from guide)
- `src/shell/GameMenu.tsx`: simple dropdown/sheet opened by `onOpenGameMenu` with entries Partie-Details, Einstellungen, Aufgeben (rose, disabled with "folgt" hint), Zurück zur Lobby. Closes on Escape / click outside (same pattern as `UserMenu`).

## Task 8: Tests (Vitest + Testing Library + jsdom)
- `MenuLayout`: renders 3 nav items, active item has `aria-current="page"`, badge shows count and "9+" above 9, nav click changes route.
- `UserMenu`: initials without avatar, opens/closes on click, Escape, outside click; Profil/Einstellungen navigate.
- `GameLayout`: shows title/status, pulsing dot when `isYourTurn`, back button → `/`, game menu opens.
- `useTheme`: system default, persists choice, toggles `.dark`.

## Critical files
- New: `package.json`, `pnpm-workspace.yaml`, `apps/web/{index.html,vite.config.ts,src/main.tsx,src/router.tsx,src/layouts/*,src/pages/*,src/shell/*,src/theme/*,src/data/session.ts,src/styles/index.css}`, `apps/server/src/index.ts`, `packages/shared/src/index.ts`
- Source (copy, don't rewrite): `product-plan/shell/components/*`

## Verification
- `pnpm install && pnpm typecheck && pnpm test` pass.
- `pnpm dev`: open the web app, compare menu mode with `product-plan/shell/screenshot.png`; check active highlight, badge, user menu, navigation, Lobby as `/`.
- `/partie/demo`: compact header, full-height area without page scroll, game menu works.
- Mobile viewport (DevTools ~390px): tab bar at bottom, content not covered.
- Toggle OS dark mode / set `dos.theme` in localStorage: theme follows, no flash on reload.
- `curl localhost:<server-port>/api/health` → `{"ok":true}`; same via the Vite proxy.
- Checklist "Fertig, wenn" in `01-shell.md` ticked off.
