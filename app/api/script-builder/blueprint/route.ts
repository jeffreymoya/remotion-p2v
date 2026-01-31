import { NextResponse } from "next/server";
import { z } from "zod";

import { parseBody, withErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { recordBlueprintHistory } from "@/src/lib/storyflow/history";
import { generateBlueprint, calculateBeatCount } from "@/src/lib/storyflow/script-builder";

const requestSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  topic: z.string().min(1, "topic is required").max(500),
  targetDurationMs: z.number().int().positive(),
});

/**
 * POST /api/script-builder/blueprint
 * Generate a new engagement blueprint
 */
export const POST = withErrorHandler(async (req: Request) => {
  const { projectId, topic, targetDurationMs } = await parseBody(req, requestSchema);

  // Verify project exists
  const project = await storyflowPrisma.project.findByIdOrThrow(projectId);

  // Calculate beat count
  const beatCount = calculateBeatCount(targetDurationMs);

  // Generate blueprint
  const blueprintData = await generateBlueprint(projectId, topic, targetDurationMs);
  const beatsWithStatus = blueprintData.beats.map((beat, i) => ({
    ...beat,
    index: beat.index ?? i + 1,
    reviewStatus: "pending",
    reviewNotes: null,
  }));

  // Save to database
  const blueprint = await storyflowPrisma.blueprint.create({
    data: {
      projectId,
      targetDurationMs,
      status: "PENDING_REVIEW",
      beats: beatsWithStatus,
      version: 1,
    },
  });

  // Update project topic if different
  if (topic !== project.topic) {
    await storyflowPrisma.project.update({
      where: { id: projectId },
      data: { topic },
    });
  }

  await recordBlueprintHistory(blueprint, "created");

  return NextResponse.json({
    blueprint,
    message: `Blueprint generated with ${beatCount} beats`,
  });
}, "script-builder/blueprint");
