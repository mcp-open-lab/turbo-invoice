import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
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
      const model = this.client.getGenerativeModel({
        model: this.model,
      });

      const fullPrompt = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON. Do not wrap the response in markdown code blocks or any other formatting.`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.1,
          maxOutputTokens: options?.maxTokens ?? 2048,
        },
      });

      const response = result.response;
      const text = response.text();

      // Clean up potential markdown wrapping
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(cleanedText);
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

