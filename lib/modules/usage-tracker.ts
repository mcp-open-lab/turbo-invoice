import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { usageCounters } from "@/lib/db/schema";
import { assertUserScope } from "@/lib/db/helpers";
import type { UsageMetric } from "@/lib/modules/types";
import { FREE_LIMITS } from "@/lib/modules/types";
import { createId } from "@paralleldrive/cuid2";

export function getUsagePeriod(date: Date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

export async function getUsageCounter(input: {
  userId: string;
  metric: UsageMetric;
  period?: string;
}): Promise<{ count: number; limit: number; period: string }> {
  const userId = assertUserScope(input.userId);
  const period = input.period ?? getUsagePeriod();
  const limit = FREE_LIMITS[input.metric];

  const row = await db
    .select({ count: usageCounters.count, limit: usageCounters.limit })
    .from(usageCounters)
    .where(
      and(
        eq(usageCounters.userId, userId),
        eq(usageCounters.metric, input.metric),
        eq(usageCounters.period, period)
      )
    )
    .limit(1);

  if (row.length === 0) {
    return { count: 0, limit, period };
  }

  return {
    count: Number(row[0].count) || 0,
    limit: Number(row[0].limit) || limit,
    period,
  };
}

export async function checkUsageLimit(input: {
  userId: string;
  metric: UsageMetric;
  incrementBy?: number;
  period?: string;
}): Promise<{ allowed: boolean; remaining: number; limit: number; count: number }> {
  const incrementBy = input.incrementBy ?? 1;
  const counter = await getUsageCounter({
    userId: input.userId,
    metric: input.metric,
    period: input.period,
  });

  const nextCount = counter.count + incrementBy;
  const remaining = Math.max(0, counter.limit - counter.count);

  return {
    allowed: nextCount <= counter.limit,
    remaining,
    limit: counter.limit,
    count: counter.count,
  };
}

export async function incrementUsage(input: {
  userId: string;
  metric: UsageMetric;
  incrementBy?: number;
  period?: string;
}): Promise<void> {
  const userId = assertUserScope(input.userId);
  const period = input.period ?? getUsagePeriod();
  const incrementBy = input.incrementBy ?? 1;
  const limit = FREE_LIMITS[input.metric];

  await db
    .insert(usageCounters)
    .values({
      id: createId(),
      userId,
      metric: input.metric,
      period,
      count: incrementBy,
      limit,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [usageCounters.userId, usageCounters.metric, usageCounters.period],
      set: {
        count: sql`${usageCounters.count} + ${incrementBy}`,
        updatedAt: new Date(),
      },
    });
}


