import {
  GOOGLE_VISION_BASE_URL,
  GOOGLE_VISION_TIMEOUT_MS,
  GOOGLE_VISION_BATCH_SIZE,
} from "../config";

// ── Types ─────────────────────────────────────────────────────────────────

export interface VisionScreenItem {
  id: number;
  thumbnailUrl: string;
}

interface LabelAnnotation {
  description: string;
  score: number;
}

interface AnnotateImageResponse {
  labelAnnotations?: LabelAnnotation[];
  error?: { message: string };
}

interface BatchAnnotateImagesResponse {
  responses: AnnotateImageResponse[];
}

// ── Reject labels ─────────────────────────────────────────────────────────
// If any label at score >= REJECT_THRESHOLD matches, the video is rejected.
// All comparisons are lowercased.

const REJECT_THRESHOLD = 0.7;

const REJECT_LABELS = new Set([
  // CGI / rendered
  "robot", "mecha", "cyborg", "android", "fictional character",
  "3d computer graphics", "3d rendering", "rendering", "computer rendering",
  "cg artwork", "digital art", "concept art", "digital painting",
  "illustration", "cartoon", "animation", "animated cartoon",
  // Sci-fi / fantasy
  "science fiction", "fantasy", "superhero", "spacecraft", "extraterrestrial",
  "outer space", "space", "galaxy",
  // Games / toys
  "action figure", "figurine", "toy", "video game", "games",
  // Armor / heavy machinery
  "armour", "armor", "powered exoskeleton",
  // Abstract / motion graphics
  "fractal art", "psychedelic art", "digital compositing",
]);

// ── Core batch call ────────────────────────────────────────────────────────

async function batchAnnotate(
  items: VisionScreenItem[],
  apiKey: string,
): Promise<Map<number, LabelAnnotation[]>> {
  const results = new Map<number, LabelAnnotation[]>();

  // Vision API accepts up to GOOGLE_VISION_BATCH_SIZE images per call
  for (let offset = 0; offset < items.length; offset += GOOGLE_VISION_BATCH_SIZE) {
    const chunk = items.slice(offset, offset + GOOGLE_VISION_BATCH_SIZE);

    const requestBody = {
      requests: chunk.map((item) => ({
        image: { source: { imageUri: item.thumbnailUrl } },
        features: [{ type: "LABEL_DETECTION", maxResults: 20 }],
      })),
    };

    const res = await fetch(
      `${GOOGLE_VISION_BASE_URL}/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(GOOGLE_VISION_TIMEOUT_MS),
      },
    );

    if (!res.ok) {
      throw new Error(`Vision API HTTP ${res.status} ${res.statusText}`);
    }

    const body = (await res.json()) as BatchAnnotateImagesResponse;

    for (let i = 0; i < chunk.length; i++) {
      const item = chunk[i];
      const response = body.responses[i];
      if (response?.error) {
        // Per-image error — treat as pass (don't block on Vision API issues)
        console.warn(
          `  [vision] ⚠ image ${item.id} annotation error: ${response.error.message} — passing through`,
        );
        results.set(item.id, []);
      } else {
        results.set(item.id, response?.labelAnnotations ?? []);
      }
    }
  }

  return results;
}

// ── Public interface ───────────────────────────────────────────────────────

/**
 * Screen a set of video thumbnails using Cloud Vision LABEL_DETECTION.
 * Returns the subset of IDs that pass the visual content gate
 * (real cinematic footage, not CGI / rendered / animated).
 *
 * Gracefully degrades: if GOOGLE_CLOUD_API_KEY is absent or the API
 * call fails, all IDs are returned unchanged (no false rejections).
 */
export async function screenThumbnails(
  items: VisionScreenItem[],
): Promise<Set<number>> {
  const allIds = new Set(items.map((i) => i.id));

  if (items.length === 0) return allIds;

  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) {
    console.warn("  [vision] GOOGLE_CLOUD_API_KEY not set — skipping visual screen");
    return allIds;
  }

  let labelMap: Map<number, LabelAnnotation[]>;
  try {
    labelMap = await batchAnnotate(items, apiKey);
  } catch (err) {
    console.warn(
      `  [vision] batch annotate failed (${err instanceof Error ? err.message : String(err)}) — passing all through`,
    );
    return allIds;
  }

  const passing = new Set<number>();
  for (const [id, labels] of labelMap) {
    const rejected = labels.some(
      (l) => l.score >= REJECT_THRESHOLD && REJECT_LABELS.has(l.description.toLowerCase()),
    );
    if (rejected) {
      const offender = labels.find(
        (l) => l.score >= REJECT_THRESHOLD && REJECT_LABELS.has(l.description.toLowerCase()),
      );
      console.warn(
        `  [vision] ✗ rejected id=${id} — label "${offender?.description}" (score=${offender?.score.toFixed(2)})`,
      );
    } else {
      passing.add(id);
    }
  }

  console.log(
    `  [vision] screened ${items.length} thumbnails: ${passing.size} passed, ${items.length - passing.size} rejected`,
  );
  return passing;
}
