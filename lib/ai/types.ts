import { z } from "zod";

export type LLMProvider = "gemini" | "openai";

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json" | "text";
}

export interface LLMResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  provider: LLMProvider;
  tokensUsed?: number;
}

export interface LLMProviderInterface {
  generateObject<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: CompletionOptions
  ): Promise<LLMResponse<T>>;
  
  generateText(
    prompt: string,
    options?: CompletionOptions
  ): Promise<LLMResponse<string>>;
}

