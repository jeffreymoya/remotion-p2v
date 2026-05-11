import fs from "node:fs";
import { isArtifactReady } from "./scene-manifest";
import { parseImageFetchResponse } from "./build-image-fetch-prompt";
import type { ImageFetchItem } from "./build-image-fetch-prompt";
import type { AcquireResult } from "./acquire-images";

export function mergeAcquireResults(
  items: ImageFetchItem[],
  results: AcquireResult[],
): ImageFetchItem[] {
  const byLabel = new Map(results.map((result) => [result.label, result]));
  return items.map((item) => {
    const result = byLabel.get(item.label);
    if (!result) return item;
    if (result.ok && result.path) {
      return {
        ...item,
        resolved_path: result.path,
        runware_image_uuid: result.runwareImageUUID ?? item.runware_image_uuid,
        background_removed:
          result.backgroundRemoved ?? item.background_removed,
        background_removal_model:
          result.backgroundRemovalModel ?? item.background_removal_model,
        background_removal_error:
          result.backgroundRemovalError ?? item.background_removal_error,
        resolution_error: result.backgroundRemovalError
          ? undefined
          : item.resolution_error,
      };
    }
    return {
      ...item,
      resolution_error: result.error ?? "image acquisition failed",
      resolved_path: undefined,
      runware_image_uuid: result.runwareImageUUID ?? item.runware_image_uuid,
      background_removed:
        result.backgroundRemoved ?? item.background_removed,
      background_removal_model:
        result.backgroundRemovalModel ?? item.background_removal_model,
      background_removal_error:
        result.backgroundRemovalError ?? item.background_removal_error,
    };
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
      (item) => !item.resolution_error && item.resolved_path,
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
