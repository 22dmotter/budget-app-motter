# Architecture

## Goals

- One **source of truth** GitHub repo for the budgeting product.
- **Website** and a **future mobile app** share the same backend contracts.
- Secrets stay in env files / host secrets managers — never committed.
- Ship scaffolding first; add DB, auth, and Stripe deliberately.

## Packages

| Package | Role |
|---------|------|
| `@motter/web` | Next.js App Router UI. Calls API via `@motter/api-client` only. |
| `@motter/api` | Fastify HTTP API. Versioned under `/v1`. Zod-validated env at startup. |
| `@motter/shared` | Zod schemas + inferred TS types (`User`, `Budget`, `Debt`, `Lead`). |
| `@motter/api-client` | Small typed `fetch` wrapper. Safe to import from web or Expo later. |

## Request flow (today)

1. Browser loads `apps/web`.
2. Server or client uses `createApiClient({ baseUrl: NEXT_PUBLIC_API_URL })`.
3. Client hits `apps/api` (`GET /v1/health` works; domain routes return 501).
4. CORS origins come from `CORS_ORIGINS`.

## Planned flow

```
Web / Mobile → API (/v1) → Postgres (users, budgets, debts, leads)
                         → Stripe (subscriptions + webhooks)
```

## API versioning

All product routes live under `/v1`. Breaking changes should introduce `/v2` rather than silently changing `/v1`.

## Stub policy

Unimplemented handlers use HTTP **501** with a JSON body:

```json
{
  "error": "NotImplemented",
  "message": "…",
  "statusCode": 501
}
```

## Security notes (scaffold)

- `.gitignore` excludes `.env*` (except `.env.example`).
- Stripe webhook stub must later verify signatures with `STRIPE_WEBHOOK_SECRET`.
- Do not log secrets. Do not put secrets in `NEXT_PUBLIC_*` except publishable keys.
