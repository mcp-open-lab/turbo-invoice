/**
 * Wipe all user data - database documents AND UploadThing files
 *
 * Usage:
 *   npm run wipe -- --confirm
 */

import { db } from "@/lib/db";
import {
  importBatchItems,
  bankStatementTransactions,
  receipts,
  bankStatements,
  invoices,
  documentExtractions,
  documentMetadata,
  documents,
  importBatches,
  batchActivityLogs,
} from "@/lib/db/schema";
import { UTApi } from "uploadthing/server";

async function wipeAll() {
  const args = process.argv.join(" ");
  const hasConfirm = args.includes("--confirm") || args.includes("-y");

  if (!hasConfirm) {
    console.log(
      "\n⚠️  WARNING: This will delete ALL documents and uploaded files!"
    );
    console.log("   Run with --confirm flag to proceed.");
    console.log("   Example: npm run wipe -- --confirm\n");
    process.exit(0);
  }

  console.log("\n🗑️  Starting full wipe...\n");

  // Step 1: Delete UploadThing files
  console.log("📁 UPLOADTHING FILES");
  console.log("─".repeat(40));

  try {
    const utapi = new UTApi();
    const response = await utapi.listFiles();
    const files = Array.isArray(response)
      ? response
      : (response as any)?.files || [];

    if (files.length === 0) {
      console.log("   No files found.\n");
    } else {
      console.log(`   Found ${files.length} file(s). Deleting...`);

      const fileKeys = files.map((f: any) => f.key || f.id).filter(Boolean);
      const batchSize = 10;

      for (let i = 0; i < fileKeys.length; i += batchSize) {
        const batch = fileKeys.slice(i, i + batchSize);
        await utapi.deleteFiles(batch);

        if (i + batchSize < fileKeys.length) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      console.log(`   ✅ Deleted ${files.length} file(s).\n`);
    }
  } catch (error) {
    console.log(
      `   ⚠️  UploadThing error: ${
        error instanceof Error ? error.message : String(error)
      }\n`
    );
  }

  // Step 2: Delete database records
  console.log("🗄️  DATABASE RECORDS");
  console.log("─".repeat(40));

  try {
    const tables = [
      { name: "batch_activity_logs", table: batchActivityLogs },
      { name: "import_batch_items", table: importBatchItems },
      { name: "bank_statement_transactions", table: bankStatementTransactions },
      { name: "receipts", table: receipts },
      { name: "bank_statements", table: bankStatements },
      { name: "invoices", table: invoices },
      { name: "document_extractions", table: documentExtractions },
      { name: "document_metadata", table: documentMetadata },
      { name: "documents", table: documents },
      { name: "import_batches", table: importBatches },
    ];

    for (const { name, table } of tables) {
      await db.delete(table);
      console.log(`   ✅ ${name}`);
    }

    console.log("\n✅ Wipe completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Database error:", error);
    process.exit(1);
  }
}

wipeAll()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
