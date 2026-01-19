import { NextResponse } from "next/server";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { type Beat, type BeatDraft } from "@/src/lib/storyflow/script-builder";

/**
 * GET /api/script-builder/execute/[draftId]/status
 * Get execution progress status
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;

  try {
    // Find script draft
    const scriptDraft = await storyflowPrisma.scriptDraft.findUnique({
      where: { id: draftId },
      include: {
        blueprint: true,
      },
    });

    if (!scriptDraft) {
      return NextResponse.json({ error: "Script draft not found" }, { status: 404 });
    }

    const beats = scriptDraft.blueprint.beats as Beat[];
    const beatDrafts = scriptDraft.beatDrafts as BeatDraft[];
    const totalBeats = beats.length;
    const completedBeats = beatDrafts.length;

    return NextResponse.json({
      status: scriptDraft.status,
      currentBeatIndex: scriptDraft.currentBeatIndex,
      completedBeats,
      totalBeats,
      lastCheckpoint: scriptDraft.updatedAt,
      progress: totalBeats > 0 ? (completedBeats / totalBeats) * 100 : 0,
    });
  } catch (error) {
    console.error("[api/script-builder/execute/status] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to get execution status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
