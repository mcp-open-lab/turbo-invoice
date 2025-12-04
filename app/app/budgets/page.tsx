import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layouts/page-container";
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
