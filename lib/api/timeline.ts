import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { receipts, bankStatementTransactions, bankStatements, documents } from "@/lib/db/schema";

export type TimelineItem = {
  id: string;
  type: "receipt" | "transaction";
  date: Date | null;
  amount: string;
  merchantName: string | null;
  category: string | null;
  status: string | null;
  description: string | null;
  currency: string | null;
  documentId: string | null;
};

export type TimelineFilters = {
  search?: string;
  category?: string;
  status?: string;
  type?: string;
};

type GetTimelineItemsParams = {
  userId: string;
  limit: number;
  offset: number;
  filters?: TimelineFilters;
};

export async function getTimelineItems({
  userId,
  limit,
  offset,
  filters,
}: GetTimelineItemsParams) {
  const search = filters?.search?.toLowerCase();
  const category = filters?.category !== "all" ? filters?.category : undefined;
  const status = filters?.status !== "all" ? filters?.status : undefined;
  const type = filters?.type !== "all" ? filters?.type : undefined;

  // Build Receipt Conditions
  const receiptConditions = [sql`${receipts.userId} = ${userId}`];
  if (search) {
    receiptConditions.push(sql`(
      LOWER(${receipts.merchantName}) LIKE ${`%${search}%`} OR 
      LOWER(${receipts.description}) LIKE ${`%${search}%`}
    )`);
  }
  if (category) {
    receiptConditions.push(sql`${receipts.category} = ${category}`);
  }
  if (status) {
    receiptConditions.push(sql`${receipts.status} = ${status}`);
  }

  const receiptWhere = sql.join(receiptConditions, sql` AND `);

  // Build Transaction Conditions
  const txConditions = [sql`d.user_id = ${userId}`];
  if (search) {
    txConditions.push(sql`(
      LOWER(bst.merchant_name) LIKE ${`%${search}%`} OR 
      LOWER(bst.description) LIKE ${`%${search}%`}
    )`);
  }
  if (category) {
    txConditions.push(sql`bst.category = ${category}`);
  }
  // Status for transactions is always 'completed' for now, so we simulate filtering
  if (status && status !== "completed") {
    txConditions.push(sql`1=0`); // Force empty if searching for non-completed status
  }

  const txWhere = sql.join(txConditions, sql` AND `);

  // Construct the UNION query parts conditionally based on 'type' filter
  let query;

  const receiptSelect = sql`
    SELECT 
      id,
      'receipt' as type,
      date as date,
      total_amount::text as amount,
      merchant_name,
      category,
      status,
      description,
      currency,
      document_id
    FROM ${receipts}
    WHERE ${receiptWhere}
  `;

  const txSelect = sql`
    SELECT 
      bst.id,
      'transaction' as type,
      bst.transaction_date as date,
      bst.amount::text as amount,
      bst.merchant_name,
      bst.category,
      'completed' as status,
      bst.description,
      bst.currency,
      bst.bank_statement_id as document_id
    FROM ${bankStatementTransactions} bst
    JOIN ${bankStatements} bs ON bst.bank_statement_id = bs.id
    JOIN ${documents} d ON bs.document_id = d.id
    WHERE ${txWhere}
  `;

  if (type === "receipt") {
    query = sql`${receiptSelect} ORDER BY date DESC NULLS LAST, id ASC LIMIT ${limit} OFFSET ${offset}`;
  } else if (type === "transaction") {
    query = sql`${txSelect} ORDER BY date DESC NULLS LAST, id ASC LIMIT ${limit} OFFSET ${offset}`;
  } else {
    query = sql`
      (${receiptSelect})
      UNION ALL
      (${txSelect})
      ORDER BY date DESC NULLS LAST, id ASC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  const result = await db.execute(query);
  
  return result.rows.map((row: any) => ({
    id: row.id,
    type: row.type,
    date: row.date ? new Date(row.date) : null,
    amount: row.amount,
    merchantName: row.merchant_name,
    category: row.category,
    status: row.status,
    description: row.description,
    currency: row.currency,
    documentId: row.document_id,
  })) as TimelineItem[];
}
