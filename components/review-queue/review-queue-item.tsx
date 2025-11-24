"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, X, ExternalLink, Edit2 } from "lucide-react";
import { format } from "date-fns";
import type { ReviewQueueItem as ReviewQueueItemType } from "@/app/actions/review-queue";
import type { categories as categoriesSchema, businesses as businessesSchema } from "@/lib/db/schema";
import { updateReceipt } from "@/app/actions/update-receipt";
import { updateBankTransaction } from "@/app/actions/update-bank-transaction";
import Link from "next/link";
import { TableCell, TableRow } from "@/components/ui/table";

type Category = typeof categoriesSchema.$inferSelect;
type Business = typeof businessesSchema.$inferSelect;

const reviewItemSchema = z.object({
  categoryId: z.string().min(1, "Category required"),
  businessId: z.string().nullable().optional(),
});

type ReviewItemFormValues = z.infer<typeof reviewItemSchema>;

function getCategoryColor(reason: string) {
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
  const [businessId, setBusinessId] = useState<string | null>(item.businessId || null);
  
  const amount = parseFloat(item.amount);
  // For bank transactions, negative = expense, positive = income
  // For receipts, they're almost always expenses (positive amounts)
  const isIncome = item.type === "bank_transaction" ? amount >= 0 : false;
  const transactionType = isIncome ? "income" : "expense";

  // Filter categories based on transaction type
  const filteredCategories = categories.filter(
    (cat) => cat.transactionType === transactionType
  );

  const handleQuickSave = () => {
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }

    startTransition(async () => {
      try {
        if (item.type === "receipt") {
          await updateReceipt({
            id: item.id,
            categoryId: categoryId,
            businessId: businessId || null,
            status: "approved",
            merchantName: item.merchantName,
            date: item.date ? format(item.date, "yyyy-MM-dd") : null,
            totalAmount: item.amount,
            taxAmount: null,
            description: item.description,
            paymentMethod: null,
            tipAmount: null,
            discountAmount: null,
          });
        } else {
          await updateBankTransaction({
            id: item.id,
            categoryId: categoryId,
            businessId: businessId || null,
            merchantName: item.merchantName,
          });
        }
        
        toast.success("Updated");
        setIsEditing(false);
        onSaved();
      } catch (error) {
        console.error("Save failed:", error);
        toast.error("Failed to update");
      }
    });
  };

  return (
    <TableRow className={isSelected ? "bg-muted/50" : ""}>
      {/* Checkbox */}
      <TableCell className="w-12 py-2">
        <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
      </TableCell>

      {/* Merchant */}
      <TableCell className="py-2 max-w-[200px]">
        <Link
          href={`/app/${item.type === "receipt" ? "receipts" : "transactions"}/${item.id}`}
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

      {/* Amount */}
      <TableCell className="py-2 text-right font-mono">
        <div className="flex flex-col items-end">
          <span className={isIncome ? "text-green-600" : "text-red-600"}>
            {isIncome ? "+" : "-"}{Math.abs(amount).toFixed(2)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {item.currency || "USD"}
          </span>
        </div>
      </TableCell>

      {/* Date */}
      <TableCell className="py-2 text-sm text-muted-foreground">
        {item.date ? format(item.date, "MMM d") : "N/A"}
      </TableCell>

      {/* Category */}
      <TableCell className="py-2 min-w-[180px]">
        {isEditing ? (
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="text-xs">
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className={`text-sm ${!item.categoryName ? getCategoryColor(item.reason) : ""}`}>
            {item.categoryName || "Uncategorized"}
          </span>
        )}
      </TableCell>

      {/* Business */}
      <TableCell className="py-2 min-w-[150px]">
        {isEditing && businesses.length > 0 ? (
          <Select value={businessId || "personal"} onValueChange={(v) => setBusinessId(v === "personal" ? null : v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal" className="text-xs">Personal</SelectItem>
              {businesses.map((b) => (
                <SelectItem key={b.id} value={b.id} className="text-xs">
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm text-muted-foreground">
            {item.businessName || "Personal"}
          </span>
        )}
      </TableCell>

      {/* Actions */}
      <TableCell className="py-2 text-right">
        {isEditing ? (
          <div className="flex gap-1 justify-end">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleQuickSave}
              disabled={isPending || !categoryId}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setIsEditing(false)}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

