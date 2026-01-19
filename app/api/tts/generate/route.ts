import { NextResponse } from "next/server";
import { z } from "zod";

import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { audioFileExists, generateAudioForSegment } from "@/src/lib/storyflow/tts";
import type { ScriptSegment } from "@/src/lib/storyflow/types";

const requestSchema = z.object({
  projectId: z.string().min(1),
  segmentIndex: z.number().int().nonnegative(),
  force: z.boolean().optional(),
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

  const { projectId, segmentIndex, force = false } = parsed.data;

  const script = await storyflowPrisma.script.findUnique({
    where: { projectId },
  });

  if (!script) {
    return NextResponse.json(
      { error: "Script not found for project" },
      { status: 404 }
    );
  }

  const segments = script.segments as ScriptSegment[];
  const segment = segments.find(
    (seg) => seg.index === segmentIndex
  );

  if (!segment) {
    return NextResponse.json(
      { error: "Segment not found" },
      { status: 404 }
    );
  }

  try {
    if (!force) {
      const exists = await audioFileExists(projectId, segmentIndex);
      if (exists && segment.audioUrl) {
        return NextResponse.json({ segment }, { status: 200 });
      }
    }

    const { audioUrl, durationMs, timestamps } = await generateAudioForSegment(
      projectId,
      segment
    );

    const updatedSegment = {
      ...segment,
      audioUrl,
      actualDuration: Math.round(durationMs / 1000),
      timestamps,
    };

    await storyflowPrisma.script.update({
      where: { projectId },
      data: {
        segments: segments.map((seg) =>
          seg.index === segmentIndex ? updatedSegment : seg
        ),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ segment: updatedSegment });
  } catch (error) {
    console.error("[api/tts/generate] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate audio" },
      { status: 500 }
    );
  }
}
