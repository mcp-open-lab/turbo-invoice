import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { accountModules, modules } from "@/lib/db/schema";
import type { ModuleSlug } from "@/lib/modules/types";
import { assertUserScope } from "@/lib/db/helpers";
export {
  checkUsageLimit,
  incrementUsage,
  getUsagePeriod,
} from "@/lib/modules/usage-tracker";

export async function hasModuleAccess(
  userId: string,
  moduleSlug: ModuleSlug
): Promise<boolean> {
  const scopedUserId = assertUserScope(userId);

  if (moduleSlug === "core") return true;

  const betaAllowList = (process.env.BILLING_BETA_USER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const betaRestricted =
    betaAllowList.length > 0 && !betaAllowList.includes(scopedUserId);

  const row = await db
    .select({ enabled: accountModules.enabled })
    .from(accountModules)
    .innerJoin(modules, eq(accountModules.moduleId, modules.id))
    .where(
      and(
        eq(accountModules.userId, scopedUserId),
        eq(modules.slug, moduleSlug),
        eq(accountModules.enabled, true),
        eq(modules.isActive, true),
        ...(betaRestricted ? [eq(accountModules.source, "admin_grant")] : []),
        sql`${accountModules.effectiveUntil} IS NULL OR ${accountModules.effectiveUntil} > NOW()`
      )
    )
    .limit(1);

  return row.length > 0;
}
