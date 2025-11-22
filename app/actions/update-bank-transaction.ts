"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { bankStatementTransactions, bankStatements, documents } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const updateBankTransactionSchema = z.object({
  id: z.string(),
  merchantName: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
});

export async function updateBankTransaction(data: unknown) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Validate input
  const validated = updateBankTransactionSchema.parse(data);

  // Verify the transaction belongs to the user
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
        eq(bankStatementTransactions.id, validated.id),
        eq(documents.userId, userId)
      )
    )
    .limit(1);

  if (!transaction || transaction.length === 0) {
    throw new Error("Transaction not found or unauthorized");
  }

  // Update the transaction
  await db
    .update(bankStatementTransactions)
    .set({
      merchantName: validated.merchantName || null,
      category: validated.category || null,
      // Note: We don't have a notes field in the schema yet, so we'll skip it for now
      updatedAt: new Date(),
    })
    .where(eq(bankStatementTransactions.id, validated.id));

  revalidatePath("/app");
  revalidatePath(`/app/transactions/${validated.id}`);
}

