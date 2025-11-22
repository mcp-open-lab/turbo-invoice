"use server";

import { auth } from "@clerk/nextjs/server";
import { getTimelineItems, type TimelineItem, type TimelineFilters } from "@/lib/api/timeline";

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
