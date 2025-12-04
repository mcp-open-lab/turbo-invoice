/**
 * Remove non-Plaid system categories
 * Keeps only Plaid categories (those with "Plaid:" in description) and user categories
 */

import "dotenv/config";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, and, or, isNull, not, like } from "drizzle-orm";
import { sql } from "drizzle-orm";

async function removeNonPlaidCategories() {
  console.log("Removing non-Plaid system categories...\n");

  // Find all system categories that don't have "Plaid:" in description
  const nonPlaidCategories = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.type, "system"),
        or(
          isNull(categories.description),
          not(like(categories.description, "Plaid:%"))
        )
      )
    );

  console.log(`Found ${nonPlaidCategories.length} non-Plaid system categories to remove:`);
  nonPlaidCategories.forEach((cat) => {
    console.log(`  - ${cat.name} (${cat.transactionType})`);
  });

  if (nonPlaidCategories.length === 0) {
    console.log("\nNo non-Plaid categories found. Database is clean!");
    return;
  }

  // Check if any transactions are using these categories
  const categoryIds = nonPlaidCategories.map((c) => c.id);
  
  // Check receipts
  const receiptsUsingCategories = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM receipts
    WHERE category_id = ANY(${categoryIds})
  `);

  // Check bank transactions
  const bankTxUsingCategories = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM bank_statement_transactions
    WHERE category_id = ANY(${categoryIds})
  `);

  const receiptCount = Number((receiptsUsingCategories.rows[0] as any)?.count || 0);
  const bankTxCount = Number((bankTxUsingCategories.rows[0] as any)?.count || 0);

  if (receiptCount > 0 || bankTxCount > 0) {
    console.log(`\n⚠️  WARNING: Found ${receiptCount} receipts and ${bankTxCount} bank transactions using these categories!`);
    console.log("These transactions will become uncategorized.");
    console.log("\nProceeding with deletion...\n");
  }

  // Delete non-Plaid system categories
  const deleted = await db
    .delete(categories)
    .where(
      and(
        eq(categories.type, "system"),
        or(
          isNull(categories.description),
          not(like(categories.description, "Plaid:%"))
        )
      )
    )
    .returning();

  console.log(`\n✓ Successfully removed ${deleted.length} non-Plaid system categories`);
  console.log("\nRemaining categories:");
  
  const remaining = await db
    .select()
    .from(categories)
    .where(eq(categories.type, "system"));
  
  console.log(`  - ${remaining.length} Plaid system categories`);
  
  const userCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.type, "user"));
  
  console.log(`  - ${userCategories.length} user-created categories`);
}

removeNonPlaidCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to remove categories:", error);
    process.exit(1);
  });

