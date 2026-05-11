import fs from "node:fs";
import path from "node:path";
import { traceable } from "langsmith/traceable";
import type { ImageFetchItem } from "./build-image-fetch-prompt";
import {
  generateImages,
  removeBackgrounds,
  type RunwareGenerateResult,
} from "./runware-client";
import { searchAndDownload } from "./pixabay-client";
import {
  RUNWARE_BACKGROUND_REMOVAL_MODEL,
  RUNWARE_FLUX_SCHNELL_MODEL,
  PIXABAY_TIMEOUT_MS,
  type StylePreset,
} from "./config";

export interface AcquireResult {
  label: string;
  ok: boolean;
  path?: string;
  error?: string;
  runwareImageUUID?: string;
  backgroundRemoved?: boolean;
  backgroundRemovalModel?: string;
  backgroundRemovalError?: string;
}

const USER_AGENT =
  "Mozilla/5.0 (compatible; remotion-p2v-image-resolver/1.0)";

async function downloadUrl(
  url: string,
  destPath: string,
): Promise<{ ok: boolean; error?: string; hasAlpha?: boolean }> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "user-agent": USER_AGENT,
        accept: "image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(PIXABAY_TIMEOUT_MS),
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status} ${res.statusText}` };
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
    return { ok: true, hasAlpha: hasPngAlpha(buffer) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function sanitizeFilename(name: string): string {
  return path.basename(name);
}

function hasPngAlpha(buffer: Buffer): boolean {
  if (
    buffer.length < 33 ||
    buffer.readUInt32BE(0) !== 0x89504e47 ||
    buffer.readUInt32BE(4) !== 0x0d0a1a0a
  ) {
    return false;
  }

  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const nextOffset = dataStart + length + 4;
    if (nextOffset > buffer.length) return false;
    if (type === "IHDR") {
      const colorType = buffer[dataStart + 9];
      if (colorType === 4 || colorType === 6) return true;
    }
    if (type === "tRNS") return true;
    if (type === "IEND") return false;
    offset = nextOffset;
  }

  return false;
}

function needsBackgroundRemoval(item: ImageFetchItem): boolean {
  return item.needs_background_removal === true || item.needs_cutout === true;
}

function shouldRunBackgroundRemoval(result: RunwareGenerateResult): boolean {
  return (
    result.ok &&
    (result.model === RUNWARE_FLUX_SCHNELL_MODEL ||
      needsBackgroundRemoval(result.item))
  );
}

async function acquireImagesImpl(
  items: ImageFetchItem[],
  outputDir: string,
  style: StylePreset,
): Promise<AcquireResult[]> {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const backgrounds = items.filter((i) => i.asset_role === "background");
  const generated = items.filter((i) => i.asset_role !== "background");

  // Fan out background (Pixabay) and generated (Runware) in parallel
  const [bgResults, genResults] = await Promise.all([
    Promise.all(
      backgrounds.map(
        async (item): Promise<AcquireResult> => {
          const destPath = path.join(outputDir, sanitizeFilename(item.label));
          const result = await searchAndDownload(
            item.query ?? item.label,
            destPath,
          );
          return {
            label: item.label,
            ok: result.ok,
            path: result.ok ? destPath : undefined,
            error: result.error,
          };
        },
      ),
    ),
    generateImages(generated, style),
  ]);

  // BiRefNet background removal is mandatory for Flux schnell output and explicit requests.
  const backgroundRemovalItems = genResults.filter(
    (r) => shouldRunBackgroundRemoval(r),
  );
  const bgRemovedResults =
    backgroundRemovalItems.length > 0
      ? await removeBackgrounds(backgroundRemovalItems)
      : [];

  // Build a map of bg-removed results by item label (URL-based input makes UUID unreliable as key).
  const bgRemovedByLabel = new Map(
    backgroundRemovalItems.map((item, i) => [item.item.label, bgRemovedResults[i]]),
  );

  // Download generated images to disk
  const genAcquireResults: AcquireResult[] = await Promise.all(
    genResults.map(
      async (r: RunwareGenerateResult): Promise<AcquireResult> => {
        if (!r.ok || !r.imageURL) {
          return {
            label: r.item.label,
            ok: false,
            error: r.error ?? "generation failed",
          };
        }

        const backgroundRemovalRequired = shouldRunBackgroundRemoval(r);

        // If this item had background removal, use the alpha-capable output.
        let finalURL = r.imageURL;
        let finalUUID = r.imageUUID ?? r.mediaUUID;
        let backgroundRemoved = false;
        let backgroundRemovalError: string | undefined;
        if (backgroundRemovalRequired) {
          const bgResult = bgRemovedByLabel.get(r.item.label);
          if (bgResult?.ok && bgResult.imageURL) {
            finalURL = bgResult.imageURL;
            finalUUID = bgResult.imageUUID;
            backgroundRemoved = true;
          } else if (bgResult && !bgResult.ok) {
            backgroundRemovalError =
              bgResult.error ?? "background removal failed";
          } else {
            backgroundRemovalError = "background removal result missing";
          }
        }

        if (backgroundRemovalError) {
          // Background removal failed, but raw image is available — download it anyway.
          console.warn(
            `  [bg-removal] ${r.item.label}: ${backgroundRemovalError} — using raw PNG`,
          );
          r.item.background_removed = false;
          r.item.background_removal_model = RUNWARE_BACKGROUND_REMOVAL_MODEL;
          r.item.background_removal_error = backgroundRemovalError;

          const destPath = path.join(
            outputDir,
            sanitizeFilename(r.item.label),
          );
          const dl = await downloadUrl(finalURL, destPath);
          if (!dl.ok) {
            return {
              label: r.item.label,
              ok: false,
              error: `download from Runware failed: ${dl.error}`,
              runwareImageUUID: finalUUID,
              backgroundRemoved: false,
              backgroundRemovalModel: RUNWARE_BACKGROUND_REMOVAL_MODEL,
              backgroundRemovalError,
            };
          }

          r.item.runware_image_uuid = finalUUID;
          r.item.resolved_path = destPath;

          return {
            label: r.item.label,
            ok: true,
            path: destPath,
            runwareImageUUID: finalUUID,
            backgroundRemoved: false,
            backgroundRemovalModel: RUNWARE_BACKGROUND_REMOVAL_MODEL,
            backgroundRemovalError,
          };
        }

        const destPath = path.join(
          outputDir,
          sanitizeFilename(r.item.label),
        );
        const dl = await downloadUrl(finalURL, destPath);
        if (!dl.ok) {
          return {
            label: r.item.label,
            ok: false,
            error: `download from Runware failed: ${dl.error}`,
            runwareImageUUID: finalUUID,
            backgroundRemoved,
            backgroundRemovalModel: backgroundRemovalRequired
              ? RUNWARE_BACKGROUND_REMOVAL_MODEL
              : undefined,
          };
        }
        if (backgroundRemovalRequired && !dl.hasAlpha) {
          const error =
            "background removal output is not an alpha PNG";
          r.item.background_removed = false;
          r.item.background_removal_model = RUNWARE_BACKGROUND_REMOVAL_MODEL;
          r.item.background_removal_error = error;
          return {
            label: r.item.label,
            ok: false,
            error,
            runwareImageUUID: finalUUID,
            backgroundRemoved: false,
            backgroundRemovalModel: RUNWARE_BACKGROUND_REMOVAL_MODEL,
            backgroundRemovalError: error,
          };
        }

        // Update item with UUID for potential re-generation
        r.item.runware_image_uuid = finalUUID;
        r.item.background_removed = backgroundRemoved;
        if (backgroundRemovalRequired) {
          r.item.background_removal_model = RUNWARE_BACKGROUND_REMOVAL_MODEL;
          r.item.background_removal_error = undefined;
        }

        return {
          label: r.item.label,
          ok: true,
          path: destPath,
          runwareImageUUID: finalUUID,
          backgroundRemoved,
          backgroundRemovalModel: backgroundRemovalRequired
            ? RUNWARE_BACKGROUND_REMOVAL_MODEL
            : undefined,
        };
      },
    ),
  );

  return [...bgResults, ...genAcquireResults];
}

export const acquireImages = traceable(acquireImagesImpl, {
  name: "acquire_images",
  run_type: "chain",
});
