import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";

// Define system categories with proper classification
const SYSTEM_CATEGORIES = [
  // INCOME - Personal
  { name: "Salary & Wages", transactionType: "income", usageScope: "personal" },
  { name: "Freelance Income", transactionType: "income", usageScope: "both" },
  { name: "Investment Income", transactionType: "income", usageScope: "both" },
  { name: "Interest Income", transactionType: "income", usageScope: "both" },
  { name: "Refunds & Reimbursements", transactionType: "income", usageScope: "both" },
  { name: "Tax Refund", transactionType: "income", usageScope: "both" },
  { name: "Gifts & Donations Received", transactionType: "income", usageScope: "personal" },
  
  // INCOME - Business
  { name: "Business Revenue", transactionType: "income", usageScope: "business" },
  { name: "Client Payments", transactionType: "income", usageScope: "business" },
  { name: "Grant Income", transactionType: "income", usageScope: "business" },
  
  // EXPENSES - Personal
  { name: "Food & Dining", transactionType: "expense", usageScope: "both" },
  { name: "Groceries", transactionType: "expense", usageScope: "personal" },
  { name: "Transportation", transactionType: "expense", usageScope: "both" },
  { name: "Housing & Rent", transactionType: "expense", usageScope: "personal" },
  { name: "Utilities", transactionType: "expense", usageScope: "both" },
  { name: "Healthcare & Medical", transactionType: "expense", usageScope: "both" },
  { name: "Entertainment", transactionType: "expense", usageScope: "personal" },
  { name: "Shopping & Retail", transactionType: "expense", usageScope: "personal" },
  { name: "Personal Care", transactionType: "expense", usageScope: "personal" },
  { name: "Education", transactionType: "expense", usageScope: "both" },
  { name: "Insurance", transactionType: "expense", usageScope: "both" },
  { name: "Taxes", transactionType: "expense", usageScope: "both" },
  { name: "Subscriptions", transactionType: "expense", usageScope: "both" },
  
  // EXPENSES - Business
  { name: "Office Supplies", transactionType: "expense", usageScope: "business" },
  { name: "Professional Services", transactionType: "expense", usageScope: "business" },
  { name: "Software & Tools", transactionType: "expense", usageScope: "business" },
  { name: "Advertising & Marketing", transactionType: "expense", usageScope: "business" },
  { name: "Business Travel", transactionType: "expense", usageScope: "business" },
  { name: "Business Meals", transactionType: "expense", usageScope: "business" },
  { name: "Equipment & Hardware", transactionType: "expense", usageScope: "business" },
  { name: "Rent & Lease", transactionType: "expense", usageScope: "business" },
  { name: "Payroll & Contractors", transactionType: "expense", usageScope: "business" },
  
  // Catch-all
  { name: "Other Income", transactionType: "income", usageScope: "both" },
  { name: "Other Expense", transactionType: "expense", usageScope: "both" },
] as const;

async function seedCategories() {
  console.log("Starting financial category seeding...");

  try {
    // Check if system categories already exist
    const existingCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.type, "system"));

    if (existingCategories.length > 0) {
      console.log(
        `Found ${existingCategories.length} existing system categories.`
      );
      console.log("Updating existing categories with new fields...");
      
      // Update existing categories to have proper transactionType and usageScope
      for (const existing of existingCategories) {
        const matchingCategory = SYSTEM_CATEGORIES.find(
          (cat) => cat.name === existing.name
        );
        
        if (matchingCategory) {
          await db
            .update(categories)
            .set({
              transactionType: matchingCategory.transactionType,
              usageScope: matchingCategory.usageScope,
            })
            .where(eq(categories.id, existing.id));
        }
      }
      
      // Insert any new categories that don't exist yet
      const existingNames = new Set(existingCategories.map((c) => c.name));
      const newCategories = SYSTEM_CATEGORIES.filter(
        (cat) => !existingNames.has(cat.name)
      );
      
      if (newCategories.length > 0) {
        const categoriesToInsert = newCategories.map((cat) => ({
          id: createId(),
          name: cat.name,
          type: "system" as const,
          userId: null,
          transactionType: cat.transactionType,
          usageScope: cat.usageScope,
        }));

        await db.insert(categories).values(categoriesToInsert);
        console.log(`✓ Inserted ${newCategories.length} new categories`);
      }
      
      console.log(`✓ Successfully updated system categories`);
      return;
    }

    // Insert all system categories (fresh database)
    const categoriesToInsert = SYSTEM_CATEGORIES.map((cat) => ({
      id: createId(),
      name: cat.name,
      type: "system" as const,
      userId: null,
      transactionType: cat.transactionType,
      usageScope: cat.usageScope,
    }));

    await db.insert(categories).values(categoriesToInsert);

    console.log(`✓ Successfully seeded ${SYSTEM_CATEGORIES.length} system categories`);
    console.log("\nIncome categories:", SYSTEM_CATEGORIES.filter(c => c.transactionType === "income").map(c => c.name).join(", "));
    console.log("\nExpense categories:", SYSTEM_CATEGORIES.filter(c => c.transactionType === "expense").map(c => c.name).join(", "));
  } catch (error) {
    console.error("Error seeding categories:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedCategories()
    .then(() => {
      console.log("Seed completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}

export { seedCategories };
