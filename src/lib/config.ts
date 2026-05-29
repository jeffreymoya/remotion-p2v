export const DEEPSEEK_MODEL = "deepseek-v4-pro" as const;
export const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1" as const;
export const CODE_GEN_TEMPERATURE = 0.3;

export const NARRATION_REASONING = {
  effort: "low" as const,
  thinking: { type: "disabled" as const },
};

// ── LLM provider registry ─────────────────────────────────────────────
export type LlmProviderId = "deepseek" | "openrouter" | "grok";

export interface LlmProviderConfig {
  baseUrl: string;
  apiKeyEnv: string;
  defaultModel: string;
}

export const LLM_PROVIDERS: Record<LlmProviderId, LlmProviderConfig> = {
  deepseek: {
    baseUrl: "https://api.deepseek.com/v1",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    defaultModel: "deepseek-v4-pro",
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    apiKeyEnv: "OPENROUTER_API_KEY",
    defaultModel: "openai/gpt-4o",
  },
  grok: {
    baseUrl: "https://api.x.ai/v1",
    apiKeyEnv: "GROK_API_KEY",
    defaultModel: "grok-4.3",
  },
};

export const LLM_DEFAULT_PROVIDER: LlmProviderId = "grok";

/** Resolve a provider config, falling back to the default. */
export function resolveProvider(providerId?: LlmProviderId): LlmProviderConfig {
  return LLM_PROVIDERS[providerId ?? LLM_DEFAULT_PROVIDER];
}

// ── LLM per-call config ──────────────────────────────────────────────
export interface LlmCallConfig {
  provider?: LlmProviderId;
  temperature?: number;
  /** Flat model override (applies to all providers). Use providerModel for per-provider overrides. */
  model?: string;
  /** Per-provider model override. Higher priority than `model` when the current provider matches. */
  providerModel?: Partial<Record<LlmProviderId, string>>;
  reasoning?: {
    effort?: "low" | "medium" | "high";
    thinking?: "enabled" | "disabled";
  };
  maxTokens?: number;
  maxRetries?: number;
}

/** Resolve the effective model for a given provider from an LlmCallConfig.
 *  Priority: providerModel[providerId] > model > undefined (provider's defaultModel). */
export function resolveEffectiveModel(
  config: LlmCallConfig | undefined,
  providerId: LlmProviderId,
): string | undefined {
  return config?.providerModel?.[providerId] ?? config?.model;
}

/** Default (current behaviour) — low-temp deterministic, thinking disabled */
export const LLM_DEFAULT: LlmCallConfig = {
  temperature: 0.3,
  reasoning: { effort: "high", thinking: "disabled" },
};

/** Narration: moderate creativity, thinking disabled (fast) */
export const LLM_NARRATION: LlmCallConfig = {
  temperature: 0.7,
  reasoning: { effort: "medium", thinking: "disabled" },
};

/** Overlay placement: low-temp, deterministic */
export const LLM_OVERLAY: LlmCallConfig = {
  temperature: 0.3,
  reasoning: { effort: "medium", thinking: "disabled" },
};

/** Metric extraction: very low-temp, no creativity */
export const LLM_METRIC: LlmCallConfig = {
  temperature: 0.1,
  providerModel: { deepseek: "deepseek-v4-flash" },
  reasoning: { effort: "low", thinking: "disabled" },
};

/** Semantic judges (overlay placement, clip relevance): very low-temp, deterministic verdicts */
export const LLM_JUDGE: LlmCallConfig = {
  temperature: 0.1,
  providerModel: { deepseek: "deepseek-v4-flash" },
  reasoning: { effort: "low", thinking: "disabled" },
};

/** Image query generation: moderate, fast */
export const LLM_IMAGE_QUERY: LlmCallConfig = {
  temperature: 0.5,
  providerModel: { deepseek: "deepseek-v4-flash" },
  reasoning: { effort: "low", thinking: "disabled" },
};

/** Segment plan: moderate, structured output */
export const LLM_SEGMENT_PLAN: LlmCallConfig = {
  temperature: 0.4,
  reasoning: { effort: "medium", thinking: "disabled" },
};

// ── Shared pipeline constants ─────────────────────────────────────────
export const FPS = 30 as const;                         // canonical frame rate
export const SENTENCES_PER_MINUTE = 5 as const;         // narration pacing (~8-12s/sentence — infotainment pace)
export const NARRATION_BATCH_SIZE = 10 as const;       // sentences per LLM batch
export const LLM_DEFAULT_MAX_RETRIES = 2 as const;     // callStructured() default
export const SEGMENT_IMAGE_QUERY_CONCURRENCY = 3 as const; // parallel segment queries
export const INTER_SENTENCE_GAP_SECONDS = 0.3 as const;

// ── Network timeouts (ms) ──────────────────────────────────────────────
export const LLM_TIMEOUT_MS = validateTimeout("LLM_TIMEOUT_MS", 600_000);
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
