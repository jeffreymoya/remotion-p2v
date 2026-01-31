import { NextResponse } from "next/server";
import { z } from "zod";

import { ValidationError, parseBody, withErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { recordScriptDraftHistory } from "@/src/lib/storyflow/history";
import { executeBeat, type Beat, type BeatDraft } from "@/src/lib/storyflow/script-builder";
import { toJsonArray } from "@/src/lib/storyflow/prisma-json";

const requestSchema = z.object({
  blueprintId: z.string().min(1, "blueprintId is required"),
});

/**
 * POST /api/script-builder/execute
 * Execute multi-prompt script generation for all beats
 */
export const POST = withErrorHandler(async (req: Request) => {
  const { blueprintId } = await parseBody(req, requestSchema);

  // Find approved blueprint
  const blueprint = await storyflowPrisma.blueprint.findByIdOrThrow(blueprintId);

  if (blueprint.status !== "APPROVED") {
    throw new ValidationError("Blueprint must be approved before execution");
  }

  const beats = blueprint.beats as Beat[];
  if (!beats || beats.length === 0) {
    throw new ValidationError("Blueprint has no beats");
  }

  // Create script draft
  const scriptDraft = await storyflowPrisma.scriptDraft.create({
    data: {
      blueprintId,
      status: "DRAFTING",
      currentBeatIndex: 0,
      beatDrafts: [],
      version: 1,
    },
  });
  await recordScriptDraftHistory(scriptDraft, "draft_created");

  // Execute beats sequentially with checkpointing
  const projectId = blueprint.projectId;
  const beatDrafts: BeatDraft[] = [];
  let previousContent = "";

  try {
    for (let i = 0; i < beats.length; i++) {
      const beat = beats[i];
      const isFirst = i === 0;
      const isLast = i === beats.length - 1;

      console.log(`[execute] Processing beat ${i + 1}/${beats.length}: ${beat.title}`);

      // Execute beat
      const beatDraft = await executeBeat(
        projectId,
        beat,
        previousContent,
        isFirst,
        isLast,
        beats.length,
        { scriptDraftId: scriptDraft.id }
      );

      beatDrafts.push(beatDraft);
      previousContent += (previousContent ? "\n\n" : "") + beatDraft.text;

      // Checkpoint: Save progress after each beat
      const checkpoint = await storyflowPrisma.scriptDraft.update({
        where: { id: scriptDraft.id },
        data: {
          currentBeatIndex: i + 1,
          beatDrafts: toJsonArray(beatDrafts),
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });
      await recordScriptDraftHistory(checkpoint, `checkpoint_beat_${i + 1}`);

      console.log(`[execute] Beat ${i + 1} completed, checkpoint saved`);
    }

    // Mark as completed
    const completedDraft = await storyflowPrisma.scriptDraft.update({
      where: { id: scriptDraft.id },
      data: {
        status: "GLUING",
        polishedText: previousContent,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });
    await recordScriptDraftHistory(completedDraft, "execution_completed");

    return NextResponse.json({
      scriptDraftId: completedDraft.id,
      status: "GLUING",
      totalBeats: beats.length,
      message: "Script execution completed; ready for glue phase",
    });
  } catch (error) {
    // Save error state with checkpoint
    const failedDraft = await storyflowPrisma.scriptDraft.update({
      where: { id: scriptDraft.id },
      data: {
        status: "FAILED",
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });
    await recordScriptDraftHistory(failedDraft, "execution_failed");

    throw error;
  }
}, "script-builder/execute");
