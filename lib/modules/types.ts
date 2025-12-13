export const MODULE_SLUGS = [
  "core",
  "ai_import",
  "plaid",
  "budgets",
  "invoices",
  "ai_assistant",
] as const;

export type ModuleSlug = (typeof MODULE_SLUGS)[number];

export type UsageMetric = "transactions" | "receipts" | "ai_calls";

export const FREE_LIMITS: Record<UsageMetric, number> = {
  transactions: 50,
  receipts: 10,
  ai_calls: 0,
};


