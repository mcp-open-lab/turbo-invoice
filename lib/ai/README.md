# AI Module Architecture

## Overview

This module provides a clean, maintainable architecture for LLM processing workflows with support for multiple providers (OpenAI, Gemini) and structured outputs.

## Structure

```
lib/ai/
├── client.ts              # Orchestrator - handles provider selection & fallback
├── providers/             # Provider adapters (OpenAI, Gemini)
├── prompts/               # Centralized prompt builders
├── transformers/          # Schema transformation layer
└── types.ts               # Shared types & interfaces
```

## Architecture Principles

### 1. **Provider Adapter Pattern**

- Each provider (`OpenAIProvider`, `GeminiProvider`) implements `LLMProviderInterface`
- Providers handle provider-specific API details internally
- Client orchestrates provider selection and fallback

### 2. **Prompt Management**

- All prompts centralized in `lib/ai/prompts/`
- Prompt builders are classes with static `build()` methods
- Prompts are versioned and testable independently
- Benefits: Easy A/B testing, centralized prompt engineering

### 3. **Schema Transformation**

- Provider-specific schema transformations in `lib/ai/transformers/`
- `GeminiSchemaTransformer` handles Gemini's JSON Schema limitations
- `OpenAISchemaTransformer` is pass-through (OpenAI supports full JSON Schema)
- Benefits: Provider adapters stay simple, easy to add new providers

### 4. **Separation of Concerns**

- **Client**: Provider selection, fallback logic
- **Providers**: API-specific implementation
- **Prompts**: Prompt building logic
- **Transformers**: Schema compatibility
- **Processors**: Business logic orchestration

## Usage

### Structured Output (Recommended)

```typescript
import { generateObject } from "@/lib/ai/client";
import { ReceiptExtractionPrompt } from "@/lib/ai/prompts";
import { z } from "zod";

const schema = z.object({
  merchantName: z.string().nullable(),
  totalAmount: z.number(),
});

const prompt = ReceiptExtractionPrompt.build({
  requiredFields: ["totalAmount"],
  preferredFields: ["merchantName"],
  optionalFields: [],
  currency: "USD",
  jsonSchema: zodToJsonSchema(schema),
});

const result = await generateObject(prompt, schema, {
  image: { data: base64Image, mimeType: "image/jpeg" },
});
```

### Text Generation

```typescript
import { generateText } from "@/lib/ai/client";

const result = await generateText("Summarize this document...");
```

## Provider Selection

- **Structured Outputs**: OpenAI primary (better Zod support), Gemini fallback
- **Text Generation**: Gemini primary (cheaper), OpenAI fallback
- Automatic fallback on errors
- Provider selection is transparent to callers

## Adding New Providers

1. Create provider class implementing `LLMProviderInterface`
2. Create transformer if needed (or use pass-through)
3. Update `client.ts` to include new provider
4. Add provider type to `LLMProvider` union

## Adding New Prompts

1. Create prompt builder class in `lib/ai/prompts/`
2. Export from `lib/ai/prompts/index.ts`
3. Use in processors/workflows

## Testing

- Mock providers for unit tests
- Test prompt builders independently
- Test transformers with sample schemas
- Integration tests with real providers (optional)
