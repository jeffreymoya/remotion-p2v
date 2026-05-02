import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Database (required)
    STORYFLOW_DATABASE_URL: z.string().min(1),
    DATABASE_URL: z.string().optional(), // Prisma 7 compatibility

    // TTS (required)
    GOOGLE_TTS_API_KEY: z.string().min(1),

    // Stock media (at least one required - validated separately)
    // Deprecated: stock media providers removed. Left undocumented intentionally.

    // AI (optional - uses Gemini CLI)
    GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
    GEMINI_FALLBACK_MODEL: z.string().default("gemini-2.5-flash"),
    GEMINI_PRO_MODEL: z.string().default("gemini-2.5-pro"),
    GEMINI_PRO_FALLBACK_MODEL: z.string().default("gemini-2.5-pro"),
    BOARDS_AI_PROVIDER: z.string().optional(),
    AI_PROVIDER: z.string().optional(),

    // Logging
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },

  client: {},

  runtimeEnv: {
    STORYFLOW_DATABASE_URL: process.env.STORYFLOW_DATABASE_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    GOOGLE_TTS_API_KEY: process.env.GOOGLE_TTS_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    GEMINI_FALLBACK_MODEL: process.env.GEMINI_FALLBACK_MODEL,
    GEMINI_PRO_MODEL: process.env.GEMINI_PRO_MODEL,
    GEMINI_PRO_FALLBACK_MODEL: process.env.GEMINI_PRO_FALLBACK_MODEL,
    BOARDS_AI_PROVIDER: process.env.BOARDS_AI_PROVIDER,
    AI_PROVIDER: process.env.AI_PROVIDER,
    LOG_LEVEL: process.env.LOG_LEVEL,
    NODE_ENV: process.env.NODE_ENV,
  },

  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});

// Stock media providers are deprecated; no runtime validation remains.
