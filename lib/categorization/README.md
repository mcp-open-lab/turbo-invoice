# Categorization System

## Overview

The categorization system enforces user preferences (personal/business/both) across all financial data extraction flows. It ensures that AI prompts, UI displays, and database queries respect the user's configuration.

## Key Components

### 1. CategoryFilterService (`category-filter.ts`)

Centralized service that:
- Retrieves user preferences from `userSettings.usageType`
- Filters categories by `usageScope` (personal/business/both)
- Filters categories by `transactionType` (income/expense)
- Provides formatted category lists for AI prompts
- Validates category availability

**Usage Examples:**

```typescript
// Get all available categories for a user
const categories = await CategoryFilterService.getAvailableCategories(userId);

// Get only expense categories
const expenseCategories = await CategoryFilterService.getAvailableCategories(
  userId,
  { transactionType: "expense" }
);

// Get category names for AI prompts
const categoryNames = await CategoryFilterService.getCategoryNamesForAI(
  userId,
  { transactionType: "expense" }
);

// Build a formatted prompt section
const promptSection = await CategoryFilterService.buildCategoryPromptSection(
  userId,
  { transactionType: "income", includeDescription: true }
);
```

### 2. CategoryEngine (`engine.ts`)

Multi-layered auto-categorization:
1. **Layer 1: Explicit Rules** - User-defined rules (exact match, contains)
2. **Layer 2: Historical Patterns** - Learn from past categorizations
3. **Layer 3: AI Fallback** - Use LLM when rules/history don't match

**Note:** `CategoryEngine.getAvailableCategories()` is deprecated. Use `CategoryFilterService.getAvailableCategories()` instead.

### 3. AI Integration

All AI prompts now receive filtered categories based on user preferences:

**Receipt Scanning** (`app/actions/scan-receipt.ts`):
- Only shows **expense** categories (receipts are always expenses)
- Respects user's `usageType` preference

**Bank Statement Import** (`lib/import/ai-column-mapper.ts`):
- Passes both income and expense categories
- Informs AI about user type (personal/business/both)
- AI can categorize credits (income) and debits (expenses) correctly

**Auto-categorization** (`lib/categorization/ai-categorizer.ts`):
- Uses filtered categories when suggesting matches
- Can suggest new categories if none fit

## User Preferences

Users configure their preference in Settings:

```typescript
// userSettings table
{
  usageType: "personal" | "business" | "both" // default: "personal"
}
```

This affects:
1. Which categories are visible in dropdowns
2. Which categories AI can suggest
3. Which categories appear in reports/exports

## Category Schema

```typescript
// categories table
{
  id: string
  name: string
  type: "system" | "user"
  transactionType: "income" | "expense" // NEW
  usageScope: "personal" | "business" | "both" // NEW
  userId: string | null
  parentId: string | null
  description: string | null // NEW
  icon: string | null // NEW
  color: string | null // NEW
}
```

### Examples:

- `{ name: "Salary & Wages", transactionType: "income", usageScope: "both" }`
- `{ name: "Groceries", transactionType: "expense", usageScope: "personal" }`
- `{ name: "Advertising & Marketing", transactionType: "expense", usageScope: "business" }`

## Flow Diagrams

### Receipt Scanning Flow

```
User uploads receipt
  ↓
scanReceiptHandler
  ↓
CategoryFilterService.getCategoryNamesForAI(userId, { transactionType: "expense" })
  ↓
  → Filters by user's usageType (personal/business/both)
  → Returns only EXPENSE categories
  ↓
Build AI prompt with filtered categories
  ↓
Gemini extracts data + suggests category
  ↓
CategoryEngine.categorizeWithAI() (if no AI suggestion)
  ↓
Save receipt with categoryId
```

### Bank Statement Import Flow

```
User uploads CSV/XLSX
  ↓
importSpreadsheet(fileBuffer, fileName, userId)
  ↓
detectColumnMapping(previewRows, userId)
  ↓
CategoryFilterService.getCategorizedListsForAI(userId)
  ↓
  → Returns { incomeCategories[], expenseCategories[], userPreference }
  ↓
Build AI prompt with BOTH income and expense categories
  ↓
AI detects columns + suggests mappings
  ↓
Parse full file with mapping
  ↓
For each transaction:
  ↓
  inferTransactionType(amount) → "income" or "expense"
  ↓
  CategoryEngine.categorizeWithAI(transaction, { userId })
  ↓
  Save transaction with categoryId
```

## Best Practices

1. **Always use CategoryFilterService** when you need to:
   - Display categories in UI
   - Pass categories to AI prompts
   - Validate user input

2. **Specify `transactionType`** when you know if it's income or expense:
   ```typescript
   // Good
   CategoryFilterService.getCategoryNamesForAI(userId, { transactionType: "expense" })
   
   // Less specific (returns all)
   CategoryFilterService.getCategoryNamesForAI(userId)
   ```

3. **Infer transaction type** for bank statements:
   ```typescript
   const txType = CategoryFilterService.inferTransactionType(amount);
   // amount >= 0 → "income"
   // amount < 0 → "expense"
   ```

4. **Cache user preferences** when processing batches:
   ```typescript
   const userPreference = await CategoryFilterService.getUserPreference(userId);
   // Use userPreference for all items in batch
   ```

## Migration Notes

If you're updating existing code:

1. Replace direct database queries for categories with `CategoryFilterService`
2. Update AI prompts to use `buildCategoryPromptSection()` or `getCategoryNamesForAI()`
3. Ensure `userId` is passed through the call chain to enable filtering
4. Update tests to mock `CategoryFilterService` methods

## Future Enhancements

- [ ] Category icons and colors in UI
- [ ] Category descriptions/tooltips
- [ ] Hierarchical categories (parent-child relationships)
- [ ] Category usage analytics
- [ ] Smart category suggestions based on industry/business type

