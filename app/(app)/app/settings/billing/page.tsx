import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { accountModules, modules, usageCounters } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { PageContainer } from "@/components/layouts/page-container";
import { BillingSettingsClient } from "@/components/modules/billing/billing-settings-client";
import { getUsagePeriod } from "@/lib/modules/feature-gate";

export default async function BillingSettingsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const allModules = await db
    .select({
      id: modules.id,
      slug: modules.slug,
      name: modules.name,
      description: modules.description,
      monthlyPrice: modules.monthlyPrice,
      stripePriceId: modules.stripePriceId,
      isActive: modules.isActive,
    })
    .from(modules)
    .where(eq(modules.isActive, true))
    .orderBy(modules.name);

  const entitlements = await db
    .select({
      moduleId: accountModules.moduleId,
      enabled: accountModules.enabled,
      source: accountModules.source,
    })
    .from(accountModules)
    .where(and(eq(accountModules.userId, userId), eq(accountModules.enabled, true)));

  const period = getUsagePeriod();
  const usage = await db
    .select({
      metric: usageCounters.metric,
      count: usageCounters.count,
      limit: usageCounters.limit,
    })
    .from(usageCounters)
    .where(and(eq(usageCounters.userId, userId), eq(usageCounters.period, period)));

  return (
    <PageContainer size="standard">
      <BillingSettingsClient
        modules={allModules}
        entitlements={entitlements}
        usage={usage}
      />
    </PageContainer>
  );
}


