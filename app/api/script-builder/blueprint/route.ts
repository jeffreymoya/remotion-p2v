import { NextResponse } from "next/server";
import { z } from "zod";
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
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { projectId, topic, targetDurationMs } = parsed.data;

  // Verify project exists
  const project = await storyflowPrisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    // Calculate beat count
    const beatCount = calculateBeatCount(targetDurationMs);

    // Generate blueprint
    const blueprintData = await generateBlueprint(topic, targetDurationMs);
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
  } catch (error) {
    console.error("[api/script-builder/blueprint] Error generating blueprint:", error);
    return NextResponse.json(
      {
        error: "Failed to generate blueprint",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
