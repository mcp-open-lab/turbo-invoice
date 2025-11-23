/**
 * AI Module Constants
 * Centralized configuration values for LLM workflows
 */

/**
 * Default temperature values for different use cases
 */
export const AI_TEMPERATURES = {
  /**
   * Low temperature for structured outputs (extraction, mapping)
   * Ensures consistent, deterministic results
   */
  STRUCTURED_OUTPUT: 0.1,

  /**
   * Higher temperature for text generation
   * Allows more creative/natural responses
   */
  TEXT_GENERATION: 0.7,
} as const;

/**
 * Default confidence values
 */
export const CONFIDENCE_DEFAULTS = {
  /**
   * Default extraction confidence when not calculated
   * TODO: Calculate based on field coverage
   */
  EXTRACTION: 0.9,

  /**
   * Default mapping confidence fallback
   */
  MAPPING: 0.5,

  /**
   * Default categorization confidence for rule-based matches
   */
  CATEGORIZATION_RULE: 0.85,
} as const;

/**
 * Provider names (for type safety)
 */
export const PROVIDERS = {
  OPENAI: "openai",
  GEMINI: "gemini",
} as const;

