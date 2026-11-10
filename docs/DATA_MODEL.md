# Data model

The browser is the **primary product** today. All tracking, calculator, and milestone data lives in a versioned `AppState` document (`schemaVersion: 1`) stored via a storage adapter (localStorage now, `PUT /v1/plan` later).

Integer cents everywhere. APR in basis points. History entries are facts the user logged — the app never invents payments or dates.

## `AppState` (document)

See `@motter/shared` (`AppStateSchema`): incomes, budget categories, tracked debts with payment/balance history, a payoff plan (strategy, extra, lump sums, start month), entitlements tier, `celebratedIds`, and UI prefs.

## Planned relational schema (Postgres)

A Prisma draft lives at `apps/api/prisma/schema.prisma`. It is **not connected** to a live database yet. Intended tables:

| Table | Role |
|-------|------|
| `users` | Auth identity (email). |
| `households` / membership | A plan can belong to a household later. |
| `budgets` | Monthly zero-based budget. |
| `income_sources` | Recurring income with frequency. |
| `categories` | Budget lines grouped Giving / Saving / Debt / Needs / Wants. |
| `transactions` | Optional expense log (not required for v1 tracker). |
| `debts` | Balances, APR (bps), minimums, opening/starting cents. |
| `debt_payments` | Logged payment + balance snapshots. |
| `plans` | Payoff strategy + extra + lump sums. |
| `leads` | Waitlist (already stubbed). |
| `subscriptions` | Future Stripe customer/subscription (not built). |

Until that lands, `packages/core` remains the source of truth for math, and the web app persists `AppState` locally with JSON export/import.
