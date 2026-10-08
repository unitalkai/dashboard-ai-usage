# AI credit dashboard implementation plan

## Scope
Build a French, responsive Unitalk-style dashboard in the empty Next.js App Router repository. All data is deterministic demonstration data, with a permanent visible disclosure. No authentication, real billing integration, production quota changes, deployment, or Git commits.

## Files and approach
- App Router server layout/page and one interactive dashboard client boundary.
- `src/lib/usage.ts`: deterministic events, date/entity filters, aggregations, comparison periods, CSV export.
- `src/components/dashboard.tsx`: sidebar, tabs, filters, KPI cards, accessible SVG charts, rankings, searchable event table and honest unavailable quota view.
- `src/app/globals.css`: restrained neutral design, blue active accent, keyboard focus, responsive mobile layout.
- Configuration, npm lockfile, README and aggregation/filter/CSV tests.

## Acceptance criteria
All shared filters update every usage chart, KPI, ranking and exported event dataset. Screenshot correction: demo events explicitly record the illustrative conversion of 1 credit = 0.001 USD; this is not live billing pricing. Periods use an explicit fixed demo reference date. Empty results have a reset action. Detail search and CSV agree. Tabs and filters are keyboard accessible; chart summaries expose values to assistive technology. Desktop and 390px layouts avoid horizontal page overflow. No fake live actions.

## Verification
Run `npm run check`, `npm run lint`, `npm test`, `npm run build`. Exercise the running page via browser when available; parent agent will also verify browser behavior. No commit, push or deploy.

## Risks / boundaries
Synthetic events are not Unitalk account data. Balance is a clearly labeled demo allocation less filtered consumption, not a real account balance. Quota configuration is unavailable rather than pretending to save. System fonts avoid build-time font networking.
