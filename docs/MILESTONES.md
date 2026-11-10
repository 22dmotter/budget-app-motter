# Milestones & journey

All stations, badges, and streaks are **derived** from logged payment/balance history plus the current plan. The app never invents a date. If a balance goes back up, status reflects it. Celebrations store only `celebratedIds` — not the achievements themselves.

See `packages/core/src/milestones.ts` (`deriveJourney`) and `packages/core/src/encouragement.ts`.

## Stations

Plan made → First payment logged → First $1,000 paid down → 10% → 25% → First debt paid off → 50% Halfway Home → 75% → a station for each additional debt paid off → 100% Debt-Free.

`next` includes remaining cents and a projected date from the current payoff plan (an estimate).

## Streaks (no shame)

- **On-plan months:** consecutive calendar months where logged payments ≥ planned monthly total (minimums + extra). The current month doesn’t break the streak until it ends.
- **Check-in weeks:** weeks with any logged payment. One missed week per calendar month is forgiven.
- Best streaks are kept too.

## Badges

First Step, Snowball Rolling, Debt Closed (per debt), Extra Mile, Halfway Home, Faithful Giver, Debt-Free. No levels or XP.

## Entitlements

- **Free:** journey path, percent milestones, debt-closed badges, celebrations.
- **Plus (badge only, not locked yet):** streak reminders, shareable milestone image cards, PDF progress report, accountability partner, full timeline.

## Daniel’s public journey

`npm run sync:daniel` copies a **read-only** snapshot from `/workspace/daniel-motter-site/debt-contributions.js` into `apps/web/src/data/daniel-journey.json`. We only show milestone *dates* when they exist in that ledger. Users can hide the card.

**For the Daniel Motter site (later):** add a “Track your own journey” link to this product’s `/calculator` and `/app` (for example `https://22dmotter.github.io/budget-app-motter/calculator/` and `.../app/`). Eventually publish the ledger as JSON so this app can fetch it live instead of a build-time copy. Do not treat that as a promise in the product UI today.
