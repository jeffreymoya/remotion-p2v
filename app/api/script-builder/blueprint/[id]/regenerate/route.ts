import { NextResponse } from "next/server";
import { z } from "zod";

import { parseBody, withErrorHandler } from "@/app/api/lib";
import { recordBlueprintHistory } from "@/src/lib/storyflow/history";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { regenerateBlueprint } from "@/src/lib/storyflow/script-builder";

const requestSchema = z.object({
  rejectionNotes: z.string().optional(),
});

/**
 * POST /api/script-builder/blueprint/[id]/regenerate
 * Regenerate a blueprint with feedback
 */
export const POST = withErrorHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const { rejectionNotes } = await parseBody(req, requestSchema);

    // Find existing blueprint
    const oldBlueprint = await storyflowPrisma.blueprint.findByIdOrThrow(id, {
      include: { project: true },
    });

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
  },
  "script-builder/blueprint/[id]/regenerate"
);
