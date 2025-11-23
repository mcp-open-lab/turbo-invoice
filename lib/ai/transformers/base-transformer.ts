/**
 * Base Schema Transformer Interface
 * Defines the contract for provider-specific schema transformations
 */

export interface SchemaTransformer {
  /**
   * Transform a JSON schema to be compatible with the provider
   */
  transform(schema: any): any;

  /**
   * Check if this transformer supports the given provider
   */
  supports(provider: string): boolean;
}

