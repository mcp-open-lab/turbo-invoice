"use client";

import { useTransition } from "react";
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

const bankTransactionSchema = z.object({
  id: z.string(),
  merchantName: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
});

type BankTransactionFormValues = z.infer<typeof bankTransactionSchema>;

type BankTransaction = {
  id: string;
  merchantName: string | null;
  category: string | null;
};

type BankTransactionFormProps = {
  transaction: BankTransaction;
  transactionType: "income" | "expense";
  userSettings?: {
    country?: string | null;
    usageType?: string | null;
  } | null;
};

// Simplified category lists (will be replaced with CategoryFilterService later)
const INCOME_CATEGORIES = [
  "Salary & Wages",
  "Freelance Income",
  "Investment Income",
  "Interest Income",
  "Refunds & Reimbursements",
  "Other Income",
];

const EXPENSE_CATEGORIES = [
  "Groceries",
  "Housing & Rent",
  "Transportation",
  "Healthcare & Medical",
  "Entertainment",
  "Food & Dining",
  "Shopping & Retail",
  "Utilities",
  "Software & Subscriptions",
  "Business Travel",
  "Office Supplies",
  "Other Expense",
];

export function BankTransactionForm({
  transaction,
  transactionType,
  userSettings,
}: BankTransactionFormProps) {
  const [isPending, startTransition] = useTransition();

  const availableCategories =
    transactionType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const form = useForm<BankTransactionFormValues>({
    resolver: zodResolver(bankTransactionSchema),
    defaultValues: {
      id: transaction.id,
      merchantName: transaction.merchantName ?? "",
      category: transaction.category ?? "",
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

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
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
    </Form>
  );
}

