"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryAssigner } from "@/components/categorization/category-assigner";
import { Check, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  transactionType: string;
}

interface Business {
  id: string;
  name: string;
}

interface BulkActionsBarProps {
  selectedCount: number;
  categories: Category[];
  businesses: Business[];
  onBulkUpdate: (
    categoryId: string,
    businessId: string | null
  ) => Promise<void>;
  onClear: () => void;
  isPending?: boolean;
  className?: string;
  transactionType?: "income" | "expense";
}

export function BulkActionsBar({
  selectedCount,
  categories,
  businesses,
  onBulkUpdate,
  onClear,
  isPending = false,
  className,
  transactionType,
}: BulkActionsBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [businessId, setBusinessId] = useState<string | null>(null);

  const handleApply = async () => {
    if (!categoryId) return;
    await onBulkUpdate(categoryId, businessId);
    setIsOpen(false);
    setCategoryId("");
    setBusinessId(null);
  };

  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 bg-muted/50 rounded-md border",
        className
      )}
    >
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Bulk Edit
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-3">
                  Edit {selectedCount} Transaction
                  {selectedCount !== 1 ? "s" : ""}
                </h4>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Category</label>
                <CategoryAssigner
                  value={categoryId}
                  onChange={setCategoryId}
                  categories={categories}
                  transactionType={transactionType}
                  size="default"
                  showApplyToFuture={false}
                  disabled={isPending}
                />
              </div>

              {businesses.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    Business (Optional)
                  </label>
                  <Select
                    value={businessId || "personal"}
                    onValueChange={(v) =>
                      setBusinessId(v === "personal" ? null : v)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      {businesses.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={isPending || !categoryId}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-1" />
                  {isPending ? "Updating..." : "Apply"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button size="sm" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
