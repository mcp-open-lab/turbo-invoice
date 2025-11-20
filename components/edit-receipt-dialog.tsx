"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateReceipt } from "@/app/actions/update-receipt";
import { X } from "lucide-react";
import type { receipts } from "@/lib/db/schema";

type Receipt = typeof receipts.$inferSelect;

type UserSettings = {
  visibleFields?: Record<string, boolean> | null;
  country?: string | null;
  usageType?: string | null;
};

type EditReceiptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: Receipt | null;
  userSettings?: UserSettings | null;
};

const categories = ["Food", "Transport", "Utilities", "Supplies", "Other"];
const statuses = ["needs_review", "approved"];

export function EditReceiptDialog({
  open,
  onOpenChange,
  receipt,
  userSettings,
}: EditReceiptDialogProps) {
  const [imageExpanded, setImageExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Form state
  const [formState, setFormState] = useState({
    merchantName: "",
    date: "",
    totalAmount: "",
    taxAmount: "",
    description: "",
    paymentMethod: "",
    tipAmount: "",
    discountAmount: "",
    category: "",
    status: "needs_review",
  });

  // Reset form when receipt changes
  // Using useEffect here is acceptable for resetting state based on prop change,
  // but usually key={} on the parent is cleaner. However, since the Dialog stays mounted,
  // we sync here.
  useEffect(() => {
    if (receipt) {
      setFormState({
        merchantName: receipt.merchantName ?? "",
        date: receipt.date
          ? new Date(receipt.date).toISOString().split("T")[0]
          : "",
        totalAmount: receipt.totalAmount ?? "",
        taxAmount: receipt.taxAmount ?? "",
        description: receipt.description ?? "",
        paymentMethod: receipt.paymentMethod ?? "",
        tipAmount: receipt.tipAmount ?? "",
        discountAmount: receipt.discountAmount ?? "",
        category: receipt.category ?? "",
        status: receipt.status ?? "needs_review",
      });
    }
  }, [receipt]);

  const handleSave = () => {
    if (!receipt) return;
    startTransition(async () => {
      try {
        await updateReceipt({
          id: receipt.id,
          merchantName: formState.merchantName || null,
          date: formState.date || null,
          totalAmount: formState.totalAmount || null,
          taxAmount: formState.taxAmount || null,
          description: formState.description || null,
          paymentMethod: formState.paymentMethod || null,
          tipAmount: formState.tipAmount || null,
          discountAmount: formState.discountAmount || null,
          category: formState.category || null,
          status: formState.status,
        });
        toast.success("Item updated");
        onOpenChange(false);
      } catch (error) {
        console.error("Update failed", error);
        toast.error("Failed to update item");
      }
    });
  };

  const visibleFields = userSettings?.visibleFields || {};

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          onOpenChange(value);
          if (!value) setImageExpanded(false);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] w-[calc(100vw-2rem)] md:w-full overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 flex-shrink-0">
            <DialogTitle>
              {(() => {
                if (!receipt) return "Edit Item";
                if (receipt.type === "invoice") {
                  return `Edit Invoice (${
                    receipt.direction === "in" ? "Received" : "Sent"
                  })`;
                }
                return "Edit Receipt";
              })()}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Edit details for the selected financial item.
            </DialogDescription>
          </DialogHeader>
          {receipt && (
            <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4 md:pb-6">
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                {/* Image Section */}
                <div className="order-2 md:order-1">
                  <div
                    className="relative w-full h-48 md:h-80 rounded-lg overflow-hidden border bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setImageExpanded(true)}
                  >
                    <Image
                      src={receipt.imageUrl}
                      alt={receipt.merchantName ?? "Receipt image"}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain"
                      priority
                      unoptimized={receipt.imageUrl.includes(".ufs.sh")}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 break-all">
                    {receipt.fileName || "Uploaded image"}
                  </p>
                </div>

                {/* Form Section */}
                <div className="space-y-3 md:space-y-4 order-1 md:order-2">
                  <div>
                    <label className="text-sm font-medium block mb-1.5">
                      Merchant
                    </label>
                    <Input
                      value={formState.merchantName}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          merchantName: e.target.value,
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={formState.date}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">
                      Total Amount
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formState.totalAmount}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          totalAmount: e.target.value,
                        }))
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Tax Amount - Always visible as it's core */}
                  <div>
                    <label className="text-sm font-medium block mb-1.5">
                      Tax Amount
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formState.taxAmount}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          taxAmount: e.target.value,
                        }))
                      }
                      className="w-full"
                      placeholder="Optional"
                    />
                  </div>
                  
                  {/* Optional fields based on visibility settings */}
                  {visibleFields.description !== false && (
                    <div>
                      <label className="text-sm font-medium block mb-1.5">
                        Description
                      </label>
                      <Input
                        value={formState.description || ""}
                        onChange={(e) =>
                          setFormState((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="w-full"
                        placeholder="Optional"
                      />
                    </div>
                  )}
                  
                  {visibleFields.paymentMethod !== false && (
                    <div>
                      <label className="text-sm font-medium block mb-1.5">
                        Payment Method
                      </label>
                      <select
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={formState.paymentMethod || ""}
                        onChange={(e) =>
                          setFormState((prev) => ({
                            ...prev,
                            paymentMethod: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select payment method</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="check">Check</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  )}
                  
                  {visibleFields.tipAmount !== false && (
                    <div>
                      <label className="text-sm font-medium block mb-1.5">
                        Tip Amount
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formState.tipAmount || ""}
                        onChange={(e) =>
                          setFormState((prev) => ({
                            ...prev,
                            tipAmount: e.target.value,
                          }))
                        }
                        className="w-full"
                        placeholder="Optional"
                      />
                    </div>
                  )}
                  
                  {visibleFields.discountAmount !== false && (
                    <div>
                      <label className="text-sm font-medium block mb-1.5">
                        Discount Amount
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formState.discountAmount || ""}
                        onChange={(e) =>
                          setFormState((prev) => ({
                            ...prev,
                            discountAmount: e.target.value,
                          }))
                        }
                        className="w-full"
                        placeholder="Optional"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium block mb-1.5">
                      Category
                    </label>
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      value={formState.category}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">
                      Status
                    </label>
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      value={formState.status}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isPending}
                      className="w-full sm:w-auto"
                    >
                      {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Expanded Image Overlay */}
      {imageExpanded && receipt && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setImageExpanded(false);
          }}
        >
          <div
            className="relative w-full h-full max-w-7xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={receipt.imageUrl}
              alt={receipt.merchantName ?? "Receipt image"}
              fill
              sizes="100vw"
              className="object-contain"
              priority
              unoptimized={receipt.imageUrl.includes(".ufs.sh")}
            />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setImageExpanded(false);
            }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors p-2"
            aria-label="Close expanded image"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </>
  );
}

