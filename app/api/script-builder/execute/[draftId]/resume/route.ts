import { NextResponse } from "next/server";

import { NotFoundError, ValidationError, withErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { recordScriptDraftHistory } from "@/src/lib/storyflow/history";
import { fromJsonArray, toJsonArray } from "@/src/lib/storyflow/prisma-json";
import { executeBeat, type Beat, type BeatDraft } from "@/src/lib/storyflow/script-builder";

/**
 * POST /api/script-builder/execute/[draftId]/resume
 * Resume execution from last checkpoint after a failure
 */
export const POST = withErrorHandler(
  async (_req: Request, { params }: { params: Promise<{ draftId: string }> }) => {
    const { draftId } = await params;

    // Find script draft with blueprint
    const scriptDraft = await storyflowPrisma.scriptDraft.findUnique({
      where: { id: draftId },
      include: {
        blueprint: true,
      },
    });

    if (!scriptDraft) {
      throw new NotFoundError("Script draft", draftId);
    }

    if (scriptDraft.status !== "FAILED" && scriptDraft.status !== "DRAFTING") {
      throw new ValidationError("Draft is not in a resumable state");
    }

    const beats = scriptDraft.blueprint.beats as Beat[];
    const existingBeatDrafts = fromJsonArray<BeatDraft>(scriptDraft.beatDrafts);

    // Resume from the current beat index
    const startIndex = scriptDraft.currentBeatIndex;

    if (startIndex >= beats.length) {
      throw new ValidationError("All beats already completed");
    }

    // Build previous content from completed beats
    let previousContent = existingBeatDrafts.map((bd) => bd.text).join("\n\n");

    // Reset status to DRAFTING
    const resumedDraft = await storyflowPrisma.scriptDraft.update({
      where: { id: draftId },
      data: {
        status: "DRAFTING",
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });
    await recordScriptDraftHistory(resumedDraft, "resume_started");

    const projectId = scriptDraft.blueprint.projectId;
    const beatDrafts = [...existingBeatDrafts];

    try {
      // Continue execution from checkpoint
      for (let i = startIndex; i < beats.length; i++) {
        const beat = beats[i];
        const isFirst = i === 0;
        const isLast = i === beats.length - 1;

        console.log(`[resume] Processing beat ${i + 1}/${beats.length}: ${beat.title}`);

        // Execute beat
        const beatDraft = await executeBeat(
          projectId,
          beat,
          previousContent,
          isFirst,
          isLast,
          beats.length,
          { scriptDraftId: draftId }
        );

        beatDrafts.push(beatDraft);
        previousContent += (previousContent ? "\n\n" : "") + beatDraft.text;

        // Checkpoint: Save progress after each beat
        const checkpoint = await storyflowPrisma.scriptDraft.update({
          where: { id: draftId },
          data: {
            currentBeatIndex: i + 1,
            beatDrafts: toJsonArray(beatDrafts),
            version: { increment: 1 },
            updatedAt: new Date(),
          },
        });
        await recordScriptDraftHistory(checkpoint, `resume_checkpoint_beat_${i + 1}`);

        console.log(`[resume] Beat ${i + 1} completed, checkpoint saved`);
      }

      // Mark as completed
      const completedDraft = await storyflowPrisma.scriptDraft.update({
        where: { id: draftId },
        data: {
          status: "GLUING",
          polishedText: previousContent,
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });
      await recordScriptDraftHistory(completedDraft, "resume_completed");

      return NextResponse.json({
        scriptDraftId: completedDraft.id,
        status: "GLUING",
        resumedFromBeat: startIndex + 1,
        totalBeats: beats.length,
        message: "Script execution resumed; ready for glue phase",
      });
    } catch (error) {
      // Save error state with checkpoint
      const failedDraft = await storyflowPrisma.scriptDraft.update({
        where: { id: draftId },
        data: {
          status: "FAILED",
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });
      await recordScriptDraftHistory(failedDraft, "resume_failed");

      throw error;
    }
  },
  "script-builder/execute/[draftId]/resume"
);
