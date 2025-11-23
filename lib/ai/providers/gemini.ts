import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { LLMProviderInterface, LLMResponse, CompletionOptions } from "../types";
import { devLogger } from "@/lib/dev-logger";

/**
 * Clean JSON Schema for Gemini API
 * 
 * Gemini's responseSchema supports a subset of JSON Schema with these constraints:
 * - "type" must be a single string, NEVER an array (e.g., not ["string", "null"])
 * - Enums ARE supported: {"type": "string", "enum": [...]}
 * - Nullability: use "nullable": true, NOT "type": ["string", "null"]
 * - No anyOf/oneOf/allOf, $ref, definitions, $schema, additionalProperties
 * 
 * Based on: https://ai.google.dev/gemini-api/docs/structured-output
 */
function cleanSchemaForGemini(schema: any, definitions?: Record<string, any>): any {
  if (typeof schema !== "object" || schema === null) {
    return schema;
  }

  // Extract definitions if present at top level
  const topLevelDefinitions = schema.definitions || definitions;

  // If this is a $ref, resolve it from definitions
  if (schema.$ref && topLevelDefinitions) {
    const refPath = schema.$ref.replace("#/definitions/", "");
    const resolved = topLevelDefinitions[refPath];
    if (resolved) {
      return cleanSchemaForGemini(resolved, topLevelDefinitions);
    }
  }

  // CRITICAL: Handle "type" as array - Gemini doesn't support this
  // zod-to-json-schema creates ["string", "null"] for nullable fields
  if (Array.isArray(schema.type)) {
    // Extract the non-null type (first non-null type found)
    const nonNullType = schema.type.find((t: string) => t !== "null") || schema.type[0];
    const isNullable = schema.type.includes("null");
    
    const cleaned: any = {
      type: nonNullType,
    };
    
    // Preserve enum if present
    if (schema.enum && Array.isArray(schema.enum)) {
      cleaned.enum = schema.enum;
    }
    
    // Set nullable flag if needed
    if (isNullable) {
      cleaned.nullable = true;
    }
    
    // Preserve description
    if (schema.description) {
      cleaned.description = schema.description;
    }
    
    // Recursively clean any nested properties
    if (schema.properties) {
      cleaned.properties = {};
      for (const [key, value] of Object.entries(schema.properties)) {
        cleaned.properties[key] = cleanSchemaForGemini(value, topLevelDefinitions);
      }
    }
    
    if (schema.items) {
      cleaned.items = cleanSchemaForGemini(schema.items, topLevelDefinitions);
    }
    
    if (Array.isArray(schema.required)) {
      cleaned.required = schema.required;
    }
    
    return cleaned;
  }

  // Handle anyOf/oneOf/allOf - Gemini doesn't support these
  // Common pattern: zod nullable creates anyOf: [{type: "string", enum: [...]}, {type: "null"}]
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    const enumOption = schema.anyOf.find((option: any) => option.enum || (option.type && option.type !== "null" && !Array.isArray(option.type)));
    const nullOption = schema.anyOf.find((option: any) => option.type === "null" || (Array.isArray(option.type) && option.type.includes("null")));
    
    if (enumOption) {
      const cleaned: any = {
        type: Array.isArray(enumOption.type) ? enumOption.type.find((t: string) => t !== "null") : enumOption.type,
      };
      
      // Preserve enum if present
      if (enumOption.enum && Array.isArray(enumOption.enum)) {
        cleaned.enum = enumOption.enum;
      }
      
      // Set nullable if null option exists
      if (nullOption) {
        cleaned.nullable = true;
      }
      
      if (enumOption.description) {
        cleaned.description = enumOption.description;
      }
      
      return cleaned;
    }
  }

  // Handle oneOf/allOf similarly (though less common)
  if ((schema.oneOf || schema.allOf) && Array.isArray(schema.oneOf || schema.allOf)) {
    // For now, take the first non-null option
    const options = schema.oneOf || schema.allOf;
    const firstValid = options.find((opt: any) => opt.type && opt.type !== "null" && !Array.isArray(opt.type));
    if (firstValid) {
      return cleanSchemaForGemini(firstValid, topLevelDefinitions);
    }
  }

  // Enums ARE supported by Gemini - keep them as-is, but ensure type is string (not array)
  if (schema.enum && Array.isArray(schema.enum)) {
    const cleaned: any = {
      type: Array.isArray(schema.type) ? schema.type.find((t: string) => t !== "null") || "string" : (schema.type || "string"),
      enum: schema.enum,
    };
    if (schema.description) {
      cleaned.description = schema.description;
    }
    // Handle nullable - check if type array contains "null" or if nullable flag exists
    if (schema.nullable || (Array.isArray(schema.type) && schema.type.includes("null"))) {
      cleaned.nullable = true;
    }
    return cleaned;
  }

  // Remove metadata fields that Gemini rejects
  const { $ref, definitions: _definitions, $schema, additionalProperties, anyOf, oneOf, allOf, ...cleaned } = schema;
  
  // Ensure type is never an array in the cleaned result (should be handled above, but double-check)
  if (cleaned.type && Array.isArray(cleaned.type)) {
    const originalTypeArray = cleaned.type;
    const nonNullType = originalTypeArray.find((t: string) => t !== "null") || originalTypeArray[0];
    cleaned.type = nonNullType;
    if (originalTypeArray.includes("null")) {
      cleaned.nullable = true;
    }
  }

  // Recursively clean nested objects and arrays
  const result: any = {};
  for (const [key, value] of Object.entries(cleaned)) {
    if (key === "properties" && typeof value === "object" && value !== null) {
      // Special handling for properties object - clean each property value
      result[key] = {};
      for (const [propKey, propValue] of Object.entries(value as Record<string, any>)) {
        result[key][propKey] = cleanSchemaForGemini(propValue, topLevelDefinitions);
      }
    } else if (key === "items" && typeof value === "object" && value !== null) {
      // Special handling for array items schema - clean the item schema
      result[key] = cleanSchemaForGemini(value, topLevelDefinitions);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => cleanSchemaForGemini(item, topLevelDefinitions));
    } else if (typeof value === "object" && value !== null) {
      result[key] = cleanSchemaForGemini(value, topLevelDefinitions);
    } else {
      result[key] = value;
    }
  }

  return result;
}

