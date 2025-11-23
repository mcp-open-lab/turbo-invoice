"use server";

import { auth } from "@clerk/nextjs/server";
import { getTimelineItems, type TimelineItem, type TimelineFilters } from "@/lib/api/timeline";
import { db } from "@/lib/db";
import { receipts, bankStatementTransactions, businesses, bankStatements, documents } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";

export async function fetchTimelineItems(
  page: number,
  limit: number = 20,
  filters?: TimelineFilters
): Promise<{ items: TimelineItem[]; hasMore: boolean }> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const offset = (page - 1) * limit;
  const items = await getTimelineItems({ 
    userId, 
    limit: limit + 1, 
    offset,
    filters 
  }); 

  let hasMore = false;
  if (items.length > limit) {
    hasMore = true;
    items.pop(); // Remove the extra item
  }

  return { items, hasMore };
}

// Get distinct merchants for filter dropdown
export async function getTimelineMerchants(): Promise<string[]> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Get merchants from receipts
  const receiptMerchants = await db
    .selectDistinct({ merchantName: receipts.merchantName })
    .from(receipts)
    .where(eq(receipts.userId, userId));

  // Get merchants from bank transactions
  const txMerchants = await db
    .selectDistinct({ merchantName: bankStatementTransactions.merchantName })
    .from(bankStatementTransactions)
    .innerJoin(bankStatements, eq(bankStatementTransactions.bankStatementId, bankStatements.id))
    .innerJoin(documents, eq(bankStatements.documentId, documents.id))
    .where(eq(documents.userId, userId));

  // Combine and deduplicate
  const allMerchants = [
    ...receiptMerchants.map(r => r.merchantName).filter(Boolean),
    ...txMerchants.map(t => t.merchantName).filter(Boolean),
  ];

  const uniqueMerchants = [...new Set(allMerchants)] as string[];
  
  return uniqueMerchants.sort((a, b) => a.localeCompare(b));
}

// Get user's businesses for filter dropdown
export async function getTimelineBusinesses() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const userBusinesses = await db
    .select()
    .from(businesses)
    .where(eq(businesses.userId, userId))
    .orderBy(businesses.name);

  return userBusinesses;
}
