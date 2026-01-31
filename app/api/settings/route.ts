import { NextResponse } from "next/server";
import { z } from "zod";

import { parseBody, withErrorHandler } from "@/app/api/lib";
import { getSettings, updateSettings } from "@/src/lib/storyflow/settings";

const settingsSchema = z.object({
  ai: z
    .object({
      provider: z.enum(["gemini-cli", "claude-code"]).optional(),
      model: z.string().optional(),
      fallbackModel: z.string().optional(),
      proModel: z.string().optional(),
      proFallbackModel: z.string().optional(),
      temperature: z.number().min(0).max(2).optional(),
    })
    .optional(),
  tts: z
    .object({
      voice: z.string().optional(),
      speakingRate: z.number().min(0.5).max(2).optional(),
      pitch: z.number().min(-20).max(20).optional(),
    })
    .optional(),
  render: z
    .object({
      defaultQuality: z.enum(["draft", "medium", "high", "production"]).optional(),
      defaultAspectRatio: z.enum(["16:9", "9:16"]).optional(),
    })
    .optional(),
});

export const GET = withErrorHandler(async () => {
  const settings = await getSettings();
  return NextResponse.json({ settings });
}, "settings");

export const PUT = withErrorHandler(async (req: Request) => {
  const data = await parseBody(req, settingsSchema);
  const settings = await updateSettings(data);
  return NextResponse.json({ settings });
}, "settings");
