import { NextResponse } from "next/server";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { recordScriptDraftHistory } from "@/src/lib/storyflow/history";
import { executeBeat, type Beat, type BeatDraft } from "@/src/lib/storyflow/script-builder";

/**
 * POST /api/script-builder/execute/[draftId]/resume
 * Resume execution from last checkpoint after a failure
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;

  try {
    // Find script draft with blueprint
    const scriptDraft = await storyflowPrisma.scriptDraft.findUnique({
      where: { id: draftId },
      include: {
        blueprint: true,
      },
    });

    if (!scriptDraft) {
      return NextResponse.json({ error: "Script draft not found" }, { status: 404 });
    }

    if (scriptDraft.status !== "FAILED" && scriptDraft.status !== "DRAFTING") {
      return NextResponse.json(
        { error: "Draft is not in a resumable state" },
        { status: 400 }
      );
    }

    const beats = scriptDraft.blueprint.beats as Beat[];
    const existingBeatDrafts = scriptDraft.beatDrafts as BeatDraft[];

    // Resume from the current beat index
    const startIndex = scriptDraft.currentBeatIndex;

    if (startIndex >= beats.length) {
      return NextResponse.json(
        { error: "All beats already completed" },
        { status: 400 }
      );
    }

    // Build previous content from completed beats
    let previousContent = existingBeatDrafts
      .map((bd) => bd.text)
      .join("\n\n");

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
            beatDrafts,
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
  } catch (error) {
    console.error("[api/script-builder/execute/resume] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to resume script execution",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
