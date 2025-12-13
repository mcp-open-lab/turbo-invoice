"use server";

import type Stripe from "stripe";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { accountModules, modules, stripeCustomers } from "@/lib/db/schema";
import { createId } from "@paralleldrive/cuid2";

export async function upsertStripeCustomerMapping(input: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
}) {
  const existing = await db
    .select({ userId: stripeCustomers.userId })
    .from(stripeCustomers)
    .where(eq(stripeCustomers.userId, input.userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(stripeCustomers).values({
      userId: input.userId,
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
      subscriptionStatus: input.subscriptionStatus ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return;
  }

  await db
    .update(stripeCustomers)
    .set({
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
      subscriptionStatus: input.subscriptionStatus ?? null,
      updatedAt: new Date(),
    })
    .where(eq(stripeCustomers.userId, input.userId));
}

export async function syncEntitlementsFromSubscription(input: {
  userId: string;
  subscription: Stripe.Subscription;
}) {
  const activePriceIds = new Set<string>();
  for (const item of input.subscription.items.data) {
    const priceId = item.price?.id;
    if (priceId) activePriceIds.add(priceId);
  }

  // Find modules matching active subscription price IDs
  const matchedModules = activePriceIds.size
    ? await db
        .select({
          id: modules.id,
          stripePriceId: modules.stripePriceId,
        })
        .from(modules)
        .where(inArray(modules.stripePriceId, Array.from(activePriceIds)))
    : [];

  const activeModuleIds = matchedModules.map((m) => m.id);

  // Disable all previously paid modules for this user; then re-enable active ones.
  await db
    .update(accountModules)
    .set({ enabled: false, updatedAt: new Date() })
    .where(and(eq(accountModules.userId, input.userId), eq(accountModules.source, "paid")));

  for (const moduleId of activeModuleIds) {
    const existing = await db
      .select({ id: accountModules.id })
      .from(accountModules)
      .where(
        and(
          eq(accountModules.userId, input.userId),
          eq(accountModules.moduleId, moduleId),
          eq(accountModules.source, "paid")
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(accountModules).values({
        id: createId(),
        userId: input.userId,
        moduleId,
        enabled: true,
        source: "paid",
        effectiveUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      await db
        .update(accountModules)
        .set({ enabled: true, effectiveUntil: null, updatedAt: new Date() })
        .where(eq(accountModules.id, existing[0].id));
    }
  }
}


