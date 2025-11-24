"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { updateBankTransaction } from "@/app/actions/update-bank-transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { SimilarTransactionsPanel } from "@/components/transactions/similar-transactions-panel";
import { CreateRuleDialog } from "@/components/transactions/create-rule-dialog";
import { TransactionCategorization } from "@/components/transactions/transaction-categorization";

import type { categories, businesses as businessesSchema } from "@/lib/db/schema";

type Category = typeof categories.$inferSelect;
type Business = typeof businessesSchema.$inferSelect;

const bankTransactionSchema = z.object({
  id: z.string(),
  merchantName: z.string().optional(),
  categoryId: z.string().optional(),
  businessId: z.string().optional().nullable(),
  paymentMethod: z.enum(["cash", "card", "check", "other"]).optional(),
  notes: z.string().optional(),
});

type BankTransactionFormValues = z.infer<typeof bankTransactionSchema>;

type BankTransaction = {
  id: string;
  merchantName: string | null;
  categoryId: string | null;
  businessId: string | null;
  paymentMethod: string | null;
};

type BankTransactionFormProps = {
  transaction: BankTransaction;
  categories: Category[];
  businesses: Business[];
  currency?: string;
  transactionType: "income" | "expense";
  userSettings?: {
    country?: string | null;
    usageType?: string | null;
  } | null;
};

export function BankTransactionForm({
  transaction,
  categories,
  businesses,
  currency = "USD",
  transactionType,
  userSettings,
}: BankTransactionFormProps) {
  const [isPending, startTransition] = useTransition();
  const [createRuleOpen, setCreateRuleOpen] = useState(false);
  const [ruleSuggestedCategory, setRuleSuggestedCategory] = useState<string>("");
  const [ruleSuggestedBusiness, setRuleSuggestedBusiness] = useState<string | null>(null);

  const form = useForm<BankTransactionFormValues>({
    resolver: zodResolver(bankTransactionSchema),
    defaultValues: {
      id: transaction.id,
      merchantName: transaction.merchantName ?? "",
      categoryId: transaction.categoryId ?? "",
      businessId: transaction.businessId ?? null,
      paymentMethod: (transaction.paymentMethod as "cash" | "card" | "check" | "other") || undefined,
      notes: "",
    },
  });

  const onSubmit = (data: BankTransactionFormValues) => {
    startTransition(async () => {
      try {
        await updateBankTransaction(data);
        toast.success("Transaction updated");
      } catch (error) {
        console.error("Update failed", error);
        toast.error("Failed to update transaction");
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="merchantName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Merchant / Payee</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter merchant name"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <TransactionCategorization
          form={form}
          categories={categories}
          businesses={businesses}
          transactionType={transactionType}
          onCreateRule={handleOpenCreateRule}
        />

        {/* Similar Transactions Panel */}
        <SimilarTransactionsPanel
          merchantName={form.watch("merchantName") || ""}
          transactionId={transaction.id}
          entityType="bank_transaction"
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
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes"
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
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

