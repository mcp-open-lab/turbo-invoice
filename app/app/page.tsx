import { db } from "@/lib/db";
import { receipts } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { ReceiptUploader } from "@/components/receipt-upload";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { ReceiptList } from "@/components/receipt-list";
import { AddToHomeScreenButton } from "@/components/add-to-home";
import { MobileCameraButton } from "@/components/mobile-camera-button";

export default async function Dashboard() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const data = await db
    .select()
    .from(receipts)
    .where(eq(receipts.userId, userId))
    .orderBy(desc(receipts.createdAt));

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Receipt Scanner</h1>
        <UserButton />
      </div>

      <div className="flex mb-4">
        <AddToHomeScreenButton />
      </div>

      <ReceiptUploader />

      <ReceiptList receipts={data} />
      <MobileCameraButton />
    </div>
  );
}
