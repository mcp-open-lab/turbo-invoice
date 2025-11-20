Here is your **Final Setup Outline**. This plan implements the **"True MVP"** strategy:
*   **Stack:** Next.js 16, Drizzle, Vercel Postgres, Clerk, UploadThing.
*   **Change:** We are **dropping OCR.space** and sending images directly to **Gemini 2.0 Flash** (Multimodal) to simplify the pipeline.
*   **Goal:** A single page where you upload a receipt, Gemini extracts data, and you save it to the DB.

***

### **Phase 0: Project & Infrastructure**

#### **1. Initialize Project**
Run this in your terminal to set up the framework and install all libraries at once.

```bash
# 1. Create Next.js App
npx create-next-app@latest receipt-scanner --typescript --tailwind --app --eslint
cd receipt-scanner

# 2. Install Dependencies
# Auth & Database
npm install @clerk/nextjs drizzle-orm @vercel/postgres @paralleldrive/cuid2
npm install -D drizzle-kit dotenv-cli

# File Upload & AI
npm install uploadthing @uploadthing/react @google/generative-ai

# UI & Forms
npm install lucide-react date-fns clsx tailwind-merge
npm install react-hook-form zod @hookform/resolvers
npm install sonner # Better toast notifications

# 3. Install Shadcn UI (The basics)
npx shadcn@latest init
npx shadcn@latest add button card input label table dialog scroll-area skeleton
```

#### **2. Environment Variables (`.env.local`)**
Create this file in your root. You need keys from **Vercel**, **Clerk**, **UploadThing**, and **Google AI Studio**.

```bash
# Database (Get from Vercel Storage tab)
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."

# Auth (Get from Clerk Dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Storage (Get from UploadThing Dashboard)
UPLOADTHING_SECRET=...
UPLOADTHING_APP_ID=...

# AI (Get from Google AI Studio)
GOOGLE_AI_API_KEY=...

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

***

### **Phase 1: The Backend Logic**

#### **3. Database Schema (`lib/db/schema.ts`)**
A single, simple table to store everything.

```typescript
import { pgTable, text, timestamp, decimal, boolean } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const receipts = pgTable('receipts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull(),
  
  // Image Data
  imageUrl: text('image_url').notNull(),
  fileName: text('file_name'),
  
  // Extracted Data
  merchantName: text('merchant_name'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }),
  date: timestamp('date'),
  category: text('category'),
  
  // Status
  status: text('status').default('needs_review'), // 'needs_review' | 'approved'
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Action:** Run `npx drizzle-kit push` to deploy this to Vercel Postgres.

#### **4. File Storage Router (`app/api/uploadthing/core.ts`)**
This authorizes the upload.

```typescript
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

export const ourFileRouter = {
  receiptUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { userId } = auth();
      if (!userId) throw new Error("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```
*(Don't forget to create the API route at `app/api/uploadthing/route.ts` exporting this router).*

#### **5. The AI Extraction Action (`app/actions/scan-receipt.ts`)**
This is the core logic. It fetches the image you just uploaded, sends it to Gemini, and saves the result to the DB.

```typescript
'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { receipts } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function scanReceipt(imageUrl: string) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  // 1. Fetch image and convert to base64 for Gemini
  const imageResp = await fetch(imageUrl);
  const imageBuffer = await imageResp.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString("base64");

  // 2. Prompt Gemini
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `
    Analyze this receipt image. Extract the following in JSON format:
    {
      "merchantName": "string",
      "date": "ISO date string",
      "totalAmount": "number",
      "category": "string (Food, Transport, Utilities, Supplies, Other)"
    }
    Only return raw JSON, no markdown.
  `;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
  ]);

  const responseText = result.response.text().replace(/``````/g, '').trim();
  const data = JSON.parse(responseText);

  // 3. Save to DB
  await db.insert(receipts).values({
    userId,
    imageUrl,
    merchantName: data.merchantName,
    date: data.date ? new Date(data.date) : null,
    totalAmount: data.totalAmount?.toString(),
    category: data.category,
    status: 'needs_review'
  });

  revalidatePath("/");
  return { success: true };
}
```

***

### **Phase 2: The Frontend UI**

#### **6. The Upload Component (`components/receipt-upload.tsx`)**
A wrapper around UploadThing that triggers the AI action.

```typescript
'use client';

import { UploadButton } from "@uploadthing/react";
import { scanReceipt } from "@/app/actions/scan-receipt";
import { toast } from "sonner";

export function ReceiptUploader() {
  return (
    <div className="p-8 border-2 border-dashed rounded-xl text-center">
      <UploadButton
        endpoint="receiptUploader"
        onClientUploadComplete={async (res) => {
          toast.info("Processing receipt with AI...");
          await scanReceipt(res[0].url);
          toast.success("Receipt processed!");
        }}
        onUploadError={(error: Error) => {
          toast.error(`Error: ${error.message}`);
        }}
      />
    </div>
  );
}
```

#### **7. The Main Page (`app/page.tsx`)**
Combine the list and the uploader.

```typescript
import { db } from "@/lib/db";
import { receipts } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { ReceiptUploader } from "@/components/receipt-upload";
import { Card } from "@/components/ui/card";

export default async function Dashboard() {
  const { userId } = auth();
  if (!userId) return <div>Please sign in</div>;

  const data = await db.select().from(receipts)
    .where(eq(receipts.userId, userId))
    .orderBy(desc(receipts.createdAt));

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Receipt Scanner</h1>
        {/* Add UserButton from Clerk here */}
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
              <p className="font-bold">${receipt.totalAmount}</p>
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
```

### **Final Checklist to Launch**
1.  Run `npm run dev`.
2.  Sign in (Clerk handles this).
3.  Upload a receipt image.
4.  Wait ~5 seconds.
5.  Watch the receipt appear in the list with the correct Total and Vendor.

This is your **True MVP**. No fluff, just working code.