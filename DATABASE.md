# Database (Drizzle + Postgres)

## Source of truth

- Schema is defined in `lib/db/schema.ts`.
- Access the DB via `db` from `@/lib/db`.

## Local workflow

- Apply schema changes:
  - `npm run db:push`
- Inspect DB:
  - `npm run db:studio`

## Query conventions

- Reads are typically done in Server Components (or helpers they call).
- Writes happen in Server Actions (`lib/modules/*/actions.ts`).
- Always scope data by Clerk `userId` (multi-tenant safety).

## Types

Prefer Drizzle inferred types:

- Select type: `typeof table.$inferSelect`
- Insert type: `typeof table.$inferInsert`

Avoid duplicating schema fields by hand; define types only for derived/computed shapes.
