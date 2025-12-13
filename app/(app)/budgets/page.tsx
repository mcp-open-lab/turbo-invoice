import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layouts/page-container";
import { hasModuleAccess } from "@/lib/modules/feature-gate";
import {
  getBudgetOverview,
  getLatestTransactionMonth,
} from "@/app/actions/budgets";
import { getUserSettings } from "@/app/actions/user-settings";
import { getUserCategories } from "@/app/actions/financial-categories";
import { getUserBusinesses } from "@/app/actions/businesses";
import { BudgetPageClient } from "@/components/budgets/budget-page-client";

interface BudgetsPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const canUseBudgets = await hasModuleAccess(userId, "budgets");
  if (!canUseBudgets) {
    return (
      <PageContainer size="standard">
        <div className="rounded-md border bg-muted/30 p-4">
          <h2 className="text-base font-semibold">
            Budgeting is a paid module
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upgrade to enable budgets and spending insights.
          </p>
        </div>
      </PageContainer>
    );
  }

  const params = await searchParams;

  // Default to latest month with transactions, or current month if none
  let month = params.month;
  if (!month) {
    const latestMonth = await getLatestTransactionMonth();
    month = latestMonth || new Date().toISOString().slice(0, 7);
  }

  const [budgetResult, settings, categoriesResult, businessesResult] =
    await Promise.all([
      getBudgetOverview(month),
      getUserSettings(),
      getUserCategories(),
      getUserBusinesses(),
    ]);

  if (!budgetResult.success || !budgetResult.data) {
    return (
      <PageContainer size="standard">
        <p className="text-destructive">
          Failed to load budget data: {budgetResult.error}
        </p>
      </PageContainer>
    );
  }

  const currency = settings?.currency || "USD";
  const categories = categoriesResult ?? [];
  const businesses = businessesResult ?? [];

  return (
    <PageContainer size="standard">
      <BudgetPageClient
        initialData={budgetResult.data}
        currency={currency}
        categories={categories}
        businesses={businesses}
      />
    </PageContainer>
  );
}
