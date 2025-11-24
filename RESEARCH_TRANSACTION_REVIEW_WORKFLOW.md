# Transaction Review Workflow Research & Proposal

## Current State Analysis

### Where Users Currently Edit Transactions:

1. **Individual Transaction Pages** (`/app/receipts/[id]`, `/app/transactions/[id]`)

   - Full detail view with form
   - Similar transactions panel
   - Create rule functionality
   - **Issue**: One transaction at a time, slow for bulk review

2. **Timeline Page** (`/app`)

   - Shows all transactions chronologically
   - Has filters (status, category, etc.)
   - **Issue**: No dedicated "review" workflow, no bulk actions

3. **Merchant Pages** (`/app/merchants/[name]`)
   - Shows transaction history for a merchant
   - **Issue**: Not focused on review/categorization

### What Needs Review:

- **Uncategorized transactions**: `categoryId IS NULL`
- **"Other" category**: Transactions with generic "Other Expense" or "Other Income"
- **Status = "needs_review"**: Receipts marked for manual review
- **Low confidence AI categorizations**: Could be flagged for review

### Current Gaps:

- ❌ No dedicated review page/workflow
- ❌ No bulk selection/editing
- ❌ No quick inline editing
- ❌ No keyboard shortcuts for speed
- ❌ No progress tracking (e.g., "5 of 20 reviewed")
- ❌ No batch rule creation from review page

---

## Best Practices Research (Financial Apps 2025)

### 1. **Dedicated Review Queue**

- Apps like Mint, YNAB, and QuickBooks have dedicated "Review" or "Categorize" pages
- Shows only transactions needing attention
- Progress indicator (e.g., "12 of 50 remaining")
- **Benefit**: Focused workflow, reduces cognitive load

### 2. **Bulk Selection & Actions**

- Checkboxes for multi-select
- Bulk actions toolbar (categorize, tag, approve)
- Select all / Select none
- **Benefit**: Process 20+ transactions quickly

### 3. **Inline Quick Editing**

- Inline category dropdown (no page navigation)
- Keyboard shortcuts (arrow keys, Enter, Tab)
- Auto-advance to next transaction after save
- **Benefit**: 5-10x faster than clicking through pages

### 4. **Smart Suggestions**

- Show similar transactions inline
- "Create Rule" button next to category field
- Most common category for merchant pre-selected
- **Benefit**: Reduces decision time, improves accuracy

### 5. **Visual Indicators**

- Color coding (red = uncategorized, yellow = needs review)
- Badges for status
- Group by merchant for batch categorization
- **Benefit**: Quick visual scanning

### 6. **Keyboard Shortcuts**

- `Arrow Up/Down`: Navigate transactions
- `Enter`: Save and move to next
- `C`: Open category dropdown
- `R`: Create rule
- `Esc`: Cancel/close
- **Benefit**: Power users can process 50+ transactions/minute

### 7. **Batch Operations**

- "Apply category to all similar" button
- "Create rule for all [Merchant]" action
- Bulk business assignment
- **Benefit**: Handle repetitive transactions instantly

---

## Proposed Solution: "Review Queue" Page

### Location: `/app/review`

### Features:

#### 1. **Smart Filtering (Default View)**

Shows transactions that need attention:

- `categoryId IS NULL` (uncategorized)
- `category = 'Other Expense' OR category = 'Other Income'`
- `status = 'needs_review'`
- Optionally: Low confidence AI categorizations (< 0.7)

#### 2. **List View with Inline Editing**

```
┌─────────────────────────────────────────────────────────┐
│ Review Queue (12 transactions need attention)            │
│ [ ] Select All  [Bulk Actions ▼]                      │
├─────────────────────────────────────────────────────────┤
│ ☑ Starbucks          $5.50  [Category ▼] [Business ▼] │
│   Similar: 8 transactions → [Create Rule]              │
│ ─────────────────────────────────────────────────────── │
│ ☐ Amazon             $45.99  [Other Expense ▼] [▼]    │
│   Similar: 12 transactions → [Create Rule]             │
│ ─────────────────────────────────────────────────────── │
│ ☐ Gas Station         $32.00  [Category ▼] [Business ▼]│
│   Uncategorized                                         │
└─────────────────────────────────────────────────────────┘
```

