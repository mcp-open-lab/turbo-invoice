import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TopMerchant } from "@/app/actions/analytics";

interface TopMerchantsListProps {
  data: TopMerchant[];
  currency?: string;
}

export function TopMerchantsList({
  data,
  currency = "USD",
}: TopMerchantsListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Merchants</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No merchant data available yet
            </p>
          ) : (
            data.map((merchant, index) => (
              <div
                key={merchant.merchantName}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-medium capitalize truncate">
                      {merchant.merchantName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {merchant.count} transaction{merchant.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {merchant.categoryName && (
                    <Badge variant="secondary" className="hidden md:flex">
                      {merchant.categoryName}
                    </Badge>
                  )}
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {formatCurrency(merchant.totalSpent)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

