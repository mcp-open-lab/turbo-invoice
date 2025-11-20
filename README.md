# Turbo Invoice

AI-powered receipt scanning and management application built with Next.js 16, Drizzle ORM, Vercel Postgres, Clerk, and Google Gemini.

## Features

- 📸 Upload receipts via drag-and-drop or camera
- 🤖 AI-powered data extraction using Google Gemini
- 💾 Automatic categorization and storage
- 📊 Dashboard to view and manage receipts
- 🔐 Secure authentication with Clerk

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Vercel Postgres with Drizzle ORM
- **Authentication:** Clerk
- **File Storage:** UploadThing
- **AI:** Google Gemini 1.5 Flash
- **UI:** Shadcn UI + Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Accounts for:
  - Vercel (for hosting and database)
  - Clerk (for authentication)
  - UploadThing (for file storage)
  - Google AI Studio (for API key)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mcp-open-lab/turbo-invoice.git
cd turbo-invoice
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Copy `.env.local` and fill in your API keys (see `ENV_SETUP.md` for details).

4. Push database schema:
```bash
npm run db:push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deployment to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add all environment variables in Vercel dashboard (Settings → Environment Variables)
4. Deploy!

Vercel will automatically:
- Detect Next.js
- Run `npm run build`
- Deploy your application

### Required Environment Variables in Vercel

Make sure to add these in Vercel's environment variables:
- `POSTGRES_URL` (from Vercel Postgres)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `UPLOADTHING_SECRET`
- `UPLOADTHING_APP_ID`
- `GOOGLE_AI_API_KEY`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio

## License

Private