#### 3. **Quick Actions Per Transaction**

- **Category Dropdown**: Inline, keyboard navigable
- **Business Dropdown**: Quick assignment
- **Create Rule Button**: One-click rule creation
- **Similar Transactions**: Expandable panel (like current)
- **Save & Next**: Auto-advance to next item

#### 4. **Bulk Actions Toolbar**

When items selected:

- **Apply Category**: Set category for all selected
- **Apply Business**: Set business for all selected
- **Create Rules**: Batch create rules for selected merchants
- **Mark Reviewed**: Remove from queue

#### 5. **Keyboard Shortcuts**

- `↑/↓`: Navigate list
- `Space`: Select/deselect current
- `C`: Focus category dropdown
- `B`: Focus business dropdown
- `R`: Create rule for current transaction
- `Enter`: Save and move to next
- `Ctrl+A`: Select all

#### 6. **Progress Tracking**

- Header: "Review Queue (12 of 50 remaining)"
- Progress bar
- "Mark as Reviewed" removes from queue
- Auto-refresh count after saves

#### 7. **Grouping Options**

- Group by Merchant (default for bulk categorization)
- Group by Date
- Group by Amount Range
- Flat list (chronological)

---

## Implementation Plan

### Phase 1: Core Review Page

1. Create `/app/review/page.tsx`
2. Server action: `getTransactionsNeedingReview()`
3. Basic list view with inline category/business dropdowns
4. Save functionality (update transaction)

### Phase 2: Bulk Actions

1. Multi-select checkboxes
2. Bulk actions toolbar
3. Batch update server actions
4. Progress tracking

### Phase 3: Enhanced UX

1. Keyboard shortcuts
2. Similar transactions inline
3. Create rule from review page
4. Auto-advance after save

### Phase 4: Smart Features

1. Group by merchant
2. "Apply to all similar" buttons
3. Batch rule creation
4. Confidence score display

---

## User Flow Example

**Scenario**: User has 20 uncategorized transactions

1. **Navigate to Review Queue** (`/app/review`)

   - See list of 20 transactions
   - Progress: "0 of 20 reviewed"

2. **Quick Review Session** (5 minutes)

   - Group by merchant (see 5 Starbucks transactions)
   - Select all 5 Starbucks transactions
   - Choose "Food & Dining" category
   - Click "Create Rule" → All future Starbucks auto-categorized
   - Repeat for other merchants

3. **Individual Review** (remaining transactions)

   - Use keyboard shortcuts: `↓` `C` `Enter` (next transaction)
   - Process 10-15 transactions/minute

4. **Result**
   - All 20 transactions categorized
   - 5 new rules created
   - Future imports will auto-categorize these merchants
   - System becomes more automatic over time

---

## Technical Considerations

### Database Query

```sql
SELECT * FROM (
  SELECT id, 'receipt' as type, merchant_name, category_id, ...
  FROM receipts WHERE user_id = ? AND category_id IS NULL
  UNION ALL
  SELECT id, 'transaction' as type, merchant_name, category_id, ...
  FROM bank_statement_transactions
  WHERE user_id = ? AND category_id IS NULL
)
WHERE category_id IS NULL
   OR category IN ('Other Expense', 'Other Income')
   OR status = 'needs_review'
ORDER BY date DESC
LIMIT 50
```

### Performance

- Pagination: Load 20-50 at a time
- Optimistic updates: Update UI immediately, sync in background
- Debounced saves: Auto-save after 1 second of inactivity

### State Management

- Local state for selected items
- Server actions for updates
- Real-time progress tracking

---

## Success Metrics

- **Time to Review**: < 30 seconds per transaction (with shortcuts)
- **Rule Creation Rate**: Users create rules for 30%+ of reviewed transactions
- **Auto-Categorization Improvement**: 80%+ accuracy after 1 month of use
- **User Satisfaction**: Users report "much faster" than individual page editing

---

## Next Steps

1. ✅ Research complete
2. ⏳ Get user approval on approach
3. ⏳ Implement Phase 1 (Core Review Page)
4. ⏳ Test with real user data
5. ⏳ Iterate based on feedback
