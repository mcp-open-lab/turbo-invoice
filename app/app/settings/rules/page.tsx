import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getUserCategories,
  getUserRules,
  getMerchantStatistics,
} from "@/app/actions/financial-categories";
import { getUserBusinesses } from "@/app/actions/businesses";
import { PageHeader } from "@/components/page-header";
import { RulesManager } from "./_components/rules-manager";

export default async function RulesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const [categories, rules, merchantStats, businesses] = await Promise.all([
    getUserCategories(),
    getUserRules(),
    getMerchantStatistics(),
    getUserBusinesses(),
  ]);

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-8">
      <PageHeader title="Auto-Categorization Rules" backHref="/app/settings" />
      <p className="text-sm text-muted-foreground">
        Create rules to automatically categorize transactions based on merchant
        names or descriptions.
      </p>
      <RulesManager
        categories={categories}
        rules={rules}
        merchantStats={merchantStats}
        businesses={businesses}
      />
    </div>
  );
}

