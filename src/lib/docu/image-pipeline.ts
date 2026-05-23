// Image download pipeline for documentary compositions.
//
// Extracted from scripts/download-docu-images.ts. Downloads stock images
// from Pexels into public/images/docu/<slug>/ and writes a manifest.

import path from "node:path";
import fs from "node:fs";
import { searchAndDownloadImage } from "../shared/pexels-image-client";

export interface ImageQuery {
  slot: number;
  query: string;
  fallback: string;
}

export interface ImagePipelineResult {
  manifestPath: string;
  downloadedCount: number;
}

export async function runImagePipeline(
  slug: string,
  queries: ImageQuery[],
): Promise<ImagePipelineResult> {
  const outDir = path.join("public/images/docu", slug);
  const manifestPath = `prompts/docu/${slug}-images.json`;

  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });

  const manifest: Array<{ index: number; path: string; query: string; sourceUrl: string }> = [];

  for (const { slot, query, fallback } of queries) {
    const destPath = path.join(outDir, `img-${String(slot).padStart(2, "0")}.jpg`);
    if (fs.existsSync(destPath)) {
      manifest.push({ index: slot, path: destPath, query, sourceUrl: "(cached)" });
      console.log(`CACHED slot ${slot}: ${destPath}`);
      continue;
    }
    console.log(`Downloading slot ${slot}: "${query}"`);
    let result = await searchAndDownloadImage(query, destPath);
    if (!result.ok) {
      console.log(`  Fallback for slot ${slot}: "${fallback}"`);
      result = await searchAndDownloadImage(fallback, destPath);
    }
    if (result.ok) {
      manifest.push({ index: slot, path: result.path!, query, sourceUrl: result.sourceUrl! });
      console.log(`  OK slot ${slot}: ${result.sourceUrl}`);
    } else {
      console.warn(`  SKIP slot ${slot}: ${result.error}`);
    }
  }

  manifest.sort((a, b) => a.index - b.index);
  fs.writeFileSync(manifestPath, JSON.stringify({ slots: manifest }, null, 2));
  console.log(`\nDownloaded ${manifest.length}/${queries.length} images`);
  console.log(`Manifest written to ${manifestPath}`);

  return { manifestPath, downloadedCount: manifest.length };
}
