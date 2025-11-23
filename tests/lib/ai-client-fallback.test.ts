import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";

// Mock the providers before importing the client
const mockGeminiGenerateObject = vi.fn();
const mockGeminiGenerateText = vi.fn();
const mockOpenAIGenerateObject = vi.fn();
const mockOpenAIGenerateText = vi.fn();

vi.mock("@/lib/ai/providers/gemini", () => ({
  GeminiProvider: class {
    generateObject = mockGeminiGenerateObject;
    generateText = mockGeminiGenerateText;
  },
}));

vi.mock("@/lib/ai/providers/openai", () => ({
  OpenAIProvider: class {
    generateObject = mockOpenAIGenerateObject;
    generateText = mockOpenAIGenerateText;
  },
}));

describe("AI Client Fallback Logic", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    mockGeminiGenerateObject.mockClear();
    mockGeminiGenerateText.mockClear();
    mockOpenAIGenerateObject.mockClear();
    mockOpenAIGenerateText.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe("generateObject", () => {
    it("should use OpenAI when available and successful", async () => {
      process.env.OPENAI_API_KEY = "test-openai-key";
      delete process.env.GOOGLE_AI_API_KEY;
      
      mockOpenAIGenerateObject.mockResolvedValue({
        success: true,
        data: { test: "value" },
        tokensUsed: 100,
        provider: "openai",
      });
      mockOpenAIGenerateObject.mockClear();

      const { generateObject } = await import("@/lib/ai/client");
      const schema = z.object({ test: z.string() });
      const result = await generateObject("test prompt", schema);

      expect(result.success).toBe(true);
      expect(mockOpenAIGenerateObject).toHaveBeenCalledTimes(1);
    });

    it("should fallback to Gemini when OpenAI fails", async () => {
      process.env.OPENAI_API_KEY = "test-openai-key";
      process.env.GOOGLE_AI_API_KEY = "test-gemini-key";
      
      mockOpenAIGenerateObject.mockResolvedValue({
        success: false,
        error: "OpenAI rate limit",
        provider: "openai",
      });
      
      mockGeminiGenerateObject.mockResolvedValue({
        success: true,
        data: { test: "value" },
        tokensUsed: 50,
        provider: "gemini",
      });
      
      mockOpenAIGenerateObject.mockClear();
      mockGeminiGenerateObject.mockClear();

      const { generateObject } = await import("@/lib/ai/client");
      const schema = z.object({ test: z.string() });
      const result = await generateObject("test prompt", schema);

      expect(result.success).toBe(true);
      expect(mockOpenAIGenerateObject).toHaveBeenCalledTimes(1);
      expect(mockGeminiGenerateObject).toHaveBeenCalledTimes(1);
    });

    it("should return error when both providers fail", async () => {
      process.env.OPENAI_API_KEY = "test-openai-key";
      process.env.GOOGLE_AI_API_KEY = "test-gemini-key";
      
      mockOpenAIGenerateObject.mockResolvedValue({
        success: false,
        error: "OpenAI error",
        provider: "openai",
      });
      
      mockGeminiGenerateObject.mockResolvedValue({
        success: false,
        error: "Gemini error",
        provider: "gemini",
      });
      
      mockOpenAIGenerateObject.mockClear();
      mockGeminiGenerateObject.mockClear();

      const { generateObject } = await import("@/lib/ai/client");
      const schema = z.object({ test: z.string() });
      const result = await generateObject("test prompt", schema);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Gemini error");
      expect(mockOpenAIGenerateObject).toHaveBeenCalledTimes(1);
      expect(mockGeminiGenerateObject).toHaveBeenCalledTimes(1);
    });

    it("should return error when no providers are configured", async () => {
      delete process.env.GOOGLE_AI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const { generateObject } = await import("@/lib/ai/client");
      const schema = z.object({ test: z.string() });
      const result = await generateObject("test prompt", schema);

      expect(result.success).toBe(false);
      expect(result.error).toContain("No LLM providers available");
    });
  });

  describe("generateText", () => {
    it("should use Gemini when available and successful", async () => {
      process.env.GOOGLE_AI_API_KEY = "test-gemini-key";
      delete process.env.OPENAI_API_KEY;
      
      mockGeminiGenerateText.mockResolvedValue({
        success: true,
        data: "test response",
        tokensUsed: 100,
        provider: "gemini",
      });
      mockGeminiGenerateText.mockClear();

      const { generateText } = await import("@/lib/ai/client");
      const result = await generateText("test prompt");

      expect(result.success).toBe(true);
      expect(mockGeminiGenerateText).toHaveBeenCalledTimes(1);
    });

    it("should fallback to OpenAI when Gemini fails", async () => {
      process.env.GOOGLE_AI_API_KEY = "test-gemini-key";
      process.env.OPENAI_API_KEY = "test-openai-key";
      
      mockGeminiGenerateText.mockResolvedValue({
        success: false,
        error: "Gemini rate limit",
        provider: "gemini",
      });
      
      mockOpenAIGenerateText.mockResolvedValue({
        success: true,
        data: "test response",
        tokensUsed: 50,
        provider: "openai",
      });
      
      mockGeminiGenerateText.mockClear();
      mockOpenAIGenerateText.mockClear();

      const { generateText } = await import("@/lib/ai/client");
      const result = await generateText("test prompt");

      expect(result.success).toBe(true);
      expect(mockGeminiGenerateText).toHaveBeenCalledTimes(1);
      expect(mockOpenAIGenerateText).toHaveBeenCalledTimes(1);
    });
  });
});

