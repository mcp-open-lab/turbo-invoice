/**
 * Analyze LLM Costs and Create Projections
 * Run with: dotenv -e .env.local -- npx tsx scripts/analyze-llm-costs.ts
 */

import "dotenv/config";
import { db } from "@/lib/db";
import { llmLogs } from "@/lib/db/schema";
import { desc, sql, gte } from "drizzle-orm";
import { formatCost } from "@/lib/ai/costs";

async function analyzeCosts() {
  console.log("\n=== LLM COST ANALYSIS ===\n");

  // Get all logs from last 24 hours
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const recentLogs = await db
    .select()
    .from(llmLogs)
    .where(gte(llmLogs.createdAt, yesterday))
    .orderBy(desc(llmLogs.createdAt));

  console.log(`Total requests in last 24h: ${recentLogs.length}\n`);

  if (recentLogs.length === 0) {
    console.log("No logs found. Make sure you've processed some receipts/statements.");
    return;
  }

  // Summary by prompt type
  const byType = await db
    .select({
      promptType: llmLogs.promptType,
      count: sql<number>`COUNT(*)`,
      totalCost: sql<number>`SUM(${llmLogs.costUsd})::numeric`,
      avgCost: sql<number>`AVG(${llmLogs.costUsd})::numeric`,
      totalTokens: sql<number>`SUM(${llmLogs.totalTokens})`,
      avgDuration: sql<number>`AVG(${llmLogs.durationMs})`,
    })
    .from(llmLogs)
    .where(gte(llmLogs.createdAt, yesterday))
    .groupBy(llmLogs.promptType);

  console.log("--- BY WORKFLOW TYPE ---");
  byType.forEach((row) => {
    console.log(`${row.promptType}:`);
    console.log(`  Requests: ${row.count}`);
    console.log(`  Total Cost: ${formatCost(Number(row.totalCost))}`);
    console.log(`  Avg Cost: ${formatCost(Number(row.avgCost))}`);
    console.log(`  Total Tokens: ${row.totalTokens?.toLocaleString()}`);
    console.log(`  Avg Duration: ${Math.round(Number(row.avgDuration))}ms`);
    console.log();
  });

  // Summary by provider
  const byProvider = await db
    .select({
      provider: llmLogs.provider,
      model: llmLogs.model,
      count: sql<number>`COUNT(*)`,
      totalCost: sql<number>`SUM(${llmLogs.costUsd})::numeric`,
      avgCost: sql<number>`AVG(${llmLogs.costUsd})::numeric`,
      totalTokens: sql<number>`SUM(${llmLogs.totalTokens})`,
    })
    .from(llmLogs)
    .where(gte(llmLogs.createdAt, yesterday))
    .groupBy(llmLogs.provider, llmLogs.model);

  console.log("--- BY PROVIDER/MODEL ---");
  byProvider.forEach((row) => {
    console.log(`${row.provider} (${row.model}):`);
    console.log(`  Requests: ${row.count}`);
    console.log(`  Total Cost: ${formatCost(Number(row.totalCost))}`);
    console.log(`  Avg Cost: ${formatCost(Number(row.avgCost))}`);
    console.log(`  Total Tokens: ${row.totalTokens?.toLocaleString()}`);
    console.log();
  });

  // Total summary
  const totals = await db
    .select({
      totalCost: sql<number>`SUM(${llmLogs.costUsd})::numeric`,
      totalRequests: sql<number>`COUNT(*)`,
      totalTokens: sql<number>`SUM(${llmLogs.totalTokens})`,
      avgCost: sql<number>`AVG(${llmLogs.costUsd})::numeric`,
    })
    .from(llmLogs)
    .where(gte(llmLogs.createdAt, yesterday));

  const total = totals[0];
  console.log("--- TOTAL SUMMARY (Last 24h) ---");
  console.log(`Total Requests: ${total.totalRequests}`);
  console.log(`Total Cost: ${formatCost(Number(total.totalCost))}`);
  console.log(`Total Tokens: ${total.totalTokens?.toLocaleString()}`);
  console.log(`Avg Cost per Request: ${formatCost(Number(total.avgCost))}`);
  console.log();

  // Projections
  console.log("=== PROJECTIONS ===\n");

  const avgCostPerRequest = Number(total.avgCost);
  const requestsPerDay = recentLogs.length;

  // MVP Projections (100 users, moderate usage)
  console.log("--- MVP (100 active users) ---");
  const mvpUsers = 100;
  const mvpReceiptsPerUserPerMonth = 20; // 20 receipts/month
  const mvpStatementsPerUserPerMonth = 2; // 2 statements/month
  const mvpTransactionsPerStatement = 50; // 50 transactions per statement

  // Cost breakdown per workflow
  const extractionCost = byType.find((r) => r.promptType === "extraction")?.avgCost || 0;
  const mappingCost = byType.find((r) => r.promptType === "mapping")?.avgCost || 0;
  const categorizationCost = byType.find((r) => r.promptType === "categorization")?.avgCost || 0;

  const mvpReceiptCost = Number(extractionCost) * mvpReceiptsPerUserPerMonth * mvpUsers;
  const mvpStatementCost = Number(mappingCost) * mvpStatementsPerUserPerMonth * mvpUsers;
  const mvpCategorizationCost =
    Number(categorizationCost) *
    mvpStatementsPerUserPerMonth *
    mvpTransactionsPerStatement *
    mvpUsers;

  const mvpMonthlyCost = mvpReceiptCost + mvpStatementCost + mvpCategorizationCost;
  const mvpYearlyCost = mvpMonthlyCost * 12;

  console.log(`Receipts: ${mvpReceiptsPerUserPerMonth}/user/month`);
  console.log(`  Cost: ${formatCost(mvpReceiptCost)}/month`);
  console.log(`Statements: ${mvpStatementsPerUserPerMonth}/user/month`);
  console.log(`  Cost: ${formatCost(mvpStatementCost)}/month`);
  console.log(`Categorizations: ${mvpStatementsPerUserPerMonth * mvpTransactionsPerStatement}/user/month`);
  console.log(`  Cost: ${formatCost(mvpCategorizationCost)}/month`);
  console.log(`\nTotal Monthly: ${formatCost(mvpMonthlyCost)}`);
  console.log(`Total Yearly: ${formatCost(mvpYearlyCost)}`);
  console.log();

  // At-Scale Projections (10,000 users)
  console.log("--- AT SCALE (10,000 active users) ---");
  const scaleUsers = 10000;
  const scaleReceiptsPerUserPerMonth = 30; // More active users
  const scaleStatementsPerUserPerMonth = 2;
  const scaleTransactionsPerStatement = 50;

  const scaleReceiptCost = Number(extractionCost) * scaleReceiptsPerUserPerMonth * scaleUsers;
  const scaleStatementCost = Number(mappingCost) * scaleStatementsPerUserPerMonth * scaleUsers;
  const scaleCategorizationCost =
    Number(categorizationCost) *
    scaleStatementsPerUserPerMonth *
    scaleTransactionsPerStatement *
    scaleUsers;

  const scaleMonthlyCost = scaleReceiptCost + scaleStatementCost + scaleCategorizationCost;
  const scaleYearlyCost = scaleMonthlyCost * 12;

  console.log(`Receipts: ${scaleReceiptsPerUserPerMonth}/user/month`);
  console.log(`  Cost: ${formatCost(scaleReceiptCost)}/month`);
  console.log(`Statements: ${scaleStatementsPerUserPerMonth}/user/month`);
  console.log(`  Cost: ${formatCost(scaleStatementCost)}/month`);
  console.log(`Categorizations: ${scaleStatementsPerUserPerMonth * scaleTransactionsPerStatement}/user/month`);
  console.log(`  Cost: ${formatCost(scaleCategorizationCost)}/month`);
  console.log(`\nTotal Monthly: ${formatCost(scaleMonthlyCost)}`);
  console.log(`Total Yearly: ${formatCost(scaleYearlyCost)}`);
  console.log();

  // Cost per user
  console.log("--- COST PER USER ---");
  console.log(`MVP: ${formatCost(mvpMonthlyCost / mvpUsers)}/user/month`);
  console.log(`At Scale: ${formatCost(scaleMonthlyCost / scaleUsers)}/user/month`);
  console.log();

  // Optimization opportunities
  console.log("=== OPTIMIZATION OPPORTUNITIES ===\n");
  console.log("1. Caching:");
  console.log(`   - Cache repeated merchant names (save ~${formatCost(mvpCategorizationCost * 0.2)}/month)`);
  console.log("2. Model Selection:");
  console.log("   - Use Gemini Flash for categorization (cheaper)");
  console.log("   - Use GPT-4o-mini for simple extractions");
  console.log("3. Batch Processing:");
  console.log("   - Batch categorize multiple transactions in one request");
  console.log("4. Smart Routing:");
  console.log("   - Use rule-based categorization when confidence is high");
  console.log("   - Only use AI for ambiguous cases");
  console.log();

  process.exit(0);
}

analyzeCosts().catch((error) => {
  console.error("Error analyzing costs:", error);
  process.exit(1);
});