export class GeminiProvider implements LLMProviderInterface {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model = "gemini-2.0-flash-exp") {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async generateObject<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: CompletionOptions
  ): Promise<LLMResponse<T>> {
    try {
      // Convert Zod schema to JSON Schema for Gemini structured output
      const rawJsonSchema = zodToJsonSchema(schema, "ExtractedData");
      
      // Clean schema to remove metadata fields that Gemini doesn't accept
      const jsonSchema = cleanSchemaForGemini(rawJsonSchema);

      // Build parts array - support both text and image
      // Proper TypeScript types for Gemini parts
      type Part =
        | { text: string }
        | { inlineData: { data: string; mimeType: string } };

      const parts: Part[] = [{ text: prompt }];

      if (options?.image) {
        // Gemini expects base64 image data with mime type
        parts.push({
          inlineData: {
            data: options.image.data,
            mimeType: options.image.mimeType,
          },
        });
      }

      // Use Gemini's structured output with responseMimeType and responseJsonSchema
      // This is the recommended approach for structured outputs (not function calling)
      const model = this.client.getGenerativeModel({
        model: this.model,
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: options?.temperature ?? 0.1,
          maxOutputTokens: options?.maxTokens ?? 2048,
          responseMimeType: "application/json",
          responseSchema: jsonSchema as any,
        },
      });

      const response = result.response;
      const text = response.text();

      if (!text) {
        devLogger.error("Gemini returned empty response", {
          functionCalls: response.functionCalls?.()?.length || 0,
        });
        return {
          success: false,
          error: "Gemini returned no content",
          provider: "gemini",
        };
      }

      // Parse and validate with Zod schema
      // Gemini guarantees JSON matching the schema, but we validate anyway
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch (parseError) {
        devLogger.error("Gemini JSON parse failed", {
          textPreview: text.substring(0, 500),
          error: parseError instanceof Error ? parseError.message : String(parseError),
        });
        return {
          success: false,
          error: `Gemini returned invalid JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          provider: "gemini",
        };
      }

      let validated: T;
      try {
        validated = schema.parse(parsed);
      } catch (validationError) {
        devLogger.error("Gemini schema validation failed", {
          parsedPreview: JSON.stringify(parsed).substring(0, 500),
          error: validationError instanceof Error ? validationError.message : String(validationError),
        });
        return {
          success: false,
          error: `Schema validation failed: ${validationError instanceof Error ? validationError.message : String(validationError)}`,
          provider: "gemini",
        };
      }

      return {
        success: true,
        data: validated,
        provider: "gemini",
        tokensUsed: response.usageMetadata?.totalTokenCount,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      devLogger.error("Gemini exception", {
        error: errorMessage,
      });
      return {
        success: false,
        error: `Gemini error: ${errorMessage}`,
        provider: "gemini",
      };
    }
  }

  async generateText(
    prompt: string,
    options?: CompletionOptions
  ): Promise<LLMResponse<string>> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.model,
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 2048,
        },
      });

      const response = result.response;
      const text = response.text();

      return {
        success: true,
        data: text,
        provider: "gemini",
        tokensUsed: response.usageMetadata?.totalTokenCount,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Gemini error: ${errorMessage}`,
        provider: "gemini",
      };
    }
  }
}

