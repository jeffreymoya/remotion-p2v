import { NextResponse } from "next/server";
import { z } from "zod";

import { NotFoundError, parseBody, withErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { fromJsonArray, toJsonArray } from "@/src/lib/storyflow/prisma-json";
import { audioFileExists, generateAudioForSegment } from "@/src/lib/storyflow/tts";
import type { ScriptSegment } from "@/src/lib/storyflow/types";

const requestSchema = z.object({
  projectId: z.string().min(1),
  segmentIndex: z.number().int().nonnegative(),
  force: z.boolean().optional(),
});

export const POST = withErrorHandler(async (req: Request) => {
  const { projectId, segmentIndex, force = false } = await parseBody(req, requestSchema);

  const script = await storyflowPrisma.script.findByProjectIdOrThrow(projectId);

  const segments = fromJsonArray<ScriptSegment>(script.segments);
  const segment = segments.find(
    (seg) => seg.index === segmentIndex
  );

  if (!segment) {
    throw new NotFoundError("Segment", `${projectId}:${segmentIndex}`);
  }

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
      segments: toJsonArray(
        segments.map((seg) =>
          seg.index === segmentIndex ? updatedSegment : seg
        )
      ),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ segment: updatedSegment });
}, "tts/generate");
