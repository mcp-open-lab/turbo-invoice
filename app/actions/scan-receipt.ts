'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { receipts } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function scanReceipt(imageUrl: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const imageResp = await fetch(imageUrl);
  const imageBuffer = await imageResp.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString("base64");

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

  const responseText = result.response.text().replace(/```/g, '').trim();
  const data = JSON.parse(responseText);

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

