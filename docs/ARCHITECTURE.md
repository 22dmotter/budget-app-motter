# Architecture

The **website is the product**. The calculator, My Plan tracker, budget, and milestones are a complete, app-like experience in the browser (installable as a PWA). A native mobile app is an *optional future client*, not a current promise.

## Goals

- One GitHub repo is the source of truth.
- The **web app is the primary client**.
- The **API stays shared** (`/v1`) so a native client remains possible later — same contracts, same `@motter/core` math.
- Secrets stay in env files / host secret managers — never committed.

## Packages

| Package | Role |
|---------|------|
| `@motter/web` | Next.js App Router. Primary product UI. Talks to `@motter/core` in the browser today; can call `@motter/api-client` later. |
| `@motter/api` | Fastify HTTP API, versioned under `/v1`. Stateless calculate routes work now; persisted CRUD is stubbed. |
| `@motter/core` | Pure TypeScript engines: money (integer cents), payoff, budget, progress, journey/milestones, encouragement. Zero DOM/IO. Used by web and API. |
| `@motter/shared` | Zod schemas + inferred types (`AppState`, debts, budgets, calculate requests). |
| `@motter/api-client` | Typed `fetch` wrapper for when the hosted API + auth land. |

## Request flow (today)

1. The browser loads the static site (GitHub Pages).
2. Calculator and My Plan run entirely in the browser via `@motter/core`.
3. State is saved through a **storage adapter** (`localStorage` now). Export/import JSON is the backup.
4. The API’s `POST /v1/calculate/*` routes use the same engine (useful for a future hosted client). Domain CRUD returns 501.

## Planned flow

```
Web app (primary)  ──┐
                     ├── API /v1  → Postgres (users, plans, debts, payments)
Optional native app ─┘            → Auth, Stripe (later)
```

Storage adapter swap: `createLocalPlanStorage()` today, an API adapter later, without rewriting the engines.

## PWA

`manifest.webmanifest` + `sw.js` (cache-first for `/_next/static` and icons; network-first for pages, with app-shell fallback). Scope is relative so it works under `/budget-app-motter/` or at `/`.

## Next phase

Hosted API, Postgres (see `docs/DATA_MODEL.md` and `apps/api/prisma/schema.prisma`), auth, Stripe entitlements that actually gate Plus features, lead capture, and optionally a live fetch of Daniel’s public ledger instead of the build-time snapshot.
