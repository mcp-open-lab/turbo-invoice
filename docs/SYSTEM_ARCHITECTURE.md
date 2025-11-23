# Turbo Invoice - System Architecture

**Last Updated:** November 23, 2025  
**Version:** 1.0

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [Design Patterns](#design-patterns)
6. [Integration Points](#integration-points)
7. [File Structure Map](#file-structure-map)

---

## System Overview

Turbo Invoice is a Next.js 16 financial document processing application that uses AI to extract, categorize, and manage receipts and financial transactions.

### Tech Stack

| Layer               | Technology                                            |
| ------------------- | ----------------------------------------------------- |
| **Framework**       | Next.js 16 (App Router)                               |
| **Database**        | PostgreSQL + Drizzle ORM                              |
| **Authentication**  | Clerk                                                 |
| **File Storage**    | UploadThing                                           |
| **Background Jobs** | Inngest                                               |
| **AI**              | OpenAI (GPT-4o, GPT-4o-mini), Google Gemini 2.0 Flash |
| **UI**              | React 19, Tailwind CSS, shadcn/ui                     |
| **Testing**         | Vitest, Playwright                                    |

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                         │
│  Next.js App Router + React Server Components + Client UI   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                   PRESENTATION LAYER                         │
│  • Pages (app/app/**/page.tsx)                              │
│  • Components (components/*)                                 │
│  • Server Actions (app/actions/*.ts)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                       │
│  • AI Layer (lib/ai/*)                                      │
│  • Categorization Engine (lib/categorization/*)             │
│  • Import/Batch Processing (lib/import/*)                   │
│  • Document Processors (lib/import/processors/*)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                      DATA LAYER                              │
│  • Drizzle ORM (lib/db/)                                    │
│  • PostgreSQL Database                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                   INTEGRATION LAYER                          │
│  • Clerk (Authentication)                                    │
│  • UploadThing (File Storage)                               │
│  • Inngest (Background Jobs)                                │
│  • OpenAI / Gemini (AI APIs)                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture Layers

### 1. Presentation Layer

**Location:** `app/`, `components/`

#### App Router Structure (`app/`)

```
app/
├── page.tsx                    # Landing page
├── layout.tsx                  # Root layout
├── globals.css                 # Global styles
├── actions/                    # Server Actions
│   ├── scan-receipt.ts         # Receipt upload & processing
│   ├── import-batch.ts         # Batch import operations
│   ├── import-batch-items.ts   # Individual item operations
│   ├── financial-categories.ts # Category management
│   ├── update-receipt.ts       # Receipt updates
│   └── user-settings.ts        # User preferences
├── api/                        # API Routes (Webhooks only)
│   ├── inngest/route.ts        # Inngest webhook handler
│   └── uploadthing/            # UploadThing webhook
└── app/                        # Application pages
    ├── page.tsx                # Dashboard
    ├── import/page.tsx         # Batch import UI
    ├── receipts/[id]/          # Receipt detail
    ├── transactions/[id]/      # Transaction detail
    ├── settings/               # User settings
    └── budgets/                # Budget management
```

#### Components (`components/`)

```
components/
├── ui/                         # Primitive shadcn/ui components (54 files)
├── receipts/                   # Receipt-specific components
│   ├── receipt-detail-view.tsx
│   ├── receipt-form.tsx
│   └── receipt-image-viewer.tsx
├── import/                     # Batch import components
│   ├── batch-detail-container.tsx
│   ├── batch-items-table.tsx
│   ├── batch-progress.tsx
│   └── file-upload-zone.tsx
├── bank-transactions/          # Transaction components
│   ├── transaction-detail-view.tsx
│   └── transaction-form.tsx
├── financial-categories/       # Category management
│   ├── categories-section.tsx
│   └── rules-section.tsx
└── timeline.tsx                # Activity timeline
```

**Design Pattern:** Server Components by default, Client Components only for interactivity

---

### 2. Business Logic Layer

#### 2.1 AI Layer (`lib/ai/`)

**Purpose:** Centralized LLM integration with provider abstraction, observability, and cost tracking

```
lib/ai/
├── client.ts                   # Main API: generateObject(), generateObjectForCategorization(), generateObjectForExtraction()
├── types.ts                    # Common types (LLMResponse, CompletionOptions)
├── constants.ts                # AI_TEMPERATURES, CONFIDENCE_DEFAULTS
├── costs.ts                    # LLM_PRICING, calculateCost()
├── logger.ts                   # logLLMInteraction() - writes to llm_logs table
├── providers/
│   ├── openai.ts               # OpenAIProvider - GPT-4o, GPT-4o-mini
│   └── gemini.ts               # GeminiProvider - Gemini 2.0 Flash
├── prompts/                    # Prompt builders (strategy pattern)
│   ├── receipt-extraction.ts   # ReceiptExtractionPrompt
│   ├── categorization.ts       # CategorizationPrompt
│   └── column-mapping.ts       # ColumnMappingPrompt
└── transformers/               # Schema transformers for provider compatibility
    ├── gemini-transformer.ts   # Cleans Zod schemas for Gemini API
    └── openai-transformer.ts   # (Placeholder - OpenAI works with raw Zod)
```

**Key Functions:**

- `generateObject()` - Generic structured output (OpenAI primary, Gemini fallback)
- `generateObjectForCategorization()` - Gemini Flash primary (free), OpenAI fallback
- `generateObjectForExtraction()` - GPT-4o-mini primary (cheap), GPT-4o fallback

**Design Patterns:**

- **Provider Pattern:** Interchangeable LLM providers (OpenAI, Gemini)
- **Strategy Pattern:** Prompt builders for different use cases
- **Transformer Pattern:** Schema cleaning for API compatibility
- **Observability:** All LLM calls logged to `llm_logs` table with cost tracking

---

#### 2.2 Categorization System (`lib/categorization/`)

**Purpose:** Multi-layered transaction categorization with extensible strategy pattern

```
lib/categorization/
├── engine.ts                   # CategoryEngine - Main public API
├── strategy-manager.ts         # CategoryStrategyManager - Strategy orchestration
├── types.ts                    # Shared types
├── strategies/                 # Categorization strategies (priority-based)
│   ├── base-strategy.ts        # CategorizationStrategy interface
│   ├── rule-matcher.ts         # Priority 1: User-defined rules
│   ├── history-matcher.ts      # Priority 2: Past categorizations
│   └── ai-matcher.ts           # Priority 100: AI fallback
├── repositories/               # Data access layer (DRY)
│   ├── transaction-repository.ts  # Unified transaction history
│   └── category-repository.ts     # Category data access
├── adapters/                   # Workflow-specific adapters
│   ├── receipt-adapter.ts      # Receipt → CategorizationInput
│   ├── bank-statement-adapter.ts # Bank transaction → CategorizationInput
│   └── credit-card-adapter.ts  # Credit card → CategorizationInput
├── ai-categorizer.ts           # AI categorization wrapper
└── category-filter.ts          # Category filtering by user preferences
```

**Architecture:**

```
┌─────────────────────────────────────────────┐
│          CategoryEngine (Public API)         │
│  • categorizeTransaction()                   │
│  • categorizeWithAI()                        │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│       CategoryStrategyManager                │
│  • Runs strategies in priority order         │
│  • Stops at first success (confidence met)   │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┐
        ▼                     ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ RuleMatcher  │  │HistoryMatcher│  │  AiMatcher   │
│  Priority 1  │  │  Priority 2  │  │ Priority 100 │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                  │
        └─────────────────┴──────────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
    ┌──────────────────┐  ┌──────────────────┐
    │Transaction Repo  │  │ Category Repo    │
    │ (Unified History)│  │ (Category Data)  │
    └──────────────────┘  └──────────────────┘
```

**Design Patterns:**

- **Strategy Pattern:** Pluggable categorization strategies
- **Repository Pattern:** Unified data access (eliminates duplicate queries)
- **Adapter Pattern:** Workflow-specific input normalization
- **Priority-based Execution:** Strategies run in order, stop on first success

---

#### 2.3 Import/Batch Processing (`lib/import/`)

**Purpose:** Asynchronous batch processing of receipts and financial statements

```
lib/import/
├── import-orchestrator.ts      # Main entry: processSpreadsheetImport()
├── process-batch-item.ts       # Individual item processor (called by Inngest)
├── queue-sender.ts             # Inngest event dispatch
├── queue-types.ts              # Queue payload types
├── batch-tracker.ts            # Batch status tracking
├── batch-types.ts              # Batch state types
├── ai-column-mapper.ts         # AI-powered column detection
├── spreadsheet-parser.ts       # CSV/Excel parsing
├── duplicate-detector.ts       # SHA-256 hash-based deduplication
├── transaction-detection.ts    # Detect income vs expense
├── field-converters.ts         # Data normalization
└── processors/                 # Document-specific processors
    ├── base-document-processor.ts     # Abstract base
    ├── base-statement-processor.ts    # Statement base
    ├── receipt-processor.ts           # Receipt OCR + AI extraction
    ├── bank-account-processor.ts      # Bank statement parsing
    └── credit-card-processor.ts       # Credit card parsing
```

**Processing Flow:**

```
┌──────────────────┐
│ User uploads     │
│ files/CSV        │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ import-orchestrator.ts               │
│ • Parses spreadsheet/files           │
│ • Creates import_batches record      │
│ • Creates batch_items records        │
│ • Dispatches to Inngest queue        │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Inngest (Background Queue)           │
│ • Processes items in parallel        │
│ • 3 retries on failure               │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ process-batch-item.ts                │
│ • Routes to correct processor        │
│ • Handles errors & status updates    │
└────────┬─────────────────────────────┘
         │
    ┌────┴────┬──────────────┬──────────┐
    ▼         ▼              ▼          ▼
┌────────┐ ┌────────┐ ┌──────────┐ ┌────────┐
│Receipt │ │Bank    │ │Credit    │ │Other   │
│Processor│ │Account │ │Card      │ │Processors│
└────────┘ └────────┘ └──────────┘ └────────┘
    │         │              │          │
    └─────────┴──────────────┴──────────┘
                     │
                     ▼
         ┌──────────────────────┐
         │ • AI extraction      │
         │ • Duplicate detection│
         │ • Categorization     │
         │ • Save to documents  │
         └──────────────────────┘
```

**Design Patterns:**

- **Template Method:** Base processors define flow, subclasses implement specifics
- **Strategy Pattern:** Different processors for different document types
- **Queue Pattern:** Asynchronous background processing via Inngest
- **Observer Pattern:** Real-time status updates tracked in batch_items

---

### 3. Data Layer

#### 3.1 Database Schema (`lib/db/schema.ts`)

**Core Tables:**

```sql
-- Document System
documents               # All uploaded files
├── receipts            # Receipt-specific fields
├── bankStatementTransactions  # Bank transaction records
└── creditCardTransactions     # Credit card records (future)

-- Categorization
categories              # System + user categories
categoryRules           # User-defined categorization rules

-- Batch Processing
importBatches           # Batch import records
batchItems              # Individual items in batches

-- Observability
llm_logs                # LLM API call tracking (cost, tokens, performance)

-- User Management
userSettings            # User preferences (country, currency, usage type)
```

**Key Relationships:**

```
documents 1:1 receipts (via documentId)
documents 1:N bankStatementTransactions (via documentId)
documents N:1 importBatches (via importBatchId)

importBatches 1:N batchItems
batchItems N:1 documents (via documentId)

receipts N:1 categories (via categoryId)
bankStatementTransactions N:1 categories (via categoryId)

categoryRules N:1 categories (via categoryId)
llm_logs N:1 documents (via entityId, entityType)
```

#### 3.2 ORM Layer (`lib/db/`)

```typescript
// lib/db/index.ts
export const db = drizzle(pool);  // Drizzle ORM instance

// Query patterns
await db.select().from(receipts).where(eq(receipts.userId, userId));
await db.insert(documents).values({...}).returning();
await db.update(batchItems).set({ status: 'completed' }).where(...);
```

**Design Patterns:**

- **Type Inference:** All types inferred from schema via `$inferSelect`, `$inferInsert`
- **Repository Pattern:** Used in categorization layer for abstraction

---

### 4. Integration Layer

#### 4.1 Authentication (Clerk)

- **Server:** `auth()` from `@clerk/nextjs/server`
- **Client:** `useUser()` hook
- **Security:** All DB queries filtered by `userId`

#### 4.2 File Storage (UploadThing)

- **Upload Endpoint:** `app/api/uploadthing/core.ts`
- **Usage:** Receipt images, CSV/Excel files
- **Features:** Automatic CDN, image optimization

#### 4.3 Background Jobs (Inngest)

- **Client:** `lib/inngest/client.ts`
- **Functions:** `app/api/inngest/route.ts`
  - `processImportJob` - Process batch items
- **Event Types:** `import/process.item`
- **Features:** 3 retries, step isolation

#### 4.4 AI APIs

| Provider   | Models           | Use Case                      | Cost                      |
| ---------- | ---------------- | ----------------------------- | ------------------------- |
| **OpenAI** | GPT-4o           | Receipt extraction (fallback) | $5/$15 per 1M tokens      |
| **OpenAI** | GPT-4o-mini      | Receipt extraction (primary)  | $0.15/$0.60 per 1M tokens |
| **Google** | Gemini 2.0 Flash | Categorization (primary)      | Free                      |

---

## Data Flow

### Receipt Upload Flow

```
1. User uploads receipt → ReceiptUpload component
2. File → UploadThing CDN (fileUrl)
3. Server Action: scan-receipt.ts
   ├── Create documents record (status: pending)
   ├── Create receipts record (linked via documentId)
   └── Call ReceiptProcessor.processDocument()
4. ReceiptProcessor
   ├── Extract data with GPT-4o-mini (primary)
   ├── Fallback to GPT-4o if needed
   ├── Log LLM interaction to llm_logs
   ├── Detect duplicates (SHA-256 hash)
   ├── Auto-categorize (CategoryEngine)
   └── Update documents (status: completed)
5. Return success → UI updates
```

### Batch Import Flow

```
1. User uploads CSV/Excel → FileUploadZone component
2. File → UploadThing CDN
3. Server Action: import-batch.ts
   ├── Parse spreadsheet (spreadsheet-parser.ts)
   ├── AI column mapping (ai-column-mapper.ts)
   ├── Create import_batches record
   ├── Create batch_items records (N items)
   └── Dispatch to Inngest queue (queue-sender.ts)
4. Inngest processes items in parallel
   ├── For each item: process-batch-item.ts
   ├── Route to appropriate processor
   ├── Extract, categorize, save
   └── Update batch_items status
5. BatchDetailContainer polls for updates
6. Display results in BatchItemsTable
```

### Categorization Flow

```
1. Transaction needs categorization
2. CategoryEngine.categorizeWithAI()
3. CategoryStrategyManager runs strategies:
   ├── RuleMatcher (Priority 1)
   │   └── Query categoryRules table
   ├── HistoryMatcher (Priority 2)
   │   └── Query transaction history (unified repo)
   └── AiMatcher (Priority 100)
       ├── Call Gemini Flash (primary)
       ├── Fallback to OpenAI if needed
       └── Log to llm_logs
4. Return category + confidence
5. Save to receipts/bankStatementTransactions
```

---

## Design Patterns

### 1. Strategy Pattern

- **Location:** `lib/categorization/strategies/`, `lib/ai/prompts/`
- **Purpose:** Pluggable algorithms (matchers, prompts)

### 2. Repository Pattern

- **Location:** `lib/categorization/repositories/`
- **Purpose:** Abstract data access, eliminate duplicate queries

### 3. Adapter Pattern

- **Location:** `lib/categorization/adapters/`
- **Purpose:** Normalize workflow-specific data

### 4. Template Method

- **Location:** `lib/import/processors/base-*.ts`
- **Purpose:** Define processing flow, subclasses implement specifics

### 5. Provider Pattern

- **Location:** `lib/ai/providers/`
- **Purpose:** Interchangeable LLM providers

### 6. Transformer Pattern

- **Location:** `lib/ai/transformers/`
- **Purpose:** Schema cleaning for API compatibility

### 7. Observer Pattern

- **Location:** Batch processing with real-time status updates
- **Implementation:** `batch_items` table + polling

---

## File Structure Map

### Root Structure

```
turbo-invoice/
├── app/                        # Next.js App Router
│   ├── actions/                # Server Actions (mutations)
│   ├── api/                    # API routes (webhooks only)
│   └── app/                    # Pages
├── components/                 # React components
│   ├── ui/                     # shadcn/ui primitives
│   ├── receipts/               # Receipt components
│   ├── import/                 # Batch import components
│   └── bank-transactions/      # Transaction components
├── lib/                        # Business logic
│   ├── ai/                     # AI layer
│   ├── categorization/         # Categorization system
│   ├── import/                 # Import/batch processing
│   ├── db/                     # Database + schema
│   └── inngest/                # Background jobs
├── hooks/                      # React hooks
├── tests/                      # Unit + integration tests
├── e2e/                        # Playwright e2e tests
├── scripts/                    # Utility scripts
├── docs/                       # Documentation
└── public/                     # Static assets
```

### Key Configuration Files

| File                   | Purpose                    |
| ---------------------- | -------------------------- |
| `next.config.ts`       | Next.js configuration      |
| `drizzle.config.ts`    | Database migrations config |
| `tailwind.config.ts`   | Tailwind CSS config        |
| `tsconfig.json`        | TypeScript config          |
| `vitest.config.ts`     | Unit test config           |
| `playwright.config.ts` | E2E test config            |
| `components.json`      | shadcn/ui config           |

---

## Observability

### Logging (`lib/dev-logger.ts`)

```typescript
// Structured logging with context
devLogger.info("Processing receipt", { receiptId, userId });
devLogger.error("Extraction failed", { error, fileName });
```

### LLM Tracking (`lib/ai/logger.ts`)

All LLM calls logged to `llm_logs` table:

- Provider, model, prompt type
- Input/output tokens, cost (USD)
- Duration (ms)
- Success/failure status
- Input/output JSON (for debugging)

### Cost Analysis

Run `npm run analyze-costs` to view:

- Total costs by provider, model, prompt type
- Average tokens per request
- Projected costs for MVP and at-scale

---

## Testing Strategy

### Unit Tests (`tests/lib/`)

- **Location:** `tests/lib/**/*.test.ts`
- **Framework:** Vitest
- **Coverage:** AI client, categorization strategies, batch tracker

### Integration Tests (`tests/actions/`)

- **Location:** `tests/actions/**/*.test.ts`
- **Framework:** Vitest
- **Coverage:** Server Actions with mocked DB

### E2E Tests (`e2e/`)

- **Location:** `e2e/**/*.spec.ts`
- **Framework:** Playwright
- **Coverage:** Receipt upload, batch import flows

### Run Tests

```bash
npm test                    # Unit + integration tests
npm run test:e2e            # E2E tests
npm run test:coverage       # Coverage report
```

---

## Performance Considerations

### Database

- Indexed columns: `userId`, `documentType`, `status`, `createdAt`
- Query timeout: 5 minutes (user rule)

### AI Optimization

- GPT-4o-mini (primary) for extraction → 93% cost reduction
- Gemini Flash (primary) for categorization → 100% cost reduction (free)
- Fallback to more expensive models only on failure

### Background Processing

- Parallel processing via Inngest
- 3 automatic retries on failure
- Graceful degradation (failed items can be retried individually)

### Caching

- Static components cached by Next.js
- No client-side caching of sensitive financial data

---

## Security

### Authentication

- Clerk handles all auth flows
- Every DB query filtered by `userId`
- Server Actions use `auth()` to verify user

### Authorization

- All mutations check user ownership
- No direct API access (Server Actions only)

### Data Privacy

- Files stored on UploadThing CDN (encrypted at rest)
- LLM logs do not contain full base64 images
- Sensitive data filtered from logs

---

## Future Enhancements

### Planned Features

1. Credit card statement import (adapter ready)
2. Budget tracking with alerts
3. Invoice generation
4. Tax report export
5. Multi-currency support

### Architectural Improvements

1. Add caching layer (Redis) for categories
2. Implement event sourcing for audit trail
3. Add real-time updates via WebSockets
4. Horizontal scaling via queue workers
5. Add ML model training on user data

---

## Maintenance

### Adding New Features

#### New Document Type

1. Create processor in `lib/import/processors/`
2. Extend `base-document-processor.ts`
3. Add workflow adapter in `lib/categorization/adapters/`
4. Update `documentType` enum in schema

#### New Categorization Strategy

1. Create strategy in `lib/categorization/strategies/`
2. Implement `CategorizationStrategy` interface
3. Register in `CategoryEngine.categorizeWithAI()`

#### New LLM Provider

1. Create provider in `lib/ai/providers/`
2. Implement `LLMProviderInterface`
3. Add pricing to `lib/ai/costs.ts`
4. Register in `lib/ai/client.ts`

### Database Migrations

```bash
# Make schema changes in lib/db/schema.ts
npm run db:push              # Push to DB (dev)
npm run db:generate          # Generate migration (prod)
npm run db:studio            # Visual DB browser
```

---

## Resources

### Documentation

- [Architecture Audit](./ARCHITECTURE_AUDIT.md)
- [LLM Observability](./LLM_OBSERVABILITY.md)
- [Cost Analysis](./COST_ANALYSIS.md)
- [Categorization Plan](./CATEGORIZATION_ARCHITECTURE_PLAN.md)
- [Import Implementation](./IMPORT_IMPLEMENTATION.md)
- [Logging Guide](./LOGGING.md)

### External

- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [Clerk Auth](https://clerk.com/docs)
- [Inngest](https://www.inngest.com/docs)
- [UploadThing](https://docs.uploadthing.com/)

---

**Document Version:** 1.0  
**Last Reviewed:** November 23, 2025  
**Next Review:** Quarterly or on major architectural changes
