import { storyflowPrisma } from "./prisma";
import { env } from "@/src/env";

export type AppSettings = {
  ai: {
    provider: "gemini-cli" | "claude-code";
    model: string;
    fallbackModel: string;
    proModel: string;
    proFallbackModel: string;
    temperature: number;
  };
  tts: {
    voice: string;
    speakingRate: number;
    pitch: number;
  };
  render: {
    defaultQuality: "draft" | "medium" | "high" | "production";
    defaultAspectRatio: "16:9" | "9:16";
  };
};

export const DEFAULT_SETTINGS: AppSettings = {
  ai: {
    provider: "gemini-cli",
    // Flash tier - faster, simpler tasks
    model: env.GEMINI_MODEL,
    fallbackModel: env.GEMINI_FALLBACK_MODEL,
    // Pro tier - complex tasks (blueprints, viewport, refinement)
    proModel: env.GEMINI_PRO_MODEL,
    proFallbackModel: env.GEMINI_PRO_FALLBACK_MODEL,
    temperature: 0.7,
  },
  tts: {
    voice: "en-US-Chirp3-HD-Algieba",
    speakingRate: 1.0,
    pitch: 0,
  },
  render: {
    defaultQuality: "draft",
    defaultAspectRatio: "16:9",
  },
};

export async function getSettings(): Promise<AppSettings> {
  const rows = await storyflowPrisma.appSettings.findMany();
  if (!rows.length) return DEFAULT_SETTINGS;

  const values = rows.reduce<Record<string, unknown>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});

  return {
    ai: { ...DEFAULT_SETTINGS.ai, ...(values.ai ?? {}) },
    tts: { ...DEFAULT_SETTINGS.tts, ...(values.tts ?? {}) },
    render: { ...DEFAULT_SETTINGS.render, ...(values.render ?? {}) },
  };
}

export type SettingsPatch = {
  ai?: Partial<AppSettings["ai"]>;
  tts?: Partial<AppSettings["tts"]>;
  render?: Partial<AppSettings["render"]>;
};

export async function updateSettings(payload: SettingsPatch) {
  const current = await getSettings();
  const next = {
    ai: { ...current.ai, ...(payload.ai ?? {}) },
    tts: { ...current.tts, ...(payload.tts ?? {}) },
    render: { ...current.render, ...(payload.render ?? {}) },
  };

  // Upsert by key to keep flexibility
  await storyflowPrisma.$transaction([
    storyflowPrisma.appSettings.upsert({
      where: { key: "ai" },
      update: { value: next.ai },
      create: { key: "ai", value: next.ai },
    }),
    storyflowPrisma.appSettings.upsert({
      where: { key: "tts" },
      update: { value: next.tts },
      create: { key: "tts", value: next.tts },
    }),
    storyflowPrisma.appSettings.upsert({
      where: { key: "render" },
      update: { value: next.render },
      create: { key: "render", value: next.render },
    }),
  ]);

  return next;
}
