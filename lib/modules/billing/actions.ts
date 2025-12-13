"use server";

import { z } from "zod";
import { createAuthenticatedAction } from "@/lib/safe-action";
import { db } from "@/lib/db";
import { modules, stripeCustomers } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { stripe, isStripeConfigured } from "@/lib/stripe/client";
import { upsertStripeCustomerMapping } from "@/lib/stripe/sync";
import { MODULE_SLUGS } from "@/lib/modules/types";

function getAppBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (!base) {
    throw new Error("NEXT_PUBLIC_APP_URL (or VERCEL_URL) must be set for billing");
  }
  return base;
}

const CreateCheckoutSchema = z.object({
  moduleSlugs: z
    .array(z.enum(MODULE_SLUGS))
    .min(1, "Select at least one module"),
});

export const createModuleCheckoutSession = createAuthenticatedAction(
  "createModuleCheckoutSession",
  async (
    userId,
    input: z.infer<typeof CreateCheckoutSchema>
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    if (!isStripeConfigured() || !stripe) {
      return { success: false, error: "Stripe is not configured" };
    }

    const { moduleSlugs } = CreateCheckoutSchema.parse(input);

    // Load module price IDs
    const moduleRows = await db
      .select({
        slug: modules.slug,
        stripePriceId: modules.stripePriceId,
      })
      .from(modules)
      .where(and(inArray(modules.slug, moduleSlugs), eq(modules.isActive, true)));

    const missing = moduleSlugs.filter(
      (slug) => !moduleRows.find((r) => r.slug === slug && r.stripePriceId)
    );
    if (missing.length > 0) {
      return {
        success: false,
        error: `Billing is not configured for: ${missing.join(", ")}`,
      };
    }

    const lineItems = moduleRows.map((m) => ({
      price: m.stripePriceId as string,
      quantity: 1,
    }));

    // Ensure customer exists
    const existing = await db
      .select({ stripeCustomerId: stripeCustomers.stripeCustomerId })
      .from(stripeCustomers)
      .where(eq(stripeCustomers.userId, userId))
      .limit(1);

    const customerId =
      existing[0]?.stripeCustomerId ||
      (
        await stripe.customers.create({
          metadata: { userId },
        })
      ).id;

    if (!existing[0]?.stripeCustomerId) {
      await upsertStripeCustomerMapping({
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: null,
        subscriptionStatus: null,
      });
    }

    const baseUrl = getAppBaseUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: userId,
      metadata: { userId },
      line_items: lineItems,
      success_url: `${baseUrl}/app/settings?billing=success`,
      cancel_url: `${baseUrl}/app/settings?billing=cancel`,
      subscription_data: {
        metadata: { userId },
      },
    });

    if (!session.url) {
      return { success: false, error: "Failed to create checkout session" };
    }

    return { success: true, url: session.url };
  }
);

export const createBillingPortalSession = createAuthenticatedAction(
  "createBillingPortalSession",
  async (userId): Promise<{ success: boolean; url?: string; error?: string }> => {
    if (!isStripeConfigured() || !stripe) {
      return { success: false, error: "Stripe is not configured" };
    }

    const baseUrl = getAppBaseUrl();

    const row = await db
      .select({ stripeCustomerId: stripeCustomers.stripeCustomerId })
      .from(stripeCustomers)
      .where(eq(stripeCustomers.userId, userId))
      .limit(1);

    if (!row || row.length === 0) {
      return {
        success: false,
        error: "No Stripe customer found. Start a checkout first.",
      };
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: row[0].stripeCustomerId,
      return_url: `${baseUrl}/app/settings`,
    });

    return { success: true, url: session.url };
  }
);


