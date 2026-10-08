# Unitalk · AI credit usage dashboard

A complete French Next.js App Router dashboard, styled with an off-white sidebar, neutral borders, blue accents and restrained cards. This is a standalone local reconstruction, **not the authenticated Unitalk application**.

## Run locally

Requires Node.js 20.9+ and npm.

```sh
npm install
# The complete lockfile is included in the delivered ZIP; GitHub upload rejected that file.
# With the ZIP, use npm ci for the exact verified dependency versions.
npm run dev
# http://localhost:3000
npm run check
npm run lint
npm test
npm run build
npm start
```

## What works

- Shared 7/30-day, user, collaborator and profile filters update six KPIs, comparison trends, rankings, category breakdown and stacked daily usage.
- Model category filters update the model section; profile rankings share the global filters.
- Searchable, paginated event detail table with CSV export of all matching rows (not just the visible page). Dashboard export uses global filters; model category selection intentionally applies only to the model section.
- Empty states with reset, accessible native selects, keyboard tab navigation, chart value summaries, desktop sidebar collapse and mobile drawer.
- Quota tab explicitly explains the feature is not connected; no quota is saved or modified. Other sidebar destinations report they are unavailable in this local demonstration.

## Data and billing boundaries

**Données de démonstration — aucune connexion aux données Unitalk.** Every event is deterministically generated in `src/lib/usage.ts`. The fixed reference date is 8 October 2026, not today; equal-length current/previous periods never overlap. No fetch, API, login, analytics or secrets are required.

Per the supplied screenshot correction, the demo uses **1 credit = 0.001 USD**. Each generated event records the resulting value explicitly. This is a demonstration convention, not a claim about actual provider prices or a live Unitalk licence. `Solde Licence` is an illustrative allocation of 100,000 credits minus the selected consumption; changing filters does not change any real balance. Chats count distinct synthetic conversation IDs. Scheduled tasks count synthetic scheduled-task records attached to events, not tickets.

CSV uses UTF-8 BOM, semicolon separators, explicit costs and formula-injection protection. Currency is rendered in French with USD notation. All data lives in source/browser memory only.

## Structure

- `src/app/layout.tsx`, `page.tsx`: server entry points and metadata.
- `src/components/dashboard.tsx`: interactive client dashboard.
- `src/app/globals.css`: responsive design and focus styles; system fonts, no font-service dependency.
- `src/lib/usage.ts`: typed synthetic events, filters, aggregation, rankings and CSV.
- `tests/usage.test.ts`: Node test runner via `tsx`.
- `docs/implementation-plan.md`: scope and verification criteria recorded before implementation.

## Vercel handoff (not performed)

Import this repository as a Next.js project, use `npm run build` and the detected Next.js output defaults. No environment variables or secrets are required for this demo. Request approval before creating a preview or production deployment. Real account integration would need server-side authentication, authorized account data, real licence semantics, error/loading states, and provider-backed costs; none are implied by this demo.

Source publication was authorized on `main`. No deployment was performed. The GitHub file-write connection rejected the large `package-lock.json`; the delivered ZIP contains the exact verified lockfile. Add that file via a normal Git push before using `npm ci` in CI.
