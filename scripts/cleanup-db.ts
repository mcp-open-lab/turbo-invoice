/**
 * Cleanup script to wipe all import batches, batch items, receipts, and documents
 * Usage: npx tsx scripts/cleanup-db.ts [userId]
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "@/lib/db";
import {
  importBatches,
  importBatchItems,
  receipts,
  documents,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

async function cleanupDatabase(userId: string) {
  console.log(`Starting cleanup for user: ${userId}`);

  // 1. Delete Receipts (has userId)
  const deletedReceipts = await db
    .delete(receipts)
    .where(eq(receipts.userId, userId));
  console.log("✓ Deleted receipts");

  // 2. Delete Documents (has userId)
  const deletedDocuments = await db
    .delete(documents)
    .where(eq(documents.userId, userId));
  console.log("✓ Deleted documents");

  // 3. Delete Import Batch Items and Batches
  // First, get all batch IDs for this user
  const userBatches = await db
    .select({ id: importBatches.id })
    .from(importBatches)
    .where(eq(importBatches.userId, userId));

  console.log(`Found ${userBatches.length} batches to delete`);

  if (userBatches.length > 0) {
    const batchIds = userBatches.map((b) => b.id);

    // Delete batch items
    for (const batchId of batchIds) {
      await db.delete(importBatchItems).where(eq(importBatchItems.batchId, batchId));
    }
    console.log(`✓ Deleted ${batchIds.length} batch items`);

    // Delete batches
    await db.delete(importBatches).where(eq(importBatches.userId, userId));
    console.log(`✓ Deleted ${batchIds.length} batches`);
  }

  console.log("\n✅ Cleanup complete!");
  return {
    success: true,
    batchesDeleted: userBatches.length,
  };
}

// Main execution
async function main() {
  const userId = process.argv[2];
  const cleanAll = process.argv[2] === "--all";

  if (cleanAll) {
    // Clean all users
    console.log("Cleaning all users...\n");
    
    try {
      const batches = await db
        .select({ userId: importBatches.userId })
        .from(importBatches)
        .groupBy(importBatches.userId);
      
      const receiptUsers = await db
        .select({ userId: receipts.userId })
        .from(receipts)
        .groupBy(receipts.userId);
      
      const allUsers = new Set([
        ...batches.map((b) => b.userId),
        ...receiptUsers.map((r) => r.userId),
      ]);
      
      if (allUsers.size === 0) {
        console.log("No users found with data.");
        process.exit(0);
      }
      
      console.log(`Found ${allUsers.size} user(s). Cleaning...\n`);
      
      for (const uid of allUsers) {
        console.log(`\nCleaning user: ${uid}`);
        await cleanupDatabase(uid);
      }
      
      console.log("\n✅ All users cleaned!");
      process.exit(0);
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  } else if (!userId) {
    // Try to find users with data
    console.log("No userId provided. Searching for users with data...\n");
    
    try {
      const batches = await db
        .select({ userId: importBatches.userId })
        .from(importBatches)
        .groupBy(importBatches.userId)
        .limit(10);
      
      const receiptUsers = await db
        .select({ userId: receipts.userId })
        .from(receipts)
        .groupBy(receipts.userId)
        .limit(10);
      
      const allUsers = new Set([
        ...batches.map((b) => b.userId),
        ...receiptUsers.map((r) => r.userId),
      ]);
      
      if (allUsers.size === 0) {
        console.log("No users found with data.");
        process.exit(0);
      } else if (allUsers.size === 1) {
        const foundUserId = Array.from(allUsers)[0];
        console.log(`Found single user: ${foundUserId}`);
        console.log("Running cleanup...\n");
        const result = await cleanupDatabase(foundUserId);
        console.log("\nResult:", result);
        process.exit(0);
      } else {
        console.log("Found multiple users:");
        Array.from(allUsers).forEach((uid) => console.log(`  - ${uid}`));
        console.error("\nUsage: npx tsx scripts/cleanup-db.ts <userId>");
        console.error("   Or: npx tsx scripts/cleanup-db.ts --all (clean all users)");
        process.exit(1);
      }
    } catch (error) {
      console.error("Error finding users:", error);
      console.error("\nUsage: npx tsx scripts/cleanup-db.ts <userId>");
      process.exit(1);
    }
  } else {
    const result = await cleanupDatabase(userId);
    console.log("\nResult:", result);
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

