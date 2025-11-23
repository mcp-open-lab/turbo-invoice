import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserCategories } from "@/app/actions/financial-categories";
import { PageHeader } from "@/components/page-header";
import { CategoriesManager } from "./_components/categories-manager";

export default async function CategoriesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const categories = await getUserCategories();

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-8">
      <PageHeader title="Financial Categories" backHref="/app/settings" />
      <p className="text-sm text-muted-foreground">
        Manage your income and expense categories for transaction classification.
      </p>
      <CategoriesManager categories={categories} />
    </div>
  );
}

