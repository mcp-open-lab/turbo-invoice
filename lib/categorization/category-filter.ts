import { db } from "@/lib/db";
import { categories, userSettings } from "@/lib/db/schema";
import { eq, or, and } from "drizzle-orm";

type Category = typeof categories.$inferSelect;

type UsageType = "personal" | "business" | "both";
type TransactionType = "income" | "expense";

/**
 * Service to filter categories based on user preferences and transaction context
 */
export class CategoryFilterService {
  /**
   * Get user's usage preference (personal/business/both)
   */
  static async getUserPreference(userId: string): Promise<UsageType> {
    const settings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    return (settings[0]?.usageType as UsageType) || "personal";
  }

  /**
   * Get all categories available to a user based on their preference
   * Filters by: usageType (personal/business/both) and transactionType (income/expense)
   */
  static async getAvailableCategories(
    userId: string,
    options?: {
      transactionType?: TransactionType;
      includeUserCategories?: boolean;
    }
  ): Promise<Category[]> {
    const userPreference = await this.getUserPreference(userId);

    // Build query conditions
    const conditions = [];

    // System categories that match user's scope
    if (userPreference === "both") {
      // Show all system categories (personal, business, both)
      conditions.push(eq(categories.type, "system"));
    } else {
      // Show only categories that match user's preference OR are marked as 'both'
      conditions.push(
        and(
          eq(categories.type, "system"),
          or(
            eq(categories.usageScope, userPreference),
            eq(categories.usageScope, "both")
          )
        )
      );
    }

    // Include user's custom categories if requested
    if (options?.includeUserCategories !== false) {
      conditions.push(
        and(eq(categories.type, "user"), eq(categories.userId, userId))
      );
    }

    let allCategories = await db
      .select()
      .from(categories)
      .where(or(...conditions));

    // Filter by transaction type if specified
    if (options?.transactionType) {
      allCategories = allCategories.filter(
        (cat) => cat.transactionType === options.transactionType
      );
    }

    return allCategories;
  }

  /**
   * Get formatted category list for AI prompts
   * Returns: ["Salary & Wages", "Freelance Income", ...]
   */
  static async getCategoryNamesForAI(
    userId: string,
    options?: {
      transactionType?: TransactionType;
      includeUserCategories?: boolean;
    }
  ): Promise<string[]> {
    const availableCategories = await this.getAvailableCategories(
      userId,
      options
    );

    return availableCategories
      .map((cat) => cat.name)
      .sort((a, b) => a.localeCompare(b));
  }

  /**
   * Get categorized lists for AI prompts (income vs expense)
   */
  static async getCategorizedListsForAI(userId: string): Promise<{
    incomeCategories: string[];
    expenseCategories: string[];
    userPreference: UsageType;
  }> {
    const [incomeCategories, expenseCategories, userPreference] =
      await Promise.all([
        this.getCategoryNamesForAI(userId, { transactionType: "income" }),
        this.getCategoryNamesForAI(userId, { transactionType: "expense" }),
        this.getUserPreference(userId),
      ]);

    return {
      incomeCategories,
      expenseCategories,
      userPreference,
    };
  }

  /**
   * Build AI prompt section for categories
   * Returns formatted text to include in prompts
   */
  static async buildCategoryPromptSection(
    userId: string,
    options?: {
      transactionType?: TransactionType;
      includeDescription?: boolean;
    }
  ): Promise<string> {
    const userPreference = await this.getUserPreference(userId);
    const categoryNames = await this.getCategoryNamesForAI(userId, {
      transactionType: options?.transactionType,
    });

    let prompt = "";

    if (options?.includeDescription) {
      prompt += `User Type: ${
        userPreference === "both"
          ? "Business & Personal"
          : userPreference.charAt(0).toUpperCase() + userPreference.slice(1)
      }\n\n`;
    }

    if (options?.transactionType) {
      const typeLabel =
        options.transactionType === "income" ? "Income" : "Expense";
      prompt += `Available ${typeLabel} Categories:\n`;
    } else {
      prompt += "Available Categories:\n";
    }

    prompt += categoryNames.map((name) => `- ${name}`).join("\n");

    return prompt;
  }

  /**
   * Determine transaction type based on amount
   * Positive = income, Negative = expense
   */
  static inferTransactionType(amount: number): TransactionType {
    return amount >= 0 ? "income" : "expense";
  }

  /**
   * Validate if a category is available to a user
   */
  static async isCategoryAvailable(
    userId: string,
    categoryId: string
  ): Promise<boolean> {
    const availableCategories = await this.getAvailableCategories(userId);
    return availableCategories.some((cat) => cat.id === categoryId);
  }
}
