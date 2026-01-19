import { NextResponse } from "next/server";
import { z } from "zod";

import { startRenderJob } from "@/src/lib/storyflow/render";

const requestSchema = z.object({
  projectId: z.string().min(1),
  quality: z.enum(["DRAFT", "MEDIUM", "HIGH", "PRODUCTION"]).optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const render = await startRenderJob(parsed.data.projectId, parsed.data.quality ?? "DRAFT");
    return NextResponse.json(render);
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    return NextResponse.json({ error: error.message ?? "Failed to start render" }, { status });
  }
}
