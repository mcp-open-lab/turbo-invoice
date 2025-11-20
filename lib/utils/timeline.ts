import type { receipts } from "@/lib/db/schema";

type Receipt = typeof receipts.$inferSelect;

export type TimelineGroup = {
  monthKey: string;
  monthLabel: string;
  items: Receipt[];
};

export type SortBy = "receipt_date" | "created_at";

export function groupItemsByMonth(
  receipts: Receipt[],
  sortBy: SortBy = "receipt_date"
): TimelineGroup[] {
  const groups = receipts.reduce((acc, receipt) => {
    const date =
      sortBy === "receipt_date" && receipt.date
        ? new Date(receipt.date)
        : new Date(receipt.createdAt);
    const monthKey = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });

    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(receipt);
    return acc;
  }, {} as Record<string, Receipt[]>);

  return Object.entries(groups)
    .map(([monthKey, receipts]) => ({
      monthKey,
      monthLabel: monthKey,
      items: receipts.sort((a, b) => {
        const dateA =
          sortBy === "receipt_date" && a.date
            ? new Date(a.date)
            : new Date(a.createdAt);
        const dateB =
          sortBy === "receipt_date" && b.date
            ? new Date(b.date)
            : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      }),
    }))
    .sort((a, b) => {
      const dateA = new Date(a.monthKey);
      const dateB = new Date(b.monthKey);
      return dateB.getTime() - dateA.getTime();
    });
}
