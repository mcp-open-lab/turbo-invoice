import { db } from "@/lib/db";
import { receipts } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { ReceiptUploader } from "@/components/receipt-upload";
import { Card } from "@/components/ui/card";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const data = await db.select().from(receipts)
    .where(eq(receipts.userId, userId))
    .orderBy(desc(receipts.createdAt));

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Receipt Scanner</h1>
        <UserButton />
      </div>

      <ReceiptUploader />

      <div className="grid gap-4">
        {data.map((receipt) => (
          <Card key={receipt.id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold">{receipt.merchantName || "Unknown Vendor"}</p>
              <p className="text-sm text-gray-500">
                {receipt.date ? new Date(receipt.date).toLocaleDateString() : "No Date"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold">${receipt.totalAmount || "0.00"}</p>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                {receipt.status}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

