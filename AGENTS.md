# Repository Guidelines

## Project Structure & Module Organization
- `frontend/`: Next.js app (App Router). UI, hooks, services, and tests.
- `api/`: Cloudflare Workers (Hono + Vite). Routes, middleware, DB (Drizzle/D1).
- `shared/`: Reusable TypeScript utilities shared via `@shared` alias.
- `e2e/`: Playwright end-to-end tests and config.
- `docs/`, `scripts/`: Reference docs and maintenance scripts.

## Build, Test, and Development Commands
- Dev (both apps): `pnpm run dev` (root) — runs `frontend` and `api` in parallel.
- Build: `pnpm run build` (root) — builds `frontend` and `api`.
- Unit tests: `pnpm run test:unit` (root) — runs per-package Vitest.
- E2E tests: `pnpm run test:e2e` (root) or `cd e2e && pnpm test`.
- Quality check + fix: `pnpm run check:fix` (root) — typecheck, lint/format, unit tests.
- API DB (local dev): `cd api && pnpm run db:setup:dev` (migrate + seed).

## Coding Style & Naming Conventions
- Language: TypeScript everywhere; strict types preferred. Path aliases: `@` (frontend), `@shared` (both).
- Lint/format: Biome. Use `pnpm run check` / `check:fix` before commits.
- React: Functional components; component files `PascalCase.tsx` (e.g., `IncomeList.tsx`).
- Files: utilities `utils.ts`, constants `constants.ts`, barrel files `index.ts`.
- Indentation: default Biome settings; no unused exports (use `knip` if needed).

## Testing Guidelines
- Framework: Vitest for unit/integration; Playwright for E2E.
- Locations: co-located `*.test.ts(x)` or `__tests__/` folders.
- Coverage: 80% global thresholds (branches, functions, lines, statements) enforced via Vitest configs.
- Frontend env: `jsdom` by default; optional browser mode for visual tests.
- Commands: `pnpm run test:unit`, `pnpm run test:unit:coverage`, `pnpm run test:e2e`.

## Commit & Pull Request Guidelines
- Commits: conventional prefixes + context, optionally issue link. Examples:
  - `feat(#550): improve API error handling`
  - `fix: resolve Next.js build error`
  - `test: add income filter error cases`
- PRs: clear description, linked issue, scope of change; attach screenshots/gifs for UI; note breaking changes and DB migration steps.

## Security & Configuration Tips
- Environment: copy `api/.env.example` → `api/.env`, `frontend/.env.example` → `frontend/.env`.
- Secrets: never commit `.env`; Wrangler/Cloudflare bindings handled via `wrangler.jsonc`.
- DB: local dev uses SQLite/D1; use provided `db:*` scripts — avoid manual schema edits.
