/**
 * Enable PostgreSQL pg_trgm extension for trigram similarity matching
 *
 * IMPORTANT: This extension is required for the similar transactions feature!
 *
 * Option 1: Run this script with environment variables:
 *   POSTGRES_URL=your_connection_string npx tsx scripts/enable-pg-trgm.ts
 *
 * Option 2: Run manually in your database:
 *   psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
 *
 * Option 3: Use Vercel Postgres Dashboard:
 *   - Go to your Vercel Postgres database
 *   - Run in SQL Console: CREATE EXTENSION IF NOT EXISTS pg_trgm;
 */

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function enablePgTrgm() {
  try {
    console.log("Enabling pg_trgm extension...");

    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    console.log("✅ pg_trgm extension enabled successfully!");
    console.log("✅ Similarity functions are now available:");
    console.log("   - similarity(text, text) returns 0-1");
    console.log("   - text % text returns boolean");
    console.log("   - word_similarity(text, text) for word-level matching");

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to enable pg_trgm extension:", error);
    console.error("\n📋 Manual steps:");
    console.error("1. Connect to your database:");
    console.error("   psql $DATABASE_URL");
    console.error("\n2. Run this SQL:");
    console.error("   CREATE EXTENSION IF NOT EXISTS pg_trgm;");
    console.error("\n3. Verify with:");
    console.error("   SELECT * FROM pg_extension WHERE extname = 'pg_trgm';");
    process.exit(1);
  }
}

enablePgTrgm();
