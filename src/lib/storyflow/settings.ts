import { storyflowPrisma } from "./prisma";

const DEFAULT_SETTINGS = {
  ai: {
    provider: "gemini-cli",
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-pro",
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
} as const;

export type AppSettings = typeof DEFAULT_SETTINGS;

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

export async function updateSettings(payload: Partial<AppSettings>) {
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
