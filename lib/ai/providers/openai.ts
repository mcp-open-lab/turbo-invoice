import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import type {
  LLMProviderInterface,
  LLMResponse,
  CompletionOptions,
} from "../types";

export class OpenAIProvider implements LLMProviderInterface {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = "gpt-4o") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateObject<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: CompletionOptions
  ): Promise<LLMResponse<T>> {
    try {
      // Use OpenAI's structured outputs with strict JSON Schema mode
      // This prevents hallucinations by enforcing strict schema compliance
      const responseFormat = zodResponseFormat(schema, "strict");

      // Build message content with optional image
      // Proper TypeScript types for OpenAI message content
      type MessageContent =
        | string
        | Array<
            | { type: "text"; text: string }
            | { type: "image_url"; image_url: { url: string } }
          >;

      const messageContent: MessageContent = options?.image
        ? [
            { type: "text" as const, text: prompt },
            {
              type: "image_url" as const,
              image_url: {
                url: `data:${options.image.mimeType};base64,${options.image.data}`,
              },
            },
          ]
        : prompt;

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "user" as const,
            content: messageContent,
          },
        ],
        response_format: responseFormat,
        temperature: options?.temperature ?? 0.1,
        max_tokens: options?.maxTokens ?? 2048,
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        return {
          success: false,
          error: "OpenAI returned no content",
          provider: "openai",
        };
      }

      // Parse and validate with Zod schema
      const parsed = JSON.parse(content);
      const validated = schema.parse(parsed);

      return {
        success: true,
        data: validated,
        provider: "openai",
        tokensUsed: completion.usage?.total_tokens,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `OpenAI error: ${errorMessage}`,
        provider: "openai",
      };
    }
  }
}
