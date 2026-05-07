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
