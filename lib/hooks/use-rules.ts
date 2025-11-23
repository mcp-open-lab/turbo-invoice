import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createCategoryRule,
  updateCategoryRule,
  deleteCategoryRule,
  createMerchantRule,
  updateMerchantRule,
} from "@/app/actions/financial-categories";
import type { categories, categoryRules } from "@/lib/db/schema";
import type { MerchantStats } from "@/lib/categorization/repositories/transaction-repository";

type Category = typeof categories.$inferSelect;
type CategoryRule = typeof categoryRules.$inferSelect;

type UseRulesProps = {
  categories: Category[];
  rules: Array<{ rule: CategoryRule; category: Category }>;
  merchantStats?: MerchantStats[];
};

export function useRules({
  categories,
  rules,
  merchantStats = [],
}: UseRulesProps) {
  const [isPending, startTransition] = useTransition();

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
  const [newMerchantBusinessId, setNewMerchantBusinessId] = useState<string | undefined>(undefined);
  const [merchantDialogOpen, setMerchantDialogOpen] = useState(false);
  const [editMerchantDialogOpen, setEditMerchantDialogOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<MerchantStats | null>(
    null
  );

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
          businessId: newMerchantBusinessId,
        });
        toast.success("Merchant rule created!");
        setNewMerchantName("");
        setNewMerchantCategoryId("");
        setNewMerchantDisplayName("");
        setNewMerchantBusinessId(undefined);
        setMerchantDialogOpen(false);
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to create merchant rule"
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
          error instanceof Error
            ? error.message
            : "Failed to create merchant rule"
        );
      }
    });
  };

  const handleEditMerchantRule = async (merchant: MerchantStats) => {
    setEditingMerchant(merchant);
    setNewMerchantCategoryId(merchant.ruleCategoryId || "");
    setNewMerchantDisplayName(merchant.ruleDisplayName || "");
    
    // Fetch the full rule to get businessId
    if (merchant.ruleId) {
      // We'll need to pass businessId through merchantStats or fetch it separately
      // For now, reset to undefined (will be improved when we pass it through)
      setNewMerchantBusinessId(undefined);
    }
    
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
          businessId: newMerchantBusinessId,
        });
        toast.success("Merchant rule updated!");
        setEditMerchantDialogOpen(false);
        setEditingMerchant(null);
        setNewMerchantCategoryId("");
        setNewMerchantDisplayName("");
        setNewMerchantBusinessId(undefined);
        window.location.reload();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update merchant rule"
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
          error instanceof Error
            ? error.message
            : "Failed to delete merchant rule"
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
    categories,
    rules,
    merchantStats,

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
    editRuleDialogOpen,
    setEditRuleDialogOpen,
    editingRule,
    setEditingRule,

    // Merchant rule state
    newMerchantName,
    setNewMerchantName,
    newMerchantCategoryId,
    setNewMerchantCategoryId,
    newMerchantDisplayName,
    setNewMerchantDisplayName,
    newMerchantBusinessId,
    setNewMerchantBusinessId,
    merchantDialogOpen,
    setMerchantDialogOpen,
    editMerchantDialogOpen,
    setEditMerchantDialogOpen,
    editingMerchant,
    setEditingMerchant,

    // Handlers
    handleCreateRule,
    handleEditRule,
    handleUpdateRule,
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

