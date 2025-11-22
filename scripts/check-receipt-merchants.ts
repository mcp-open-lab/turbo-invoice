/**
 * Check what merchant names are in the database
 * Usage: npx tsx scripts/check-receipt-merchants.ts
 */

import * as dotenv from "dotenv";
import { db } from "@/lib/db";
import { receipts } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

dotenv.config({ path: ".env.local" });

async function checkMerchants() {
  console.log("📊 Checking merchant names in database...\n");

  // Get unique merchant names with counts
  const merchantStats = await db.execute(sql`
    SELECT 
      merchant_name,
      COUNT(*) as count,
      MIN(created_at) as first_seen,
      MAX(created_at) as last_seen
    FROM receipts
    WHERE merchant_name IS NOT NULL
    GROUP BY merchant_name
    ORDER BY count DESC
    LIMIT 20
  `);

  console.log("Top merchant names:\n");
  for (const row of merchantStats.rows as any[]) {
    console.log(`  ${row.merchant_name}: ${row.count} receipts`);
    console.log(`    First: ${row.first_seen}`);
    console.log(`    Last:  ${row.last_seen}\n`);
  }

  // Check for suspicious patterns
  const suspicious = await db.execute(sql`
    SELECT 
      merchant_name,
      COUNT(*) as count
    FROM receipts
    WHERE merchant_name IN ('Starbucks', 'THE COFFEE BEAN & TEA LEAF', 'Chipotle', 'Target', 'Walmart')
    GROUP BY merchant_name
    ORDER BY count DESC
  `);

  if (suspicious.rows.length > 0) {
    console.log("⚠️  Suspicious common merchant names found:\n");
    for (const row of suspicious.rows as any[]) {
      console.log(`  ${row.merchant_name}: ${row.count} receipts`);
    }
  }
}

checkMerchants().catch(console.error);

