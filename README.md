# Turbo Invoice

AI-powered receipt scanning and management. Fast, simple receipt capture → AI extraction → CSV export.

## Documentation

- `ARCHITECTURE.md` - App structure, routing, server actions, and request flows
- `MODULES.md` - Module architecture and where domain code/actions live
- `DATABASE.md` - Drizzle schema + local DB workflow
- `tests/README.md` - Testing setup (Vitest + Playwright)
- `lib/ai/README.md` - AI module architecture

## Quick Start

```bash
npm install
npm run db:push
npm run dev
```

## Environment Variables

Create `.env.local`:

```env
POSTGRES_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
UPLOADTHING_TOKEN=sk_live_...
UPLOADTHING_APP_ID=...
GOOGLE_AI_API_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run db:push` - Push schema changes
- `npm run db:studio` - Database UI
