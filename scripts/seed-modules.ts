import "dotenv/config";
import { db } from "@/lib/db";
import { modules } from "@/lib/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";

const DEFAULT_MODULES = [
  {
    slug: "core",
    name: "Core",
    description: "Timeline, categorization, rules, import/export",
    stripePriceId: null,
    monthlyPrice: null,
    isActive: true,
  },
  {
    slug: "ai_import",
    name: "Manual AI Import",
    description: "AI receipt scanning and statement parsing",
    stripePriceId: null,
    monthlyPrice: null,
    isActive: true,
  },
  {
    slug: "plaid",
    name: "Plaid Connections",
    description: "Bank connections and auto-sync",
    stripePriceId: null,
    monthlyPrice: null,
    isActive: true,
  },
  {
    slug: "budgets",
    name: "Budgeting",
    description: "Budgets and spending insights",
    stripePriceId: null,
    monthlyPrice: null,
    isActive: true,
  },
  {
    slug: "invoices",
    name: "Invoices",
    description: "Invoice creation and management",
    stripePriceId: null,
    monthlyPrice: null,
    isActive: true,
  },
  {
    slug: "ai_assistant",
    name: "AI Assistant",
    description: "Assistant connected to your data",
    stripePriceId: null,
    monthlyPrice: null,
    isActive: true,
  },
] as const;

async function main() {
  for (const mod of DEFAULT_MODULES) {
    await db.execute(sql`
      INSERT INTO modules (id, slug, name, description, stripe_price_id, monthly_price, is_active, created_at, updated_at)
      VALUES (
        ${createId()},
        ${mod.slug},
        ${mod.name},
        ${mod.description},
        ${mod.stripePriceId},
        ${mod.monthlyPrice},
        ${mod.isActive},
        NOW(),
        NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        stripe_price_id = EXCLUDED.stripe_price_id,
        monthly_price = EXCLUDED.monthly_price,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    `);
  }
}

main()
  .then(() => {
    console.log("Seeded modules");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
