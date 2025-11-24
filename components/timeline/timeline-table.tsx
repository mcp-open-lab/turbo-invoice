"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MoreVertical, Edit2 } from "lucide-react";
import type { TimelineItem } from "@/lib/api/timeline";
import type { categories as categoriesSchema, businesses as businessesSchema } from "@/lib/db/schema";
import { updateReceipt } from "@/app/actions/update-receipt";
import { updateBankTransaction } from "@/app/actions/update-bank-transaction";

type Category = typeof categoriesSchema.$inferSelect;
type Business = typeof businessesSchema.$inferSelect;

interface TimelineTableProps {
  items: TimelineItem[];
  categories: Category[];
  businesses: Business[];
}

export function TimelineTable({ items, categories, businesses }: TimelineTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategoryId, setEditCategoryId] = useState<string>("");
  const [editBusinessId, setEditBusinessId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < items.length;

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(item => item.id)));
    }
  };

  const handleToggleItem = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleStartEdit = (item: TimelineItem) => {
    setEditingId(item.id);
    setEditCategoryId(item.categoryId || "");
    setEditBusinessId(item.businessId || null);
  };

  const handleSaveEdit = async (item: TimelineItem) => {
    if (!editCategoryId) {
      toast.error("Please select a category");
      return;
    }

    startTransition(async () => {
      try {
        if (item.type === "receipt") {
          await updateReceipt({
            id: item.id,
            categoryId: editCategoryId,
            businessId: editBusinessId || null,
            status: "approved",
            merchantName: item.merchantName,
            date: item.date ? format(new Date(item.date), "yyyy-MM-dd") : null,
            totalAmount: item.amount,
            taxAmount: null,
            description: null,
            paymentMethod: null,
            tipAmount: null,
            discountAmount: null,
          });
        } else {
          await updateBankTransaction({
            id: item.id,
            categoryId: editCategoryId,
            businessId: editBusinessId || null,
            merchantName: item.merchantName,
          });
        }
        
        toast.success("Updated");
        setEditingId(null);
        router.refresh();
      } catch (error) {
        console.error("Save failed:", error);
        toast.error("Failed to update");
      }
    });
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one transaction");
      return;
    }

    // For now, just show a message - can be enhanced later
    toast.info(`Bulk update for ${selectedIds.size} items - coming soon`);
  };

  const filteredCategories = (item: TimelineItem) => {
    const amount = parseFloat(item.amount);
    const isIncome = item.type === "transaction" ? amount >= 0 : false;
    return categories.filter(cat => cat.transactionType === (isIncome ? "income" : "expense"));
  };

  return (
    <div className="space-y-2">
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md border">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <Button size="sm" variant="outline" onClick={handleBulkUpdate}>
            Bulk Edit
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleToggleAll}
                  ref={(el) => {
                    if (el && el instanceof HTMLInputElement) {
                      el.indeterminate = someSelected;
                    }
                  }}
                />
              </TableHead>
              <TableHead className="min-w-[180px]">Merchant</TableHead>
              <TableHead className="w-24">Date</TableHead>
              <TableHead className="w-32 text-right">Amount</TableHead>
              <TableHead className="min-w-[150px]">Category</TableHead>
              <TableHead className="min-w-[120px]">Business</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const amount = parseFloat(item.amount);
              const isIncome = item.type === "transaction" ? amount >= 0 : false;
              const isEditing = editingId === item.id;
              const href = item.type === "transaction"
                ? `/app/transactions/${item.id}`
                : `/app/receipts/${item.id}`;

              return (
                <TableRow key={item.id} className={selectedIds.has(item.id) ? "bg-muted/50" : ""}>
                  {/* Checkbox */}
                  <TableCell className="py-1.5">
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={() => handleToggleItem(item.id)}
                    />
                  </TableCell>

                  {/* Merchant */}
                  <TableCell className="py-1.5">
                    <Link href={href} className="font-medium text-sm hover:text-primary hover:underline">
                      {item.merchantName || "Unknown"}
                    </Link>
                  </TableCell>

                  {/* Date */}
                  <TableCell className="py-1.5 text-xs text-muted-foreground">
                    {item.date ? format(new Date(item.date), "MMM d") : "N/A"}
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="py-1.5 text-right font-mono text-sm">
                    <span className={isIncome ? "text-green-600" : "text-red-600"}>
                      {isIncome ? "+" : "-"}{item.currency || "$"}{Math.abs(amount).toFixed(2)}
                    </span>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="py-1.5">
                    {isEditing ? (
                      <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredCategories(item).map((cat) => (
                            <SelectItem key={cat.id} value={cat.id} className="text-xs">
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        {item.category || "Uncategorized"}
                      </Badge>
                    )}
                  </TableCell>

                  {/* Business */}
                  <TableCell className="py-1.5">
                    {isEditing && businesses.length > 0 ? (
                      <Select
                        value={editBusinessId || "personal"}
                        onValueChange={(v) => setEditBusinessId(v === "personal" ? null : v)}
                      >
                        <SelectTrigger className="h-7 text-xs">
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
                      <span className="text-xs text-muted-foreground">
                        {item.businessName || "Personal"}
                      </span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-1.5">
                    {isEditing ? (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleSaveEdit(item)}
                          disabled={isPending || !editCategoryId}
                        >
                          ✓
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => setEditingId(null)}
                          disabled={isPending}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStartEdit(item)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={href}>
                              View Details
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

