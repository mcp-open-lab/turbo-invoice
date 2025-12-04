"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import Link from "next/link";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  EditableCategoryCell,
  EditableBusinessCell,
  TransactionAmount,
  RowActions,
} from "@/components/ui/data-table";
import { updateTransaction } from "@/lib/transactions/update";
import type { ReviewQueueItem as ReviewQueueItemType } from "@/app/actions/review-queue";
import type {
  categories as categoriesSchema,
  businesses as businessesSchema,
} from "@/lib/db/schema";

type Category = typeof categoriesSchema.$inferSelect;
type Business = typeof businessesSchema.$inferSelect;

function getReasonColor(reason: string) {
  switch (reason) {
    case "uncategorized":
      return "text-red-600 dark:text-red-400";
    case "other_category":
      return "text-amber-600 dark:text-amber-400";
    case "needs_review":
      return "text-blue-600 dark:text-blue-400";
    case "no_business":
      return "text-purple-600 dark:text-purple-400";
    default:
      return "text-muted-foreground";
  }
}

interface ReviewQueueItemProps {
  item: ReviewQueueItemType;
  categories: Category[];
  businesses: Business[];
  isSelected: boolean;
  onToggleSelect: () => void;
  onSaved: () => void;
}

export function ReviewQueueItem({
  item,
  categories,
  businesses,
  isSelected,
  onToggleSelect,
  onSaved,
}: ReviewQueueItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState(item.categoryId || "");
  const [businessId, setBusinessId] = useState<string | null>(
    item.businessId || null
  );

  const amount = parseFloat(item.amount);
  const isIncome = item.type === "bank_transaction" ? amount >= 0 : false;
  const transactionType = isIncome ? "income" : "expense";

  const handleSave = () => {
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }

    startTransition(async () => {
      const result = await updateTransaction({
        id: item.id,
        type: item.type === "receipt" ? "receipt" : "bank_transaction",
        categoryId,
        businessId,
        merchantName: item.merchantName || undefined,
      });

      if (result.success) {
        toast.success("Updated");
        setIsEditing(false);
        onSaved();
      } else {
        toast.error(result.error || "Failed to update");
      }
    });
  };

  const href = `/app/${item.type === "receipt" ? "receipts" : "transactions"}/${
    item.id
  }`;

  return (
    <TableRow className={isSelected ? "bg-muted/50" : ""}>
      <TableCell className="w-12 py-2">
        <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
      </TableCell>

      <TableCell className="py-2 max-w-[200px]">
        <Link
          href={href}
          className="font-medium hover:text-primary hover:underline underline-offset-4 truncate block"
        >
          {item.merchantName || "Unknown"}
        </Link>
        {item.description && (
          <p className="text-xs text-muted-foreground truncate">
            {item.description}
          </p>
        )}
      </TableCell>

      <TableCell className="py-2 text-right">
        <div className="flex flex-col items-end">
          <TransactionAmount
            amount={amount}
            currency={item.currency || "USD"}
          />
          <span className="text-[10px] text-muted-foreground">
            {item.currency || "USD"}
          </span>
        </div>
      </TableCell>

      <TableCell className="py-2 text-sm text-muted-foreground">
        {item.date ? format(item.date, "MMM d") : "N/A"}
      </TableCell>

      <TableCell className="py-2 min-w-[180px]">
        {isEditing ? (
          <EditableCategoryCell
            isEditing={true}
            value={categoryId}
            onChange={setCategoryId}
            categories={categories}
            transactionType={transactionType}
            size="sm"
          />
        ) : (
          <span
            className={`text-sm ${
              !item.categoryName ? getReasonColor(item.reason) : ""
            }`}
          >
            {item.categoryName || "Uncategorized"}
          </span>
        )}
      </TableCell>

      <TableCell className="py-2 min-w-[150px]">
        {isEditing ? (
          <EditableBusinessCell
            isEditing={true}
            value={businessId}
            onChange={setBusinessId}
            businesses={businesses}
            size="sm"
          />
        ) : (
          <span className="text-sm text-muted-foreground">
            {item.businessName || "Personal"}
          </span>
        )}
      </TableCell>

      <TableCell className="py-2 text-right">
        <RowActions
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          isPending={isPending}
          canSave={!!categoryId}
          size="sm"
        />
      </TableCell>
    </TableRow>
  );
}
