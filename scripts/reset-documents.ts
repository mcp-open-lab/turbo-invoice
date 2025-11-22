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
} from "@/lib/db/schema";
import { sql } from "drizzle-orm";

/**
 * Reset all documents, receipts, and bank statements
 * Deletes in order to respect foreign key constraints
 */
async function resetDocuments() {
  console.log("Starting database reset...");

  try {
    // Delete in order to respect foreign key constraints
    console.log("1. Deleting import batch items...");
    await db.delete(importBatchItems);
    console.log("   ✓ Import batch items deleted");

    console.log("2. Deleting bank statement transactions...");
    await db.delete(bankStatementTransactions);
    console.log("   ✓ Bank statement transactions deleted");

    console.log("3. Deleting receipts...");
    await db.delete(receipts);
    console.log("   ✓ Receipts deleted");

    console.log("4. Deleting bank statements...");
    await db.delete(bankStatements);
    console.log("   ✓ Bank statements deleted");

    console.log("5. Deleting invoices...");
    await db.delete(invoices);
    console.log("   ✓ Invoices deleted");

    console.log("6. Deleting document extractions...");
    await db.delete(documentExtractions);
    console.log("   ✓ Document extractions deleted");

    console.log("7. Deleting document metadata...");
    await db.delete(documentMetadata);
    console.log("   ✓ Document metadata deleted");

    console.log("8. Deleting documents...");
    await db.delete(documents);
    console.log("   ✓ Documents deleted");

    console.log("9. Deleting import batches...");
    await db.delete(importBatches);
    console.log("   ✓ Import batches deleted");

    console.log("\n✅ Database reset completed successfully!");
  } catch (error) {
    console.error("❌ Error during database reset:", error);
    throw error;
  }
}

// Run the reset
resetDocuments()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nFailed:", error);
    process.exit(1);
  });


