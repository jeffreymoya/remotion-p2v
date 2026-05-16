export const DEEPSEEK_MODEL = "deepseek-v4-pro" as const;
export const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1" as const;
export const CODE_GEN_TEMPERATURE = 0.3;

export const NARRATION_REASONING = {
  effort: "low" as const,
  thinking: { type: "disabled" as const },
};

// ── Network timeouts (ms) ──────────────────────────────────────────────
export const DEEPSEEK_TIMEOUT_MS = validateTimeout("DEEPSEEK_TIMEOUT_MS", 300_000);
export const PIXABAY_TIMEOUT_MS = validateTimeout("PIXABAY_TIMEOUT_MS", 30_000);
export const GOOGLE_TTS_TIMEOUT_MS = validateTimeout("GOOGLE_TTS_TIMEOUT_MS", 60_000);

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

export const PIXABAY_VIDEOS_BASE_URL = "https://pixabay.com/api/videos/" as const;
export const PIXABAY_VIDEO_PER_PAGE = 50 as const;
export const PIXABAY_COOLDOWN_RUNS = 10 as const;

// ── Pexels ──────────────────────────────────────────────────────────────
export const PEXELS_VIDEOS_BASE_URL = "https://api.pexels.com/videos/search" as const;
export const PEXELS_VIDEO_PER_PAGE = 50 as const;

// ── Google TTS / STT / Vision ───────────────────────────────────
export const GOOGLE_TTS_BASE_URL = "https://texttospeech.googleapis.com/v1" as const;
export const GOOGLE_STT_BASE_URL = "https://speech.googleapis.com/v1" as const;
export const GOOGLE_VISION_BASE_URL = "https://vision.googleapis.com/v1" as const;
export const GOOGLE_VISION_TIMEOUT_MS = validateTimeout("GOOGLE_VISION_TIMEOUT_MS", 15_000);
export const GOOGLE_VISION_BATCH_SIZE = 16 as const; // Vision API max per batch request
export const GOOGLE_TTS_VOICE_NAME = process.env.GOOGLE_TTS_VOICE_NAME ?? "en-US-Chirp3-HD-Algieba" as const;
export const GOOGLE_TTS_LANGUAGE_CODE = "en-US" as const;
export const GOOGLE_TTS_SAMPLE_RATE = 24000 as const;
export const AUDIO_DIR = "public/audio" as const;

// ── Narration gate thresholds ───────────────────────────────────────────
export const REFINE_MAX_REVISIONS = 2;
export const SIMPLICITY_FK_GRADE_MAX = 8.0;
export const SIMPLICITY_UNCOMMON_WORD_PCT_MAX = 5.0;
export const SERMON_RATIO_DIRECT_ADDRESS_MAX = 0.30;
export const SPECIFICITY_MIN_NAMED_ENTITIES = 2;
export const SPECIFICITY_MIN_DATED_MOMENTS = 1;
export const PROSODY_MIN_MARKS = 3;
export const PROSODY_MIN_DISTINCT_MARK_TYPES = 2;

// ── LLM judge gates ─────────────────────────────────────────────────────
export const REFINE_MAX_LLM_CALLS_PER_GATE = 2;
export const FRESHNESS_GATE_SEVERITY: "warn" | "block" =
  (process.env.FRESHNESS_GATE_SEVERITY as "warn" | "block") ?? "warn";

// ── Cross-chapter proofreader ───────────────────────────────────────────
export const PROOFREAD_MAX_REDRAFTS_PER_CHAPTER = 1;

// ── Research phase ──────────────────────────────────────────────────────
export const EXA_API_KEY = process.env.EXA_API_KEY;
export const SEARCH_TIMEOUT_MS = validateTimeout("SEARCH_TIMEOUT_MS", 20_000);
export const RESEARCH_TARGET_ANCHOR_COUNT = 16;
export const RESEARCH_MIN_ANCHOR_COUNT = 8;
export const RESEARCH_BRAINSTORM_OVERSAMPLE = 2.5;
export const RESEARCH_VERIFY_CONCURRENCY = 5;
export const RESEARCH_MAX_BRAINSTORM_ROUNDS = 2;
