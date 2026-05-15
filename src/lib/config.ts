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
export const GOOGLE_TTS_TIMEOUT_MS = validateTimeout("GOOGLE_TTS_TIMEOUT_MS", 30_000);

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

// ── Google TTS / STT ────────────────────────────────────────────
export const GOOGLE_TTS_BASE_URL = "https://texttospeech.googleapis.com/v1" as const;
export const GOOGLE_STT_BASE_URL = "https://speech.googleapis.com/v1" as const;
export const GOOGLE_TTS_VOICE_NAME = process.env.GOOGLE_TTS_VOICE_NAME ?? "en-US-Chirp3-HD-Algieba" as const;
export const GOOGLE_TTS_LANGUAGE_CODE = "en-US" as const;
export const GOOGLE_TTS_SAMPLE_RATE = 24000 as const;
export const AUDIO_DIR = "public/audio" as const;
