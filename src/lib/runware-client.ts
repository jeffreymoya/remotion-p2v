import { traceable } from "langsmith/traceable";
import { Runware } from "@runware/sdk-js";
import type { ImageFetchItem } from "./build-image-fetch-prompt";
import {
  MODEL_TIER_MAP,
  RUNWARE_BACKGROUND_REMOVAL_MODEL,
  ASPECT_RATIO_DIMENSIONS,
  STYLE_PRESETS,
  RUNWARE_CONNECT_TIMEOUT_MS,
  RUNWARE_GENERATE_TIMEOUT_MS,
  type StylePreset,
  type ModelTier,
  type AspectRatio,
} from "./config";

export interface RunwareGenerateResult {
  item: ImageFetchItem;
  imageUUID?: string;
  mediaUUID?: string;
  imageURL?: string;
  model: string;
  ok: boolean;
  error?: string;
}

export interface RunwareBgResult {
  inputImageUUID: string;
  imageUUID?: string;
  imageURL?: string;
  model?: string;
  ok: boolean;
  error?: string;
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    if (typeof e.message === "string") return e.message;
    if (typeof e.error === "string") return e.error;
    if (e.error && typeof e.error === "object") {
      const inner = e.error as Record<string, unknown>;
      if (typeof inner.message === "string") return inner.message;
    }
    try {
      return JSON.stringify(err);
    } catch {
      // fall through
    }
  }
  return String(err);
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  if (ms <= 0) return promise;
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

let _client: InstanceType<typeof Runware> | null = null;

async function getClient(): Promise<InstanceType<typeof Runware>> {
  if (_client) return _client;
  const apiKey = process.env.RUNWARE_API_KEY;
  if (!apiKey) {
    throw new Error("RUNWARE_API_KEY is not set in environment");
  }
  _client = new Runware({ apiKey });
  await withTimeout(
    _client.ensureConnection(),
    RUNWARE_CONNECT_TIMEOUT_MS,
    "Runware connection",
  );
  return _client;
}

export async function disconnectRunware(): Promise<void> {
  if (_client) {
    await _client.disconnect();
    _client = null;
  }
}

function resolveDimensions(
  aspectRatio: AspectRatio | undefined,
): { width: number; height: number } {
  return ASPECT_RATIO_DIMENSIONS[aspectRatio ?? "1:1"];
}

function resolveModel(tier: ModelTier | undefined): string {
  return MODEL_TIER_MAP[tier ?? "complex"];
}

async function generateImagesImpl(
  items: ImageFetchItem[],
  style: StylePreset,
): Promise<RunwareGenerateResult[]> {
  if (items.length === 0) return [];

  const client = await getClient();

  const results = await Promise.allSettled(
    items.map(async (item): Promise<RunwareGenerateResult> => {
      if (!item.t2i_prompt) {
        const model = resolveModel(item.model_tier as ModelTier | undefined);
        return { item, model, ok: false, error: "missing t2i_prompt" };
      }

      const { width, height } = resolveDimensions(item.aspect_ratio as AspectRatio | undefined);
      const model = resolveModel(item.model_tier as ModelTier | undefined);
      const resolvedStyle =
        item.style_preset && item.style_preset in STYLE_PRESETS
          ? item.style_preset
          : style;
      const styleSuffix = STYLE_PRESETS[resolvedStyle];
      const needsBgRemoval = item.needs_background_removal === true || item.needs_cutout === true;
      const bgSuffix = needsBgRemoval
        ? ", isolated on solid bright green background #00FF00, no shadows, no gradients, flat uniform background"
        : "";
      const positivePrompt = `${item.t2i_prompt}, ${styleSuffix}${bgSuffix}`;

      try {
        const images = await withTimeout(
          client.imageInference({
            positivePrompt,
            width,
            height,
            model,
            numberResults: 1,
            outputFormat: "PNG",
            outputType: "URL",
          }),
          RUNWARE_GENERATE_TIMEOUT_MS,
          `Runware image generation (${item.label})`,
        );

        const first = images?.[0];
        if (!first?.imageURL) {
          return {
            item,
            model,
            ok: false,
            error: "no image returned from Runware",
          };
        }

        return {
          item,
          imageUUID: first.imageUUID,
          mediaUUID: first.mediaUUID,
          imageURL: first.imageURL ?? first.mediaURL,
          model,
          ok: true,
        };
      } catch (err) {
        return {
          item,
          model,
          ok: false,
          error: extractErrorMessage(err),
        };
      }
    }),
  );

  return results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : {
          item: items[0],
          model: resolveModel(items[0]?.model_tier as ModelTier | undefined),
          ok: false,
          error: extractErrorMessage(r.reason),
        },
  );
}

async function removeBackgroundsImpl(
  items: RunwareGenerateResult[],
): Promise<RunwareBgResult[]> {
  if (items.length === 0) return [];

  const client = await getClient();

  const results = await Promise.allSettled(
    items.map(async (item): Promise<RunwareBgResult> => {
      // Prefer imageURL as input (most reliable — bypasses UUID namespace issues).
      // Fall back to mediaUUID (new API) then imageUUID (legacy).
      const inputImage = item.imageURL ?? item.mediaUUID ?? item.imageUUID;
      if (!inputImage) {
        return {
          inputImageUUID: item.imageUUID ?? "",
          ok: false,
          error: "missing image reference for background removal",
        };
      }

      try {
        const bgRemoved = await withTimeout(
          client.removeBackground({
            model: RUNWARE_BACKGROUND_REMOVAL_MODEL,
            inputs: { image: inputImage },
            outputFormat: "PNG",
            outputType: "URL",
          }),
          RUNWARE_GENERATE_TIMEOUT_MS,
          `Runware background removal`,
        );

        const first = Array.isArray(bgRemoved) ? bgRemoved[0] : bgRemoved;
        const imageURL = first?.imageURL ?? first?.mediaURL;
        const imageUUID = first?.imageUUID ?? first?.mediaUUID;
        if (!imageURL) {
          return {
            inputImageUUID: item.imageUUID ?? "",
            ok: false,
            error: "no image returned from background removal",
          };
        }

        return {
          inputImageUUID: item.imageUUID ?? "",
          imageUUID,
          imageURL,
          model: RUNWARE_BACKGROUND_REMOVAL_MODEL,
          ok: true,
        };
      } catch (err) {
        return {
          inputImageUUID: item.imageUUID ?? "",
          ok: false,
          error: extractErrorMessage(err),
        };
      }
    }),
  );

  return results.map((r, idx) =>
    r.status === "fulfilled"
      ? r.value
      : {
          inputImageUUID: items[idx].imageUUID ?? "",
          ok: false,
          error: extractErrorMessage(r.reason),
        },
  );
}

export const generateImages = traceable(generateImagesImpl, {
  name: "runware_generate",
  run_type: "tool",
});

export const removeBackgrounds = traceable(removeBackgroundsImpl, {
  name: "runware_bg_removal",
  run_type: "tool",
});
