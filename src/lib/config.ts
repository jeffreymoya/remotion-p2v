export const DEEPSEEK_MODEL = "deepseek-v4-pro" as const;
export const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1" as const;
export const CODE_GEN_TEMPERATURE = 0.3;

export const NARRATION_REASONING = {
  effort: "low" as const,
  thinking: { type: "disabled" as const },
};

// ── Network timeouts (ms) ──────────────────────────────────────────────
export const DEEPSEEK_TIMEOUT_MS = validateTimeout("DEEPSEEK_TIMEOUT_MS", 600_000);
export const PIXABAY_TIMEOUT_MS = validateTimeout("PIXABAY_TIMEOUT_MS", 30_000);
export const GOOGLE_TTS_TIMEOUT_MS = validateTimeout("GOOGLE_TTS_TIMEOUT_MS", 120_000);

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
export const PEXELS_IMAGES_BASE_URL = "https://api.pexels.com/v1/search" as const;
export const PEXELS_IMAGE_PER_PAGE = 10 as const;

// ── Google TTS / STT / Vision ───────────────────────────────────
export const GOOGLE_TTS_BASE_URL = "https://texttospeech.googleapis.com/v1" as const;
export const GOOGLE_STT_BASE_URL = "https://speech.googleapis.com/v1" as const;
export const GOOGLE_VISION_BASE_URL = "https://vision.googleapis.com/v1" as const;
export const GOOGLE_VISION_TIMEOUT_MS = validateTimeout("GOOGLE_VISION_TIMEOUT_MS", 15_000);
export const GOOGLE_VISION_BATCH_SIZE = 16 as const; // Vision API max per batch request
export const GOOGLE_TTS_VOICE_NAME = process.env.GOOGLE_TTS_VOICE_NAME ?? "en-US-Chirp3-HD-Algieba" as const;

// ── Documentary TTS ────────────────────────────────────────────────────────
export const DOCU_TTS_VOICE = process.env.DOCU_TTS_VOICE ?? "en-US-Chirp3-HD-Charon";
export const DOCU_TTS_SPEAKING_RATE = 1.0;
export const GOOGLE_TTS_LANGUAGE_CODE = "en-US" as const;
export const GOOGLE_TTS_SAMPLE_RATE = 24000 as const;
export const AUDIO_DIR = "public/audio" as const;

// ── TTS provider selection ──────────────────────────────────────────────
export type TtsProvider = "google" | "elevenlabs";
const rawProvider = process.env.TTS_PROVIDER ?? "google";
if (rawProvider !== "google" && rawProvider !== "elevenlabs") {
  console.error(`TTS_PROVIDER must be "google" or "elevenlabs", got: "${rawProvider}"`);
  process.exit(1);
}
export const TTS_PROVIDER: TtsProvider = rawProvider as TtsProvider;

// ── ElevenLabs ──────────────────────────────────────────────────────────
export const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1" as const;
export const ELEVENLABS_TIMEOUT_MS = validateTimeout("ELEVENLABS_TIMEOUT_MS", 60_000);
export const ELEVENLABS_MODEL_ID =
  process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2";

// ── LangSmith tracing ──────────────────────────────────────────────────
export const LANGSMITH_TRACING_ENABLED =
  process.env.LANGSMITH_TRACING !== "false";

// ── Narration gate thresholds ───────────────────────────────────────────
export const REFINE_MAX_REVISIONS = 2;
export const SIMPLICITY_FK_GRADE_MAX = 11.0;
export const SIMPLICITY_UNCOMMON_WORD_PCT_MAX = 5.0;
export const SERMON_RATIO_DIRECT_ADDRESS_MAX = 0.35;
export const SPECIFICITY_MIN_NAMED_ENTITIES = 2;
export const SPECIFICITY_MIN_DATED_MOMENTS = 1;
export const PROSODY_MIN_MARKS = 3;
export const PROSODY_MIN_DISTINCT_MARK_TYPES = 2;
export const PROSODY_MIN_LONG_PAUSES = 1;

// ── LLM judge gates ─────────────────────────────────────────────────────
export const REFINE_MAX_LLM_CALLS_PER_GATE = 2;
// More positive-attractor gates means each chapter can spend more LLM budget.
export const RESONANCE_MIN_INTENSITY = 2;
export const RECOGNITION_REQUIRED = true;
export const SENSORY_MIN_CHANNELS = 1;
export const EARNED_WISDOM_REQUIRED = true;
export const MAX_ANCHORS_PER_CHAPTER = 4;

// ── Cross-chapter proofreader ───────────────────────────────────────────
export const PROOFREAD_MAX_REDRAFTS_PER_CHAPTER = 2;

// ── Research phase ──────────────────────────────────────────────────────
export const EXA_API_KEY = process.env.EXA_API_KEY;
export const SERPER_API_KEY = process.env.SERPER_API_KEY;
export const SEARCH_TIMEOUT_MS = validateTimeout("SEARCH_TIMEOUT_MS", 20_000);
export const RESEARCH_BRAINSTORM_TIMEOUT_MS = validateTimeout(
  "RESEARCH_BRAINSTORM_TIMEOUT_MS",
  600_000,
);
export const RESEARCH_TARGET_ANCHOR_COUNT = 16;
export const RESEARCH_MIN_ANCHOR_COUNT = 8;
export const RESEARCH_BRAINSTORM_OVERSAMPLE = 1.8;
export const RESEARCH_VERIFY_CONCURRENCY = 5;
export const RESEARCH_MAX_BRAINSTORM_ROUNDS = 2;

// ── Shot layer timing ──────────────────────────────────────────────────
export const IMAGE_SHOT_TARGET_SECONDS = 3; // bloomberg rapid cut — images only
export const VIDEO_SHOT_TARGET_SECONDS = 8; // cinematic hold — video clips
export const SHOT_TARGET_SECONDS = IMAGE_SHOT_TARGET_SECONDS; // backwards compat
export const SHOT_MAX_SECONDS = 5;
export const SHOT_MIN_SECONDS = 2;
