# Modules (Domain-First Architecture)

## Why modules

Features are organized by **domain** to keep ownership clear and avoid a large `app/actions/*` bucket. Each module exposes Server Actions and keeps its domain logic close by.

## Where modules live

Module root: `lib/modules/*`

Typical module files:

- `lib/modules/<domain>/actions.ts`: Server Actions (mutation boundary)
- `lib/modules/<domain>/index.ts`: optional exports / module metadata
- `lib/modules/<domain>/*.ts`: module helpers

Examples in this repo:

- `lib/modules/import/actions.ts`
- `lib/modules/transactions/actions.ts`
- `lib/modules/plaid/actions.ts`
- `lib/modules/billing/actions.ts`

## Server Actions vs `lib/*`

- **Server Actions** (`'use server'`) are the boundary the UI calls.
- **`lib/*`** contains reusable implementation (domain logic, query helpers, integrations).

Rule of thumb:

- UI components call `lib/modules/<domain>/actions.ts`
- Actions call into `lib/*` as needed

## Dependency rules (keep it maintainable)

- **UI** (`app/`, `components/`) may import:
  - module actions (`lib/modules/*/actions.ts`)
  - pure helpers (formatting, types) that are safe for the environment
- **Modules** may import:
  - `lib/db/*` (server-only)
  - other `lib/*` helpers
  - other modules sparingly (prefer shared helpers to avoid cycles)
- **Client Components** should not import DB code (anything that imports `@/lib/db`).

## Module access / feature gating

Two layers:

- `proxy.ts`: coarse redirect/allow rules at the edge
- `lib/modules/feature-gate.ts` + per-module `layout.tsx`: fine-grained UI gating

## Adding a new module (checklist)

1. Create `lib/modules/<new-domain>/actions.ts`.
2. Add any DB schema needs to `lib/db/schema.ts` (then run `npm run db:push`).
3. Add UI under `app/(app)/app/<new-route>/...`.
4. If gated, add a `layout.tsx` for that module that checks `hasModuleAccess()`.
5. Add tests under `tests/modules/<new-domain>/`.

## Tests alignment

- Module-owned tests: `tests/modules/<domain>/*`
- Cross-cutting tests: `tests/lib/*`
- Utilities: `tests/utils/*`
