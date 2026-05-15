export const DEEPSEEK_MODEL = "deepseek-v4-pro" as const;
export const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1" as const;
export const CODE_GEN_TEMPERATURE = 0.3;

export const CODE_GEN_REASONING = {
  effort: "medium" as const,
  thinking: { type: "disabled" as const },
};

export const NARRATION_REASONING = {
  effort: "low" as const,
  thinking: { type: "disabled" as const },
};

export const OUTPUT_DIR = "src/compositions" as const;
export const BARREL_PATH = "src/compositions/index.ts" as const;

export const IMAGE_FETCH_REASONING = {
  effort: "medium" as const,
  thinking: { type: "disabled" as const },
};

export const IMAGE_FETCH_TEMPERATURE = 0.3;

export const IMAGES_DIR = "public/images" as const;
export const NARRATIVE_CHECK_TEMPERATURE = 0.7;

export const NARRATIVE_CHECK_REASONING = {
  effort: "high" as const,
  thinking: { type: "enabled" as const },
};

export const SCENE_JSON_DIR = "prompts" as const;
export const SCENE_MODULE_PATH = "src/generated/scene-scripts.ts" as const;

function validateConcurrency(envName: string, defaultValue: number): number {
  const raw = process.env[envName];
  if (raw === undefined) return defaultValue;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) {
    console.error(`${envName} must be a positive integer, got: ${raw}`);
    process.exit(1);
  }
  return Math.floor(parsed);
}

export const DEEPSEEK_CONCURRENCY = validateConcurrency("DEEPSEEK_CONCURRENCY", 3);
export const TTS_CONCURRENCY = validateConcurrency("TTS_CONCURRENCY", 2);

// ── Runware (text-to-image) ─────────────────────────────────────────────
export type ModelTier = "basic" | "complex" | "portrait";

export const MODEL_TIER_MAP: Record<ModelTier, string> = {
  basic: "runware:100@1",    // FLUX.1 schnell
  complex: "runware:400@1",  // FLUX.2 [dev]
  portrait: "runware:400@1", // FLUX.2 [dev]
} as const;

export const RUNWARE_FLUX_SCHNELL_MODEL = MODEL_TIER_MAP.basic;
export const RUNWARE_BACKGROUND_REMOVAL_MODEL = "runware:112@5" as const; // BiRefNet General

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:2" | "21:9";

export const ASPECT_RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  "1:1":  { width: 1024, height: 1024 },
  "16:9": { width: 1024, height: 576 },
  "9:16": { width: 576,  height: 1024 },
  "4:3":  { width: 1024, height: 768 },
  "3:2":  { width: 1024, height: 640 },
  "21:9": { width: 1024, height: 448 },
} as const;

export type StylePreset =
  | "editorial-photoreal"
  | "cinematic"
  | "flat-illustration"
  | "3d-render";

export const STYLE_PRESETS: Record<StylePreset, string> = {
  "editorial-photoreal":
    "photorealistic, editorial photography, professional studio lighting, sharp focus, 8k",
  cinematic:
    "cinematic shot, dramatic lighting, film grain, anamorphic bokeh, movie still",
  "flat-illustration":
    "flat design, minimal illustration, clean geometric shapes, 2D vector style",
  "3d-render":
    "3D render, studio lighting, physically-based rendering, clean background, high detail",
} as const;

export const DEFAULT_STYLE: StylePreset = "editorial-photoreal";

// ── Network timeouts (ms) ──────────────────────────────────────────────
export const DEEPSEEK_TIMEOUT_MS = validateTimeout("DEEPSEEK_TIMEOUT_MS", 300_000);
export const PIXABAY_TIMEOUT_MS = validateTimeout("PIXABAY_TIMEOUT_MS", 30_000);
export const RUNWARE_CONNECT_TIMEOUT_MS = validateTimeout("RUNWARE_CONNECT_TIMEOUT_MS", 15_000);
export const RUNWARE_GENERATE_TIMEOUT_MS = validateTimeout("RUNWARE_GENERATE_TIMEOUT_MS", 60_000);
export const GOOGLE_TTS_TIMEOUT_MS = validateTimeout("GOOGLE_TTS_TIMEOUT_MS", 30_000);
export const BATCH_TIMEOUT_MS = validateTimeout("BATCH_TIMEOUT_MS", 600_000);
export const CONCURRENCY_QUEUE_TIMEOUT_MS = validateTimeout("CONCURRENCY_QUEUE_TIMEOUT_MS", 300_000);

function validateTimeout(envName: string, defaultValue: number): number {
  const raw = process.env[envName];
  if (raw === undefined) return defaultValue;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1000) {
    console.error(`${envName} must be a positive integer >= 1000, got: ${raw}`);
    process.exit(1);
  }
  return Math.floor(parsed);
}

// ── Pixabay ─────────────────────────────────────────────────────────────
export const PIXABAY_BASE_URL = "https://pixabay.com/api/" as const;
export const PIXABAY_VIDEOS_BASE_URL = "https://pixabay.com/api/videos/" as const;

// ── Google TTS / STT ────────────────────────────────────────────
export const GOOGLE_TTS_BASE_URL = "https://texttospeech.googleapis.com/v1" as const;
export const GOOGLE_STT_BASE_URL = "https://speech.googleapis.com/v1" as const;
export const GOOGLE_TTS_VOICE_NAME = process.env.GOOGLE_TTS_VOICE_NAME ?? "en-US-Chirp3-HD-Algieba" as const;
export const GOOGLE_TTS_LANGUAGE_CODE = "en-US" as const;
export const GOOGLE_TTS_SAMPLE_RATE = 24000 as const;
export const AUDIO_DIR = "public/audio" as const;
