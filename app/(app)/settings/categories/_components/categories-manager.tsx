"use client";

import { useCategories } from "@/lib/hooks/use-categories";
import { CategoriesSection } from "@/components/financial-categories/categories-section";
import type { categories } from "@/lib/db/schema";

type Category = typeof categories.$inferSelect;

type CategoriesManagerProps = {
  categories: Category[];
};

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const hook = useCategories({ categories });

  return (
    <div className="space-y-6">
      <CategoriesSection
        systemCategories={hook.systemCategories}
        userCategories={hook.userCategories}
        isPending={hook.isPending}
        newCategoryName={hook.newCategoryName}
        setNewCategoryName={hook.setNewCategoryName}
        newCategoryTransactionType={hook.newCategoryTransactionType}
        setNewCategoryTransactionType={hook.setNewCategoryTransactionType}
        newCategoryUsageScope={hook.newCategoryUsageScope}
        setNewCategoryUsageScope={hook.setNewCategoryUsageScope}
        newCategoryDescription={hook.newCategoryDescription}
        setNewCategoryDescription={hook.setNewCategoryDescription}
        categoryDialogOpen={hook.categoryDialogOpen}
        setCategoryDialogOpen={hook.setCategoryDialogOpen}
        handleCreateCategory={hook.handleCreateCategory}
        handleDeleteCategory={hook.handleDeleteCategory}
      />
    </div>
  );
}

