/**
 * SQL Helper Functions
 * Runtime-only helpers to avoid build-time evaluation issues
 */

import { sql } from "drizzle-orm";
import type { TransactionFlags } from "@/lib/constants/transaction-flags";

/**
 * Safely convert TransactionFlags to a JSONB SQL expression
 * This function is only called at runtime, preventing build-time evaluation
 */
export function flagsToJsonb(flags: TransactionFlags | null) {
  if (!flags) {
    return sql`NULL`;
  }
  // Create JSON string at runtime
  const flagsJson = JSON.stringify(flags);
  // Return as raw SQL with proper escaping
  // Using sql.raw() with proper quote escaping for PostgreSQL
  return sql.raw(`'${flagsJson.replace(/'/g, "''")}'::jsonb`);
}

