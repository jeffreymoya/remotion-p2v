import { NextResponse } from "next/server";
import { z } from "zod";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { recordScriptDraftHistory } from "@/src/lib/storyflow/history";
import { executeBeat, type Beat, type BeatDraft } from "@/src/lib/storyflow/script-builder";

const requestSchema = z.object({
  blueprintId: z.string().min(1, "blueprintId is required"),
});

/**
 * POST /api/script-builder/execute
 * Execute multi-prompt script generation for all beats
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

  const { blueprintId } = parsed.data;

  try {
    // Find approved blueprint
    const blueprint = await storyflowPrisma.blueprint.findUnique({
      where: { id: blueprintId },
    });

    if (!blueprint) {
      return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
    }

    if (blueprint.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Blueprint must be approved before execution" },
        { status: 400 }
      );
    }

    const beats = blueprint.beats as Beat[];
    if (!beats || beats.length === 0) {
      return NextResponse.json(
        { error: "Blueprint has no beats" },
        { status: 400 }
      );
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
            beatDrafts,
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
  } catch (error) {
    console.error("[api/script-builder/execute] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to execute script generation",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
