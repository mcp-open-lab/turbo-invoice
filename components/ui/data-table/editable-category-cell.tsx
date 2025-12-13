"use client";

import { CategoryAssigner } from "@/components/categorization/category-assigner";
import { CategoryComboboxDisplay } from "@/components/ui/category-combobox";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  transactionType: string;
}

interface EditableCategoryCellProps {
  isEditing: boolean;
  value: string;
  displayValue?: string;
  onChange: (value: string) => void;
  categories: Category[];
  transactionType?: "income" | "expense";
  className?: string;
  size?: "sm" | "default";
  merchantName?: string | null;
  applyToFuture?: boolean;
  onApplyToFutureChange?: (value: boolean) => void;
}

export function EditableCategoryCell({
  isEditing,
  value,
  displayValue,
  onChange,
  categories,
  transactionType,
  className,
  size = "default",
  merchantName,
  applyToFuture,
  onApplyToFutureChange,
}: EditableCategoryCellProps) {
  if (isEditing) {
    return (
      <CategoryAssigner
        value={value}
        displayValue={displayValue}
        onChange={onChange}
        categories={categories}
        transactionType={transactionType}
        size={size}
        className={className}
        merchantName={merchantName}
        applyToFuture={applyToFuture}
        onApplyToFutureChange={onApplyToFutureChange}
      />
    );
  }

  return (
    <CategoryComboboxDisplay
      displayValue={displayValue}
      className={className}
    />
  );
}
