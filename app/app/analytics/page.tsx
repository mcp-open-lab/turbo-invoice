import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAnalyticsData } from "@/app/actions/analytics";
import { getUserSettings } from "@/app/actions/user-settings";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/page-header";
import { MetricCards } from "@/components/analytics/metric-cards";
import { SpendingTrendChart } from "@/components/analytics/spending-trend-chart";
import { CategoryPieChart } from "@/components/analytics/category-pie-chart";
import { BusinessSplitBar } from "@/components/analytics/business-split-bar";
import { TopMerchantsList } from "@/components/analytics/top-merchants-list";

export default async function AnalyticsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Get user settings for currency
  const settings = await getUserSettings();
  const currency = settings?.currency || "USD";

  // Fetch analytics data (defaults to last 12 months)
  const analyticsData = await getAnalyticsData();

  return (
    <PageContainer size="standard">
      <PageHeader title="Analytics" />

      <div className="space-y-6">
        {/* Summary Metrics */}
        <MetricCards
          totalSpent={analyticsData.summary.totalSpent}
          avgMonthlySpent={analyticsData.summary.avgMonthlySpent}
          topCategory={analyticsData.summary.topCategory}
          topCategoryAmount={analyticsData.summary.topCategoryAmount}
          currency={currency}
        />

        {/* Charts Grid - Compact by default, expandable to full width */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SpendingTrendChart
            data={analyticsData.spendingTrends}
            currency={currency}
          />
          <CategoryPieChart
            data={analyticsData.categoryBreakdown}
            currency={currency}
          />
          <BusinessSplitBar
            data={analyticsData.businessSplit}
            currency={currency}
          />
        </div>

        {/* Top Merchants */}
        <TopMerchantsList
          data={analyticsData.topMerchants}
          currency={currency}
        />
      </div>
    </PageContainer>
  );
}

