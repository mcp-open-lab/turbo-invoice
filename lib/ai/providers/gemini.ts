import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { LLMProviderInterface, LLMResponse, CompletionOptions } from "../types";

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
      const jsonSchema = zodToJsonSchema(schema, "ExtractedData");

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
        return {
          success: false,
          error: "Gemini returned no content",
          provider: "gemini",
        };
      }

      // Parse and validate with Zod schema
      // Gemini guarantees JSON matching the schema, but we validate anyway
      const parsed = JSON.parse(text);
      const validated = schema.parse(parsed);

      return {
        success: true,
        data: validated,
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

