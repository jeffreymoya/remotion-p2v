import { NextResponse } from "next/server";
import { z } from "zod";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { fromJsonArray, toJsonArray } from "@/src/lib/storyflow/prisma-json";
import {
  executeBeat,
  type Beat,
  type BeatDraft,
  extractScriptDraftId,
} from "@/src/lib/storyflow/script-builder";
import { recordScriptDraftHistory } from "@/src/lib/storyflow/history";

const requestSchema = z.object({
  guidance: z.string().trim().min(1).max(500).optional(),
});

/**
 * POST /api/script-builder/beat/[beatDraftId]/regenerate
 * Regenerate a single beat without cascading to others.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ beatDraftId: string }> }
) {
  const { beatDraftId } = await params;
  const json = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const guidance = parsed.data.guidance;

  try {
    // Infer scriptDraftId from beatDraftId prefix
    const scriptDraftId = extractScriptDraftId(beatDraftId);
    if (!scriptDraftId) {
      return NextResponse.json(
        { error: "Could not determine script draft from beatDraftId" },
        { status: 400 }
      );
    }

    // Load draft with blueprint for context
    const scriptDraft = await storyflowPrisma.scriptDraft.findUnique({
      where: { id: scriptDraftId },
      include: { blueprint: true },
    });

    if (!scriptDraft) {
      return NextResponse.json({ error: "Script draft not found" }, { status: 404 });
    }

    const projectId = scriptDraft.blueprint.projectId;
    const beats = fromJsonArray<Beat>(scriptDraft.blueprint.beats);
    const beatDrafts = fromJsonArray<BeatDraft>(scriptDraft.beatDrafts);

    const targetDraft = beatDrafts.find((bd) => bd.id === beatDraftId);
    if (!targetDraft) {
      return NextResponse.json({ error: "Beat draft not found" }, { status: 404 });
    }

    const targetBeat = beats.find((b) => b.index === targetDraft.beatIndex);
    if (!targetBeat) {
      return NextResponse.json({ error: "Beat not found in blueprint" }, { status: 404 });
    }

    const isFirst = targetBeat.index === 1;
    const isLast = targetBeat.index === beats.length;

    // Build continuity text from prior beats only
    const previousContent = beatDrafts
      .filter((bd) => bd.beatIndex < targetBeat.index)
      .sort((a, b) => a.beatIndex - b.beatIndex)
      .map((bd) => bd.text)
      .join("\n\n");

    const regenerated = await executeBeat(
      projectId,
      targetBeat,
      previousContent,
      isFirst,
      isLast,
      beats.length,
      { guidance, regenerateFromId: targetDraft.id, scriptDraftId: scriptDraft.id }
    );

    // Replace target draft, preserve order
    const updatedBeatDrafts = beatDrafts
      .map((bd) => (bd.id === targetDraft.id ? regenerated : bd))
      .sort((a, b) => a.beatIndex - b.beatIndex);

    const polishedText = updatedBeatDrafts.map((bd) => bd.text).join("\n\n");

    const updatedDraft = await storyflowPrisma.scriptDraft.update({
      where: { id: scriptDraft.id },
      data: {
        beatDrafts: toJsonArray(updatedBeatDrafts),
        polishedText,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });
    await recordScriptDraftHistory(updatedDraft, `beat_${targetBeat.index}_regenerated`);

    return NextResponse.json({
      beatDraft: regenerated,
      draft: updatedDraft,
      message: `Beat ${targetBeat.index} regenerated`,
    });
  } catch (error) {
    console.error("[api/script-builder/beat/regenerate] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to regenerate beat",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
