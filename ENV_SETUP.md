# Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database (Get from Vercel Storage tab)
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."

# Auth (Get from Clerk Dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Storage (Get from UploadThing Dashboard)
UPLOADTHING_SECRET=...
UPLOADTHING_APP_ID=...

# AI (Get from Google AI Studio)
GOOGLE_AI_API_KEY=...

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Next Steps

1. Add your environment variables to `.env.local`
2. Run `npm run db:push` to create the database schema
3. Run `npm run dev` to start the development server
4. Sign in with Clerk
5. Upload a receipt and watch the AI extract the data!

