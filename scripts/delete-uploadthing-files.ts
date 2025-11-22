/**
 * Script to delete all files from UploadThing
 * 
 * Usage:
 *   npx tsx scripts/delete-uploadthing-files.ts
 * 
 * Or with confirmation:
 *   npx tsx scripts/delete-uploadthing-files.ts --confirm
 */

import * as dotenv from "dotenv";
import { UTApi } from "uploadthing/server";

dotenv.config({ path: ".env.local" });

async function deleteAllFiles() {
  const utapi = new UTApi();

  try {
    console.log("📋 Fetching all files from UploadThing...");
    const response = await utapi.listFiles();
    
    // Handle different response formats
    const files = Array.isArray(response) ? response : (response as any)?.files || [];
    
    if (!Array.isArray(files) || files.length === 0) {
      console.log("✅ No files found in UploadThing.");
      return;
    }

    console.log(`\n📊 Found ${files.length} file(s):`);
    files.forEach((file: any, index: number) => {
      const name = file.name || file.fileName || "Unknown";
      const key = file.key || file.id || "Unknown";
      const size = file.size || 0;
      console.log(`  ${index + 1}. ${name} (${key}) - ${formatBytes(size)}`);
    });

    // Check for confirmation flag
    // When run via npm: process.argv = [node, script, ...args]
    // When run via tsx: process.argv = [node, tsx, script, ...args]
    // When run via dotenv: process.argv = [node, dotenv, --, tsx, script, ...args]
    const allArgs = process.argv.join(" ");
    const hasConfirm = allArgs.includes("--confirm") || allArgs.includes("-y");
    
    if (!hasConfirm) {
      console.log("\n⚠️  WARNING: This will delete ALL files from UploadThing!");
      console.log("   Run with --confirm or -y flag to proceed.");
      console.log("   Example: npm run delete:uploadthing -- --confirm");
      console.log("   Or: npx tsx scripts/delete-uploadthing-files.ts --confirm");
      return;
    }

    console.log("\n🗑️  Deleting files...");

    // Extract file keys
    const fileKeys = files.map((file: any) => file.key || file.id).filter(Boolean);
    
    if (fileKeys.length === 0) {
      console.log("⚠️  No valid file keys found. Cannot delete files.");
      return;
    }

    // Delete in batches to avoid rate limits
    const batchSize = 10;
    let deleted = 0;
    let failed = 0;

    for (let i = 0; i < fileKeys.length; i += batchSize) {
      const batch = fileKeys.slice(i, i + batchSize);
      
      try {
        await utapi.deleteFiles(batch);
        deleted += batch.length;
        console.log(`  ✅ Deleted batch ${Math.floor(i / batchSize) + 1} (${deleted}/${fileKeys.length})`);
        
        // Small delay between batches to avoid rate limits
        if (i + batchSize < fileKeys.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        failed += batch.length;
        console.error(`  ❌ Failed to delete batch ${Math.floor(i / batchSize) + 1}:`, error);
      }
    }

    console.log(`\n✅ Successfully deleted ${deleted} file(s).`);
    if (failed > 0) {
      console.log(`⚠️  Failed to delete ${failed} file(s).`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

deleteAllFiles();

