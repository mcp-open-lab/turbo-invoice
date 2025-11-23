"use server";

import { db } from "@/lib/db";
import { batchActivityLogs, importBatches } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export interface BatchActivityLog {
  id: string;
  batchId: string;
  batchItemId: string | null;
  activityType: string;
  message: string;
  details: Record<string, any> | null;
  fileName: string | null;
  duration: number | null;
  createdAt: Date;
}

export async function getBatchActivityLogs(
  batchId: string
): Promise<BatchActivityLog[]> {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    // Verify batch belongs to user
    const batch = await db
      .select()
      .from(importBatches)
      .where(and(eq(importBatches.id, batchId), eq(importBatches.userId, userId)))
      .limit(1);

    if (batch.length === 0) {
      // Return empty array instead of throwing - batch might not exist yet
      return [];
    }

    // Fetch activity logs ordered by most recent first
    const logs = await db
      .select()
      .from(batchActivityLogs)
      .where(eq(batchActivityLogs.batchId, batchId))
      .orderBy(desc(batchActivityLogs.createdAt))
      .limit(100); // Limit to last 100 activities

    return logs.map((log) => ({
      id: log.id,
      batchId: log.batchId,
      batchItemId: log.batchItemId,
      activityType: log.activityType,
      message: log.message,
      details: log.details ? JSON.parse(log.details) : null,
      fileName: log.fileName,
      duration: log.duration,
      createdAt: log.createdAt,
    }));
  } catch (error) {
    // Log error but don't fail the page load
    console.error("Failed to fetch batch activity logs:", error);
    return [];
  }
}

