import fs from "node:fs";
import { isArtifactReady } from "./scene-manifest";
import { parseImageFetchResponse } from "./build-image-fetch-prompt";
import type { ImageFetchItem } from "./build-image-fetch-prompt";
import type { DownloadResult } from "./download-images";

export function mergeDownloadResults(
  items: ImageFetchItem[],
  results: DownloadResult[],
): ImageFetchItem[] {
  const byLabel = new Map(results.map((result) => [result.label, result]));
  return items.map((item) => {
    const result = byLabel.get(item.label);
    if (!result) return item;
    const resolvedItem: ImageFetchItem = {
      ...item,
      image_url: result.ok ? (result.url ?? "") : (item.image_url ?? ""),
      source_url: result.ok
        ? (result.sourceUrl ?? item.source_url ?? "")
        : (item.source_url ?? ""),
    };
    if (result.ok) {
      resolvedItem.resolved_path = result.path;
      delete resolvedItem.resolution_error;
    } else {
      resolvedItem.resolution_error = result.error ?? "image resolution failed";
      delete resolvedItem.resolved_path;
    }
    return resolvedItem;
  });
}

export function loadCodeImageItems(imagePlanPath: string): ImageFetchItem[] {
  if (!isArtifactReady(imagePlanPath)) {
    console.warn(
      `Image plan not found or incomplete: ${imagePlanPath}. Code generation will rely on the prompt only.`,
    );
    return [];
  }
  try {
    const raw = fs.readFileSync(imagePlanPath, "utf-8");
    const items = parseImageFetchResponse(raw);
    const availableItems = items.filter(
      (item) => !item.resolution_error && (item.cutout_path || item.resolved_path),
    );
    const skipped = items.length - availableItems.length;
    console.log(
      `Loaded image asset manifest: ${imagePlanPath} (${availableItems.length} available${skipped > 0 ? `, ${skipped} skipped` : ""})\n`,
    );
    return availableItems;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `Could not parse image plan: ${imagePlanPath} (${message}). Code generation will rely on the prompt only.`,
    );
    return [];
  }
}
