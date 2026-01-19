import { NextResponse } from "next/server";
import { z } from "zod";

import { generateViewportForProject } from "@/src/lib/storyflow/viewport";

const requestSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  imageAssetId: z.string().min(1, "imageAssetId is required"),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const { viewport, source } = await generateViewportForProject(
      parsed.data.projectId,
      parsed.data.imageAssetId
    );

    return NextResponse.json({ viewport, source });
  } catch (error: unknown) {
    const status = (error as { status?: number })?.status ?? 500;
    const message =
      error instanceof Error ? error.message : "Failed to generate viewport";
    return NextResponse.json({ error: message }, { status });
  }
}
