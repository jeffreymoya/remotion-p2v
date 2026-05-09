export const DEEPSEEK_MODEL = "deepseek-v4-pro" as const;
export const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1" as const;
export const PROMPT_GEN_TEMPERATURE = 0.7;
export const CODE_GEN_TEMPERATURE = 0.3;

export const PROMPT_GEN_REASONING = {
  effort: "high" as const,
  thinking: { type: "enabled" as const },
};

export const CODE_GEN_REASONING = {
  effort: "medium" as const,
  thinking: { type: "disabled" as const },
};

export const OUTPUT_DIR = "src/compositions" as const;
export const BARREL_PATH = "src/compositions/index.ts" as const;

export const EXEMPLAR_COUNT = 2;

export const IMAGE_FETCH_REASONING = {
  effort: "medium" as const,
  thinking: { type: "disabled" as const },
};

export const IMAGE_FETCH_TEMPERATURE = 0.3;

export const IMAGES_DIR = "public/images" as const;
export const DEEPSEEK_RESPONSES_DIR = ".tmp/deepseek-responses" as const;

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
export const IMAGE_DOWNLOAD_CONCURRENCY = validateConcurrency("IMAGE_DOWNLOAD_CONCURRENCY", 5);
export const TTS_CONCURRENCY = validateConcurrency("TTS_CONCURRENCY", 2);

// ── ElevenLabs TTS ──────────────────────────────────────────────────────
export const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1" as const;
export const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "pNInz6obpgDQGcFmaJgB" as const; // "Adam"
export const ELEVENLABS_MODEL_ID = process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2" as const;
export const AUDIO_DIR = "public/audio" as const;
