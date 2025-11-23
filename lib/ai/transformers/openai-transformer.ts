/**
 * OpenAI Schema Transformer
 * OpenAI supports full JSON Schema via zodResponseFormat, so no transformation needed
 * This is a pass-through transformer
 */

import type { SchemaTransformer } from "./base-transformer";

export class OpenAISchemaTransformer implements SchemaTransformer {
  supports(provider: string): boolean {
    return provider === "openai";
  }

  transform(schema: any): any {
    // OpenAI supports full JSON Schema via zodResponseFormat
    // No transformation needed - return as-is
    return schema;
  }
}

