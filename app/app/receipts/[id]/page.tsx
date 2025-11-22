import { db } from "@/lib/db";
import { receipts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ReceiptDetailView } from "@/components/receipts/receipt-detail-view";
import { getUserSettings } from "@/app/actions/user-settings";

export default async function ReceiptDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch the receipt
  const receipt = await db
    .select()
    .from(receipts)
    .where(and(eq(receipts.id, params.id), eq(receipts.userId, userId)))
    .limit(1);

  if (!receipt || receipt.length === 0) {
    notFound();
  }

  const userSettings = await getUserSettings();

  return (
    <div className="space-y-6">
      <PageHeader title="Receipt Details" backHref="/app" />
      <ReceiptDetailView receipt={receipt[0]} userSettings={userSettings} />
    </div>
  );
}

