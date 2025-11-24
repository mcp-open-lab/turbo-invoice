"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateReceipt } from "@/app/actions/update-receipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RECEIPT_STATUSES } from "@/lib/consts";
import type { EditReceiptFormValues } from "@/lib/schemas";
import type { createEditReceiptSchema } from "@/lib/schemas";
import type { categories as categoriesSchema, businesses as businessesSchema } from "@/lib/db/schema";
import { SimilarTransactionsPanel } from "@/components/transactions/similar-transactions-panel";
import { CreateRuleDialog } from "@/components/transactions/create-rule-dialog";
import { TransactionCategorization } from "@/components/transactions/transaction-categorization";

type Category = typeof categoriesSchema.$inferSelect;
type Business = typeof businessesSchema.$inferSelect;

type ReceiptFormProps = {
  defaultValues: EditReceiptFormValues;
  schema: ReturnType<typeof createEditReceiptSchema>;
  requiredFields: Record<string, boolean>;
  visibleFields: Record<string, boolean>;
  categories: Category[];
  businesses: Business[];
  currency?: string;
  onOpenChange?: (open: boolean) => void;
  isPage?: boolean;
};

const statuses = RECEIPT_STATUSES;

export function ReceiptForm({
  defaultValues,
  schema,
  requiredFields,
  visibleFields,
  categories,
  businesses,
  currency = "USD",
  onOpenChange,
  isPage = false,
}: ReceiptFormProps) {
  const [isPending, startTransition] = useTransition();
  const [createRuleOpen, setCreateRuleOpen] = useState(false);
  const [ruleSuggestedCategory, setRuleSuggestedCategory] = useState<string>("");
  const [ruleSuggestedBusiness, setRuleSuggestedBusiness] = useState<string | null>(null);

  const form = useForm<EditReceiptFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = (data: EditReceiptFormValues) => {
    startTransition(async () => {
      try {
        await updateReceipt(data);
        toast.success("Item updated");
        if (onOpenChange) {
          onOpenChange(false);
        }
      } catch (error) {
        console.error("Update failed", error);
        toast.error("Failed to update item");
      }
    });
  };

  const handleRuleSuggestion = (categoryId: string, businessId: string | null) => {
    setRuleSuggestedCategory(categoryId);
    setRuleSuggestedBusiness(businessId);
    form.setValue("categoryId", categoryId);
    setCreateRuleOpen(true);
  };

  const handleOpenCreateRule = () => {
    const currentMerchant = form.getValues("merchantName");
    const currentCategory = form.getValues("categoryId");
    if (!currentMerchant || !currentCategory) {
      toast.error("Please enter a merchant name and select a category first");
      return;
    }
    setRuleSuggestedCategory(currentCategory);
    setRuleSuggestedBusiness(null);
    setCreateRuleOpen(true);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-3 md:space-y-4"
      >
        <FormField
          control={form.control}
          name="merchantName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Merchant
                {requiredFields.merchantName && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Date
                {requiredFields.date && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="totalAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Total Amount
                {requiredFields.totalAmount && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="taxAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Tax Amount
                {requiredFields.taxAmount && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Optional"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {visibleFields.description !== false && (
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Description
                  {requiredFields.description && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Optional"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {visibleFields.paymentMethod !== false && (
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Payment Method
                  {requiredFields.paymentMethod && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {visibleFields.tipAmount !== false && (
          <FormField
            control={form.control}
            name="tipAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Tip Amount
                  {requiredFields.tipAmount && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Optional"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {visibleFields.discountAmount !== false && (
          <FormField
            control={form.control}
            name="discountAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Discount Amount
                  {requiredFields.discountAmount && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Optional"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <TransactionCategorization
          form={form}
          categories={categories}
          businesses={businesses}
          transactionType="expense"
          requiredFields={requiredFields}
          onCreateRule={handleOpenCreateRule}
        />

        {/* Similar Transactions Panel */}
        <SimilarTransactionsPanel
          merchantName={form.watch("merchantName") || null}
          transactionId={defaultValues.id}
          entityType="receipt"
          currency={currency}
          onRuleSuggestion={handleRuleSuggestion}
          onCreateRuleForTransaction={(merchantName, categoryId, businessId) => {
            if (categoryId) {
              setRuleSuggestedCategory(categoryId);
              setRuleSuggestedBusiness(businessId);
              setCreateRuleOpen(true);
            }
          }}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
          {!isPage && onOpenChange && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      {/* Create Rule Dialog */}
      <CreateRuleDialog
        open={createRuleOpen}
        onOpenChange={setCreateRuleOpen}
        merchantName={form.watch("merchantName") || ""}
        categoryId={ruleSuggestedCategory || form.watch("categoryId") || ""}
        businessId={ruleSuggestedBusiness}
        categories={categories}
        businesses={businesses}
        onRuleCreated={() => {
          toast.success("Rule created! Future transactions will be auto-categorized.");
        }}
      />
    </Form>
  );
}
