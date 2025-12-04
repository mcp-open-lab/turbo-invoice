"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  receipts,
  bankStatementTransactions,
  bankStatements,
  documents,
  categories,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export type TransactionType = "receipt" | "bank_transaction";

export interface UpdateTransactionParams {
  id: string;
  type: TransactionType;
  categoryId: string;
  businessId: string | null;
  merchantName?: string;
}

async function getCategoryName(categoryId: string): Promise<string | null> {
  const result = await db
    .select({ name: categories.name })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);
  return result[0]?.name ?? null;
}

async function updateReceiptTransaction(
  userId: string,
  params: UpdateTransactionParams
): Promise<void> {
  const categoryName = await getCategoryName(params.categoryId);

  await db
    .update(receipts)
    .set({
      categoryId: params.categoryId,
      category: categoryName,
      businessId: params.businessId,
      merchantName: params.merchantName ?? undefined,
      status: "approved",
      updatedAt: new Date(),
    })
    .where(and(eq(receipts.id, params.id), eq(receipts.userId, userId)));
}

async function updateBankStatementTransaction(
  userId: string,
  params: UpdateTransactionParams
): Promise<void> {
  // Verify ownership through document chain
  const transaction = await db
    .select({ id: bankStatementTransactions.id })
    .from(bankStatementTransactions)
    .innerJoin(
      bankStatements,
      eq(bankStatementTransactions.bankStatementId, bankStatements.id)
    )
    .innerJoin(documents, eq(bankStatements.documentId, documents.id))
    .where(
      and(
        eq(bankStatementTransactions.id, params.id),
        eq(documents.userId, userId)
      )
    )
    .limit(1);

  if (!transaction || transaction.length === 0) {
    throw new Error("Transaction not found or unauthorized");
  }

  const categoryName = await getCategoryName(params.categoryId);

  await db
    .update(bankStatementTransactions)
    .set({
      categoryId: params.categoryId,
      category: categoryName,
      businessId: params.businessId,
      merchantName: params.merchantName ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(bankStatementTransactions.id, params.id));
}

export async function updateTransaction(
  params: UpdateTransactionParams
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    if (params.type === "receipt") {
      await updateReceiptTransaction(userId, params);
    } else {
      await updateBankStatementTransaction(userId, params);
    }

    revalidatePath("/app");
    revalidatePath("/app/review");
    revalidatePath("/app/budgets");

    return { success: true };
  } catch (error) {
    console.error("Failed to update transaction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update",
    };
  }
}

export async function bulkUpdateTransactions(
  updates: UpdateTransactionParams[]
): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, updatedCount: 0, error: "Unauthorized" };
  }

  let updatedCount = 0;

  try {
    for (const params of updates) {
      try {
        if (params.type === "receipt") {
          await updateReceiptTransaction(userId, params);
        } else {
          await updateBankStatementTransaction(userId, params);
        }
        updatedCount++;
      } catch (error) {
        console.error(`Failed to update transaction ${params.id}:`, error);
      }
    }

    revalidatePath("/app");
    revalidatePath("/app/review");
    revalidatePath("/app/budgets");

    return { success: true, updatedCount };
  } catch (error) {
    console.error("Bulk update failed:", error);
    return {
      success: false,
      updatedCount,
      error: error instanceof Error ? error.message : "Bulk update failed",
    };
  }
}

