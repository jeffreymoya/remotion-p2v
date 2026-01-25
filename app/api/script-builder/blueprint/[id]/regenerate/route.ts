import { NextResponse } from "next/server";
import { z } from "zod";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { recordBlueprintHistory } from "@/src/lib/storyflow/history";
import { regenerateBlueprint } from "@/src/lib/storyflow/script-builder";

const requestSchema = z.object({
  rejectionNotes: z.string().optional(),
});

/**
 * POST /api/script-builder/blueprint/[id]/regenerate
 * Regenerate a blueprint with feedback
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const json = await req.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { rejectionNotes } = parsed.data;

  try {
    // Find existing blueprint
    const oldBlueprint = await storyflowPrisma.blueprint.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!oldBlueprint) {
      return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
    }

    // Use stored rejection notes if none provided in request
    const combinedNotes =
      rejectionNotes || oldBlueprint.rejectionNotes || "User requested regeneration";

    // Archive old blueprint
    const archivedBlueprint = await storyflowPrisma.blueprint.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionNotes: combinedNotes,
      },
    });
    await recordBlueprintHistory(archivedBlueprint, "archived_for_regeneration");

    // Generate new blueprint
    const topic = oldBlueprint.project.topic || "Untitled";
    const blueprintData = await regenerateBlueprint(
      oldBlueprint.projectId,
      topic,
      oldBlueprint.targetDurationMs,
      combinedNotes
    );
    const beatsWithStatus = blueprintData.beats.map((beat, i) => ({
      ...beat,
      index: beat.index ?? i + 1,
      reviewStatus: "pending",
      reviewNotes: null,
    }));

    // Create new version
    const newBlueprint = await storyflowPrisma.blueprint.create({
      data: {
        projectId: oldBlueprint.projectId,
        targetDurationMs: oldBlueprint.targetDurationMs,
        status: "PENDING_REVIEW",
        beats: beatsWithStatus,
        version: oldBlueprint.version + 1,
      },
    });
    await recordBlueprintHistory(newBlueprint, `regenerated_v${newBlueprint.version}`);

    return NextResponse.json({
      blueprint: newBlueprint,
      message: `Blueprint regenerated (v${newBlueprint.version})`,
    });
  } catch (error) {
    console.error("[api/script-builder/blueprint/regenerate] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to regenerate blueprint",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
