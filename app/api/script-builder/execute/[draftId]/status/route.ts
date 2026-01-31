import { NextResponse } from "next/server";

import { NotFoundError, withErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { fromJsonArray } from "@/src/lib/storyflow/prisma-json";
import { type Beat, type BeatDraft } from "@/src/lib/storyflow/script-builder";

/**
 * GET /api/script-builder/execute/[draftId]/status
 * Get execution progress status
 */
export const GET = withErrorHandler(
  async (_req: Request, { params }: { params: Promise<{ draftId: string }> }) => {
    const { draftId } = await params;

    const scriptDraft = await storyflowPrisma.scriptDraft.findUnique({
      where: { id: draftId },
      include: {
        blueprint: true,
      },
    });

    if (!scriptDraft) {
      throw new NotFoundError("Script draft", draftId);
    }

    const beats = scriptDraft.blueprint.beats as Beat[];
    const beatDrafts = fromJsonArray<BeatDraft>(scriptDraft.beatDrafts);
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
  },
  "script-builder/execute/[draftId]/status"
);
