import path from "node:path";
import { downloadOne } from "./download-images";
import type { DownloadResult } from "./download-images";
import type { ImageFetchItem } from "./build-image-fetch-prompt";
import {
  buildImageFetchRepairPrompt,
  parseImageFetchResponse,
} from "./build-image-fetch-prompt";
import { buildImageQueryRefinePrompt } from "./build-image-query-refine-prompt";
import { visionQa } from "./vision-qa";
import type { VisionQaResult } from "./vision-qa";
import { deepseekChat } from "./deepseek";
import { IMAGE_FETCH_TEMPERATURE, IMAGE_FETCH_REASONING } from "./config";
import { mergeDownloadResults } from "./image-plan-utils";

const MAX_ATTEMPTS = 3;

export async function refineImages(
  items: ImageFetchItem[],
  imgDir: string,
  remotionPrompt: string,
  limiter: <T>(task: () => Promise<T>) => Promise<T>,
  options: {
    runDeepSeek: <T>(task: () => Promise<T>) => Promise<T>;
    maxAttempts?: number;
    verbose?: boolean;
  },
): Promise<{ items: ImageFetchItem[]; results: DownloadResult[] }> {
  const maxAttempts = options.maxAttempts ?? MAX_ATTEMPTS;
  const allResults: DownloadResult[] = [];
  let currentItems = items;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Download all items that don't have a resolved path yet
    const toDownload = currentItems.filter((item) => !item.resolved_path);
    if (toDownload.length === 0) break;

    const downloadResults = await Promise.all(
      toDownload.map((item) => limiter(() => downloadOne(item, imgDir))),
    );

    // Merge download results into items
    currentItems = mergeDownloadResults(currentItems, downloadResults);

    // Separate download successes and failures
    const downloadFailures = downloadResults.filter((r) => !r.ok);
    const downloadSuccesses = downloadResults.filter((r) => r.ok);

    // Run vision QA on successfully downloaded images
    const qaFailures: Array<{
      label: string;
      reason: string;
      suggestion?: string;
      item: ImageFetchItem;
    }> = [];

    for (const result of downloadSuccesses) {
      const item = currentItems.find((i) => i.label === result.label);
      if (!item) continue;

      const qaResult: VisionQaResult = await visionQa(
        result.path,
        item.visual_requirements,
        item.asset_role ?? "unspecified",
      );

      if (qaResult.ok) {
        console.log(`  [vision-qa] OK: ${result.label}`);
        allResults.push(result);
      } else {
        console.log(
          `  [vision-qa] FAIL: ${result.label} — ${qaResult.reason ?? "unknown"}`,
        );
        qaFailures.push({
          label: result.label,
          reason: qaResult.reason ?? "visual mismatch",
          suggestion: qaResult.suggestion,
          item,
        });
        // Clear resolved path so it gets retried
        const idx = currentItems.findIndex((i) => i.label === result.label);
        if (idx !== -1) {
          currentItems = currentItems.map((i, j) =>
            j === idx
              ? {
                  ...i,
                  resolved_path: undefined,
                  resolution_error: `vision QA failed: ${qaResult.reason}`,
                }
              : i,
          );
        }
      }
    }

    // Handle download failures with URL repair (existing dead code, now wired)
    if (downloadFailures.length > 0 && attempt < maxAttempts) {
      const failedItems = currentItems.filter((item) =>
        downloadFailures.some((f) => f.label === item.label),
      );
      const failures = downloadFailures.map((f) => ({
        label: f.label,
        url: f.url,
        error: f.error,
      }));

      console.log(
        `  [refine] ${downloadFailures.length} download failure(s), repairing URLs (attempt ${attempt + 1})`,
      );

      const { system, user } = buildImageFetchRepairPrompt(
        remotionPrompt,
        failedItems,
        failures,
      );

      try {
        const repairResponse = await options.runDeepSeek(() =>
          deepseekChat(
            [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            IMAGE_FETCH_TEMPERATURE,
            IMAGE_FETCH_REASONING,
          ),
        );

        const repairedItems = parseImageFetchResponse(repairResponse);
        currentItems = currentItems.map((item) => {
          const repair = repairedItems.find((r) => r.label === item.label);
          return repair
            ? {
                ...item,
                image_url: repair.image_url,
                source_url: repair.source_url,
                query: repair.query ?? item.query,
                resolved_path: undefined,
                resolution_error: undefined,
              }
            : item;
        });
      } catch (err) {
        console.warn(
          `  [refine] URL repair failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // Handle vision QA failures with query refinement
    if (qaFailures.length > 0 && attempt < maxAttempts) {
      const failedItems = currentItems.filter((item) =>
        qaFailures.some((f) => f.label === item.label),
      );

      console.log(
        `  [refine] ${qaFailures.length} vision QA failure(s), refining queries (attempt ${attempt + 1})`,
      );

      const { system, user } = buildImageQueryRefinePrompt(
        remotionPrompt,
        failedItems,
        qaFailures.map((f) => ({
          label: f.label,
          reason: f.reason,
          suggestion: f.suggestion,
        })),
      );

      try {
        const refineResponse = await options.runDeepSeek(() =>
          deepseekChat(
            [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            IMAGE_FETCH_TEMPERATURE,
            IMAGE_FETCH_REASONING,
          ),
        );

        const refinedItems = parseImageFetchResponse(refineResponse);
        currentItems = currentItems.map((item) => {
          const refined = refinedItems.find((r) => r.label === item.label);
          return refined
            ? {
                ...item,
                image_url: refined.image_url,
                source_url: refined.source_url,
                query: refined.query ?? item.query,
                resolved_path: undefined,
                resolution_error: undefined,
              }
            : item;
        });
      } catch (err) {
        console.warn(
          `  [refine] Query refinement failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // If no failures remain, we're done
    const remaining = currentItems.filter(
      (item) => !item.resolved_path && !allResults.some((r) => r.label === item.label && r.ok),
    );
    if (remaining.length === 0) break;
  }

  // Mark unresolved items
  const finalItems = currentItems.map((item) => {
    if (!item.resolved_path && !allResults.some((r) => r.label === item.label && r.ok)) {
      return {
        ...item,
        resolution_error:
          item.resolution_error ?? `vision QA failed after ${maxAttempts} attempts`,
      };
    }
    return item;
  });

  // Collect all results (successes from allResults + failures)
  const finalResults = finalItems.map((item) => {
    const success = allResults.find((r) => r.label === item.label && r.ok);
    if (success) return success;
    return {
      label: item.label,
      path: path.join(imgDir, item.label),
      ok: false,
      error: item.resolution_error ?? "unresolved",
    };
  });

  return { items: finalItems, results: finalResults };
}
