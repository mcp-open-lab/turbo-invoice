import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, isStripeConfigured } from "@/lib/stripe/client";
import {
  syncEntitlementsFromSubscription,
  upsertStripeCustomerMapping,
} from "@/lib/stripe/sync";

export async function POST(req: Request) {
  if (!isStripeConfigured() || !stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not set" },
      { status: 500 }
    );
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          (session.client_reference_id as string | null) ||
          (session.metadata?.userId as string | undefined);
        if (!userId || !session.customer) break;

        await upsertStripeCustomerMapping({
          userId,
          stripeCustomerId: String(session.customer),
          stripeSubscriptionId: session.subscription
            ? String(session.subscription)
            : null,
          subscriptionStatus: "active",
        });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId as string | undefined;
        if (!userId) break;

        await upsertStripeCustomerMapping({
          userId,
          stripeCustomerId: String(subscription.customer),
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
        });

        await syncEntitlementsFromSubscription({ userId, subscription });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId as string | undefined;
        if (!userId) break;

        await upsertStripeCustomerMapping({
          userId,
          stripeCustomerId: String(subscription.customer),
          stripeSubscriptionId: null,
          subscriptionStatus: subscription.status,
        });

        await syncEntitlementsFromSubscription({ userId, subscription });
        break;
      }

      case "invoice.payment_failed": {
        // Phase 3: grace-period handling would go here.
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook handler failed" },
      { status: 500 }
    );
  }
}


