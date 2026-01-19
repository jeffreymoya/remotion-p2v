import { NextResponse } from "next/server";
import { z } from "zod";
import { getSettings, updateSettings } from "@/src/lib/storyflow/settings";

const settingsSchema = z.object({
  ai: z
    .object({
      provider: z.enum(["gemini-cli", "claude-code"]).optional(),
      model: z.string().optional(),
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

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PUT(req: Request) {
  const json = await req.json();
  const parsed = settingsSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const settings = await updateSettings(parsed.data);
  return NextResponse.json({ settings });
}
