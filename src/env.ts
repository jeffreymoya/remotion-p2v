import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const stockMediaSchema = z.object({
  PEXELS_API_KEY: z.string().optional(),
  UNSPLASH_ACCESS_KEY: z.string().optional(),
  PIXABAY_API_KEY: z.string().optional(),
}).refine(
  (data) => data.PEXELS_API_KEY || data.UNSPLASH_ACCESS_KEY || data.PIXABAY_API_KEY,
  { message: "At least one stock media API key is required (PEXELS_API_KEY, UNSPLASH_ACCESS_KEY, or PIXABAY_API_KEY)" }
);

export const env = createEnv({
  server: {
    // Database (required)
    STORYFLOW_DATABASE_URL: z.string().min(1),
    DATABASE_URL: z.string().optional(), // Prisma 7 compatibility

    // TTS (required)
    GOOGLE_TTS_API_KEY: z.string().min(1),

    // Stock media (at least one required - validated separately)
    PEXELS_API_KEY: z.string().optional(),
    UNSPLASH_ACCESS_KEY: z.string().optional(),
    PIXABAY_API_KEY: z.string().optional(),

    // AI (optional - uses Gemini CLI)
    GEMINI_MODEL: z.string().default("gemini-3-flash"),
    GEMINI_FALLBACK_MODEL: z.string().default("gemini-2.5-flash"),
    GEMINI_PRO_MODEL: z.string().default("gemini-3-pro"),
    GEMINI_PRO_FALLBACK_MODEL: z.string().default("gemini-2.5-pro"),
    BOARDS_AI_PROVIDER: z.string().optional(),
    AI_PROVIDER: z.string().optional(),

    // Feature flags
    ENABLE_SCRIPT_BUILDER: z
      .string()
      .optional()
      .transform((val) => val === "true"),

    // Logging
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },

  client: {
    // Client-side env vars (NEXT_PUBLIC_*)
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  },

  runtimeEnv: {
    STORYFLOW_DATABASE_URL: process.env.STORYFLOW_DATABASE_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    GOOGLE_TTS_API_KEY: process.env.GOOGLE_TTS_API_KEY,
    PEXELS_API_KEY: process.env.PEXELS_API_KEY,
    UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
    PIXABAY_API_KEY: process.env.PIXABAY_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    GEMINI_FALLBACK_MODEL: process.env.GEMINI_FALLBACK_MODEL,
    GEMINI_PRO_MODEL: process.env.GEMINI_PRO_MODEL,
    GEMINI_PRO_FALLBACK_MODEL: process.env.GEMINI_PRO_FALLBACK_MODEL,
    BOARDS_AI_PROVIDER: process.env.BOARDS_AI_PROVIDER,
    AI_PROVIDER: process.env.AI_PROVIDER,
    ENABLE_SCRIPT_BUILDER: process.env.ENABLE_SCRIPT_BUILDER,
    LOG_LEVEL: process.env.LOG_LEVEL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});

// Validate stock media API keys at startup (unless skipped)
if (process.env.SKIP_ENV_VALIDATION !== "true") {
  stockMediaSchema.parse({
    PEXELS_API_KEY: env.PEXELS_API_KEY,
    UNSPLASH_ACCESS_KEY: env.UNSPLASH_ACCESS_KEY,
    PIXABAY_API_KEY: env.PIXABAY_API_KEY,
  });
}

// Derived helpers
export const hasStockMediaApi = () =>
  !!(env.PEXELS_API_KEY || env.UNSPLASH_ACCESS_KEY || env.PIXABAY_API_KEY);

export const getPreferredStockApi = (): "pexels" | "unsplash" | "pixabay" | null => {
  if (env.PEXELS_API_KEY) return "pexels";
  if (env.UNSPLASH_ACCESS_KEY) return "unsplash";
  if (env.PIXABAY_API_KEY) return "pixabay";
  return null;
};
