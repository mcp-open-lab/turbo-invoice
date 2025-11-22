import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import type { LLMProviderInterface, LLMResponse, CompletionOptions } from "../types";

export class OpenAIProvider implements LLMProviderInterface {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateObject<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: CompletionOptions
  ): Promise<LLMResponse<T>> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: options?.temperature ?? 0.1,
        max_tokens: options?.maxTokens ?? 2048,
      });

      const content = completion.choices[0]?.message?.content;
      const parsed = content ? JSON.parse(content) : null;

      if (!parsed) {
        return {
          success: false,
          error: "OpenAI returned no parsed response",
          provider: "openai",
        };
      }

      return {
        success: true,
        data: parsed as T,
        provider: "openai",
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `OpenAI error: ${errorMessage}`,
        provider: "openai",
      };
    }
  }

  async generateText(
    prompt: string,
    options?: CompletionOptions
  ): Promise<LLMResponse<string>> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
      });

      const text = completion.choices[0]?.message?.content;

      if (!text) {
        return {
          success: false,
          error: "OpenAI returned no content",
          provider: "openai",
        };
      }

      return {
        success: true,
        data: text,
        provider: "openai",
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `OpenAI error: ${errorMessage}`,
        provider: "openai",
      };
    }
  }
}

