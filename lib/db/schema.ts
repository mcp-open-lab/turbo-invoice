import { pgTable, text, timestamp, decimal } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const receipts = pgTable("receipts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id").notNull(),

  imageUrl: text("image_url").notNull(),
  fileName: text("file_name"),

  merchantName: text("merchant_name"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  date: timestamp("date"),
  category: text("category"),

  status: text("status").default("needs_review"),
  type: text("type").default("receipt"), // 'receipt' | 'invoice'
  direction: text("direction").default("out"), // 'in' | 'out'

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
