import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import {
  createUserCategory,
  deleteUserCategory,
  createCategoryRule,
  updateCategoryRule,
  deleteCategoryRule,
  createMerchantRule,
  updateMerchantRule,
} from "@/app/actions/financial-categories";
import type { MerchantStats } from "@/lib/categorization/repositories/transaction-repository";
import type { categoryRules } from "@/lib/db/schema";
import type { categories, categoryRules } from "@/lib/db/schema";
import type { MerchantStats } from "@/lib/categorization/repositories/transaction-repository";

type Category = typeof categories.$inferSelect;
type CategoryRule = typeof categoryRules.$inferSelect;

type UseCategoriesManagerProps = {
  categories: Category[];
  rules: Array<{ rule: CategoryRule; category: Category }>;
  merchantStats?: MerchantStats[];
};

export function useFinancialCategories({
  categories,
  rules,
  merchantStats = [],
}: UseCategoriesManagerProps) {
  const [isPending, startTransition] = useTransition();

  // Category state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryTransactionType, setNewCategoryTransactionType] = useState<"income" | "expense">("expense");
  const [newCategoryUsageScope, setNewCategoryUsageScope] = useState<"personal" | "business" | "both">("both");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  // Rule state
  const [newRuleCategoryId, setNewRuleCategoryId] = useState("");
  const [newRuleField, setNewRuleField] = useState<
    "merchantName" | "description"
  >("merchantName");
  const [newRuleMatchType, setNewRuleMatchType] = useState<
    "exact" | "contains" | "regex"
  >("contains");
  const [newRuleValue, setNewRuleValue] = useState("");
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editRuleDialogOpen, setEditRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<
    typeof categoryRules.$inferSelect | null
  >(null);

  // Merchant rule state
  const [newMerchantName, setNewMerchantName] = useState("");
  const [newMerchantCategoryId, setNewMerchantCategoryId] = useState("");
  const [newMerchantDisplayName, setNewMerchantDisplayName] = useState("");
  const [merchantDialogOpen, setMerchantDialogOpen] = useState(false);
  const [editMerchantDialogOpen, setEditMerchantDialogOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<MerchantStats | null>(null);

  // Computed values
  const systemCategories = useMemo(
    () => categories.filter((c) => c.type === "system"),
    [categories]
  );

  const userCategories = useMemo(
    () => categories.filter((c) => c.type === "user"),
    [categories]
  );

  // Category handlers
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    startTransition(async () => {
      try {
        await createUserCategory({
          name: newCategoryName.trim(),
          transactionType: newCategoryTransactionType,
          usageScope: newCategoryUsageScope,
          description: newCategoryDescription.trim() || undefined,
        });
        toast.success("Category created!");
        setNewCategoryName("");
        setNewCategoryTransactionType("expense");
        setNewCategoryUsageScope("both");
        setNewCategoryDescription("");
        setCategoryDialogOpen(false);
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create category"
        );
      }
    });
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    if (!confirm(`Delete "${categoryName}"? This cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteUserCategory({ categoryId });
        toast.success("Category deleted");
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete category"
        );
      }
    });
  };

  // Rule handlers
  const handleCreateRule = () => {
    if (!newRuleCategoryId || !newRuleValue.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    startTransition(async () => {
      try {
        await createCategoryRule({
          categoryId: newRuleCategoryId,
          matchType: newRuleMatchType,
          field: newRuleField,
          value: newRuleValue.trim(),
        });
        toast.success("Rule created!");
        setNewRuleValue("");
        setRuleDialogOpen(false);
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create rule"
        );
      }
    });
  };

  const handleEditRule = (rule: typeof categoryRules.$inferSelect) => {
    setEditingRule(rule);
    setNewRuleCategoryId(rule.categoryId);
    setNewRuleField(rule.field as "merchantName" | "description");
    setNewRuleMatchType(rule.matchType as "exact" | "contains" | "regex");
    setNewRuleValue(rule.value);
    setEditRuleDialogOpen(true);
  };

  const handleUpdateRule = () => {
    if (!editingRule || !newRuleCategoryId || !newRuleValue.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    startTransition(async () => {
      try {
        await updateCategoryRule({
          ruleId: editingRule.id,
          categoryId: newRuleCategoryId,
          matchType: newRuleMatchType,
          field: newRuleField,
          value: newRuleValue.trim(),
        });
        toast.success("Rule updated!");
        setEditRuleDialogOpen(false);
        setEditingRule(null);
        setNewRuleValue("");
        setNewRuleCategoryId("");
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update rule"
        );
      }
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    if (
      !confirm(
        "Delete this rule?\n\n" +
          "⚠️ Future transactions matching this pattern will no longer be auto-categorized.\n" +
          "Existing transactions keep their current category.\n\n" +
          "This cannot be undone."
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteCategoryRule({ ruleId });
        toast.success("Rule deleted");
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete rule"
        );
      }
    });
  };

  // Merchant rule handlers
  const handleCreateMerchantRule = () => {
    if (!newMerchantCategoryId || !newMerchantName.trim()) {
      toast.error("Please fill merchant name and category");
      return;
    }

    startTransition(async () => {
      try {
        await createMerchantRule({
          merchantName: newMerchantName.trim(),
          categoryId: newMerchantCategoryId,
          displayName: newMerchantDisplayName.trim() || undefined,
        });
        toast.success("Merchant rule created!");
        setNewMerchantName("");
        setNewMerchantCategoryId("");
        setNewMerchantDisplayName("");
        setMerchantDialogOpen(false);
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create merchant rule"
        );
      }
    });
  };

  const handleQuickCreateRule = (merchantName: string, categoryId: string) => {
    startTransition(async () => {
      try {
        await createMerchantRule({
          merchantName,
          categoryId,
        });
        toast.success("Merchant rule created!");
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create merchant rule"
        );
      }
    });
  };

  const handleEditMerchantRule = (merchant: MerchantStats) => {
    setEditingMerchant(merchant);
    setNewMerchantCategoryId(merchant.ruleCategoryId || "");
    setNewMerchantDisplayName(merchant.ruleDisplayName || "");
    setEditMerchantDialogOpen(true);
  };

  const handleUpdateMerchantRule = () => {
    if (!editingMerchant?.ruleId || !newMerchantCategoryId) {
      toast.error("Please select a category");
      return;
    }

    startTransition(async () => {
      try {
        await updateMerchantRule({
          ruleId: editingMerchant.ruleId!,
          categoryId: newMerchantCategoryId,
          displayName: newMerchantDisplayName.trim() || undefined,
        });
        toast.success("Merchant rule updated!");
        setEditMerchantDialogOpen(false);
        setEditingMerchant(null);
        setNewMerchantCategoryId("");
        setNewMerchantDisplayName("");
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update merchant rule"
        );
      }
    });
  };

  const handleDeleteMerchantRule = (ruleId: string) => {
    if (!confirm("Delete this merchant rule? This cannot be undone.")) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteCategoryRule({ ruleId });
        toast.success("Merchant rule deleted");
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete merchant rule"
        );
      }
    });
  };

  // Helper for rule placeholder text
  const getRulePlaceholder = () => {
    switch (newRuleMatchType) {
      case "contains":
        return "e.g., Starbucks";
      case "exact":
        return "e.g., STARBUCKS COFFEE";
      case "regex":
        return "e.g., ^STARBUCKS.*";
      default:
        return "";
    }
  };

  return {
    // State
    isPending,
    systemCategories,
    userCategories,
    rules,
    categories,
    merchantStats,

    // Category state
    newCategoryName,
    setNewCategoryName,
    newCategoryTransactionType,
    setNewCategoryTransactionType,
    newCategoryUsageScope,
    setNewCategoryUsageScope,
    newCategoryDescription,
    setNewCategoryDescription,
    categoryDialogOpen,
    setCategoryDialogOpen,

    // Rule state
    newRuleCategoryId,
    setNewRuleCategoryId,
    newRuleField,
    setNewRuleField,
    newRuleMatchType,
    setNewRuleMatchType,
    newRuleValue,
    setNewRuleValue,
    ruleDialogOpen,
    setRuleDialogOpen,

    // Merchant rule state
    newMerchantName,
    setNewMerchantName,
    newMerchantCategoryId,
    setNewMerchantCategoryId,
    newMerchantDisplayName,
    setNewMerchantDisplayName,
    merchantDialogOpen,
    setMerchantDialogOpen,
    editMerchantDialogOpen,
    setEditMerchantDialogOpen,
    editingMerchant,
    setEditingMerchant,

    // Handlers
    handleCreateCategory,
    handleDeleteCategory,
    handleCreateRule,
    handleDeleteRule,
    handleCreateMerchantRule,
    handleQuickCreateRule,
    handleEditMerchantRule,
    handleUpdateMerchantRule,
    handleDeleteMerchantRule,

    // Helpers
    getRulePlaceholder,
  };
}

