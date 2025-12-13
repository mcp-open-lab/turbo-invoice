import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/layouts/page-container";
import { hasModuleAccess } from "@/lib/modules/feature-gate";

export default async function InvoicesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const canUseInvoices = await hasModuleAccess(userId, "invoices");
  if (!canUseInvoices) {
    return (
      <PageContainer size="standard">
        <div className="rounded-md border bg-muted/30 p-4">
          <h2 className="text-base font-semibold">Invoices is a paid module</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upgrade to enable invoice creation and management.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="standard">
      <p className="text-muted-foreground">
        Invoice management is coming soon.
      </p>
    </PageContainer>
  );
}
