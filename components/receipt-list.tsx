'use client';

import { useState, useTransition, useEffect } from 'react';
import type { receipts } from '@/lib/db/schema';
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateReceipt } from "@/app/actions/update-receipt";
import { Card } from "@/components/ui/card";

type Receipt = typeof receipts.$inferSelect;

type ReceiptListProps = {
  receipts: Receipt[];
};

const categories = ['Food', 'Transport', 'Utilities', 'Supplies', 'Other'];
const statuses = ['needs_review', 'approved'];

export function ReceiptList({ receipts }: ReceiptListProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Receipt | null>(null);
  const [formState, setFormState] = useState({
    merchantName: '',
    date: '',
    totalAmount: '',
    category: '',
    status: 'needs_review',
  });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (selected) {
      setFormState({
        merchantName: selected.merchantName ?? '',
        date: selected.date ? new Date(selected.date).toISOString().split('T')[0] : '',
        totalAmount: selected.totalAmount ?? '',
        category: selected.category ?? '',
        status: selected.status ?? 'needs_review',
      });
    }
  }, [selected]);

  const handleSave = () => {
    if (!selected) return;
    startTransition(async () => {
      try {
        await updateReceipt({
          id: selected.id,
          merchantName: formState.merchantName || null,
          date: formState.date || null,
          totalAmount: formState.totalAmount || null,
          category: formState.category || null,
          status: formState.status,
        });
        toast.success('Receipt updated');
        setOpen(false);
      } catch (error) {
        console.error('Update failed', error);
        toast.error('Failed to update receipt');
      }
    });
  };

  return (
    <>
      <div className="grid gap-4">
        {receipts.map((receipt) => (
          <Card
            key={receipt.id}
            className="p-4 flex justify-between items-center cursor-pointer hover:border-primary"
            onClick={() => {
              setSelected(receipt);
              setOpen(true);
            }}
          >
            <div>
              <p className="font-semibold">{receipt.merchantName || 'Unknown Vendor'}</p>
              <p className="text-sm text-gray-500">
                {receipt.date ? new Date(receipt.date).toLocaleDateString() : 'No Date'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold">${receipt.totalAmount || '0.00'}</p>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                {receipt.status}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(value) => {
        setOpen(value);
        if (!value) setSelected(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Receipt</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <div>
                <div className="relative w-full h-80 rounded-lg overflow-hidden border bg-muted">
                  <Image
                    src={selected.imageUrl}
                    alt={selected.merchantName ?? "Receipt image"}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain"
                    priority
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 break-all">
                  {selected.fileName || "Uploaded image"}
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Merchant</label>
                  <Input
                    value={formState.merchantName}
                    onChange={(e) => setFormState((prev) => ({ ...prev, merchantName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={formState.date}
                    onChange={(e) => setFormState((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Total Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formState.totalAmount}
                    onChange={(e) => setFormState((prev) => ({ ...prev, totalAmount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={formState.category}
                    onChange={(e) => setFormState((prev) => ({ ...prev, category: e.target.value }))}
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
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={formState.status}
                    onChange={(e) => setFormState((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isPending}>
                    {isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

