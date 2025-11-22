import { createHash } from "crypto";

/**
 * Calculate SHA-256 hash of a file from its URL
 * Used for duplicate file detection
 */
export async function calculateFileHash(fileUrl: string): Promise<string> {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hash = createHash("sha256").update(buffer).digest("hex");
    return hash;
  } catch (error) {
    console.error("Error calculating file hash:", error);
    throw error;
  }
}

