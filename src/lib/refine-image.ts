import type { ImageFetchItem } from "./build-image-fetch-prompt";
import {
  buildImageQueryRefinePrompt,
  buildT2iPromptRefinePrompt,
} from "./build-image-query-refine-prompt";
import { deepseekChat } from "./deepseek";
import { IMAGE_FETCH_TEMPERATURE, IMAGE_FETCH_REASONING } from "./config";
import type { StylePreset } from "./config";
import { mergeAcquireResults } from "./image-plan-utils";
import {
  acquireImages as acquireImagesFromSources,
  type AcquireResult,
} from "./acquire-images";
import { parseImageFetchResponse } from "./build-image-fetch-prompt";

const MAX_ATTEMPTS = 2;
const MAX_NETWORK_RETRIES = 2;

type AcquireImagesFn = (
  items: ImageFetchItem[],
  imgDir: string,
  style: StylePreset,
) => Promise<AcquireResult[]>;

export async function refineImages(
  items: ImageFetchItem[],
  imgDir: string,
  narrative: string,
  style: StylePreset,
  options: {
    runDeepSeek: <T>(task: () => Promise<T>) => Promise<T>;
    maxAttempts?: number;
    maxNetworkRetries?: number;
    acquireImages?: AcquireImagesFn;
    verbose?: boolean;
  },
): Promise<{ items: ImageFetchItem[]; results: AcquireResult[] }> {
  const maxAttempts = options.maxAttempts ?? MAX_ATTEMPTS;
  const maxRefineRounds = Math.max(0, maxAttempts - 1);
  const maxNetworkRetries = options.maxNetworkRetries ?? MAX_NETWORK_RETRIES;
  const acquireImages = options.acquireImages ?? acquireImagesFromSources;
  const allResults: AcquireResult[] = [];
  let currentItems = items;
  let refineRounds = 0;
  const networkRetryCounts = new Map<string, number>();
  const terminalFailedLabels = new Set<string>();

  while (true) {
    // Acquire all items that don't have a resolved path yet
    const toAcquire = currentItems.filter(
      (item) => !item.resolved_path && !terminalFailedLabels.has(item.label),
    );
    if (toAcquire.length === 0) break;

    const acquireResults = await acquireImages(toAcquire, imgDir, style);

    // Merge acquire results into items
    currentItems = mergeAcquireResults(currentItems, acquireResults);

    const failures = acquireResults.filter((r) => !r.ok);
    const successes = acquireResults.filter((r) => r.ok);
    for (const result of successes) {
      allResults.push(result);
    }

    const networkFailures = failures.filter((f) =>
      isNetworkFailure(f.error),
    );
    const retryableNetworkFailures: AcquireResult[] = [];
    const terminalFailures: AcquireResult[] = [];
    for (const failure of networkFailures) {
      const retryCount = networkRetryCounts.get(failure.label) ?? 0;
      if (retryCount >= maxNetworkRetries) {
        terminalFailures.push(failure);
        terminalFailedLabels.add(failure.label);
        console.warn(
          `  [retry] ${failure.label}: network failure after ${maxNetworkRetries} retr${maxNetworkRetries === 1 ? "y" : "ies"} (${failure.error ?? "unknown error"})`,
        );
      } else {
        const nextRetryCount = retryCount + 1;
        networkRetryCounts.set(failure.label, nextRetryCount);
        retryableNetworkFailures.push(failure);
        console.warn(
          `  [retry] ${failure.label}: network failure, retry ${nextRetryCount}/${maxNetworkRetries} (${failure.error ?? "unknown error"})`,
        );
      }
    }

    const refinableFailures = failures.filter(
      (f) => !isNetworkFailure(f.error) && hasErrorMessage(f.error),
    );
    const nonRefinableFailures = failures.filter(
      (f) => !isNetworkFailure(f.error) && !hasErrorMessage(f.error),
    );
    for (const failure of nonRefinableFailures) {
      terminalFailures.push(failure);
      terminalFailedLabels.add(failure.label);
      console.warn(
        `  [refine] ${failure.label}: no acquisition error message; not refining`,
      );
    }

    const refinableRetryFailures =
      refineRounds < maxRefineRounds ? refinableFailures : [];

    if (refinableFailures.length > 0 && refinableRetryFailures.length === 0) {
      for (const failure of refinableFailures) {
        terminalFailures.push(failure);
        terminalFailedLabels.add(failure.label);
      }
    }

    for (const failure of terminalFailures) {
      allResults.push(failure);
    }

    const refinableLabels = new Set(
      refinableRetryFailures.map((f) => f.label),
    );
    if (refinableLabels.size === 0) {
      if (retryableNetworkFailures.length === 0) break;
      continue;
    }

    refineRounds++;
    console.log(
      `  [refine] ${refinableLabels.size} failure(s), refining for retry (round ${refineRounds}/${maxRefineRounds})`,
    );

    // Refine non-background items (t2i prompt refinement)
    const failedGenerated = currentItems.filter(
      (i) => refinableLabels.has(i.label) && i.asset_role !== "background",
    );
    if (failedGenerated.length > 0) {
      for (const item of failedGenerated) {
        const failure = refinableRetryFailures.find(
          (f) => f.label === item.label,
        );
        const suggestion =
          failure?.error ?? item.resolution_error ?? "image acquisition failed";

        const { system, user } = buildT2iPromptRefinePrompt(item, suggestion);
        try {
          const response = await options.runDeepSeek(() =>
            deepseekChat(
              [
                { role: "system", content: system },
                { role: "user", content: user },
              ],
              IMAGE_FETCH_TEMPERATURE,
              IMAGE_FETCH_REASONING,
              { metadata: { phase: "refine-t2i" } },
            ),
          );
          const refined = parseRefinedT2iPrompt(response);
          if (refined) {
            currentItems = currentItems.map((i) =>
              i.label === item.label
                ? { ...i, t2i_prompt: refined, resolved_path: undefined, resolution_error: undefined }
                : i,
            );
          }
        } catch (err) {
          console.warn(
            `  [refine] t2i prompt refinement failed for ${item.label}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }

    // Refine background items (query refinement)
    const failedBackgrounds = currentItems.filter(
      (i) => refinableLabels.has(i.label) && i.asset_role === "background",
    );
    if (failedBackgrounds.length > 0) {
      const { system, user } = buildImageQueryRefinePrompt(
        narrative,
        failedBackgrounds,
        failedBackgrounds.map((b) => {
          const failure = refinableRetryFailures.find(
            (f) => f.label === b.label,
          );
          return {
            label: b.label,
            reason:
              failure?.error ?? b.resolution_error ?? "image acquisition failed",
          };
        }),
      );

      try {
        const response = await options.runDeepSeek(() =>
          deepseekChat(
            [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            IMAGE_FETCH_TEMPERATURE,
            IMAGE_FETCH_REASONING,
            { metadata: { phase: "refine-query" } },
          ),
        );
        const refinedItems = parseImageFetchResponse(response);
        currentItems = currentItems.map((item) => {
          const repair = refinedItems.find((r) => r.label === item.label);
          return repair
            ? {
                ...item,
                query: repair.query ?? item.query,
                resolved_path: undefined,
                resolution_error: undefined,
              }
            : item;
        });
      } catch (err) {
        console.warn(
          `  [refine] query refinement failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  return { items: currentItems, results: allResults };
}

function hasErrorMessage(error: string | undefined): boolean {
  return typeof error === "string" && error.trim().length > 0;
}

export function isNetworkFailure(error: string | undefined): boolean {
  const message = error?.trim();
  if (!message) return false;
  const normalized = message.toLowerCase();
  return [
    "aborted",
    "aborterror",
    "connection reset",
    "connection refused",
    "eai_again",
    "econnrefused",
    "econnreset",
    "enotfound",
    "etimedout",
    "fetch failed",
    "network",
    "socket",
    "terminated",
    "timed out",
    "timeout",
    "tls",
    "und_err",
  ].some((needle) => normalized.includes(needle));
}

function parseRefinedT2iPrompt(raw: string): string | undefined {
  const trimmed = raw.trim();
  // Try JSON first
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "string") return parsed;
    if (parsed?.t2i_prompt) return parsed.t2i_prompt;
    if (Array.isArray(parsed) && parsed[0]?.t2i_prompt) return parsed[0].t2i_prompt;
  } catch {
    // Not JSON — treat as raw prompt text
  }
  // If it looks like a prompt (long enough, no JSON markers), use as-is
  if (trimmed.length > 20 && !trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return trimmed;
  }
  return undefined;
}
