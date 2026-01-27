import { NextResponse } from "next/server";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { analyzeGlue } from "@/src/lib/storyflow/glue";
import { BeatDraft } from "@/src/lib/storyflow/script-builder-types";
import { recordScriptDraftHistory } from "@/src/lib/storyflow/history";
import { fromJsonArray, toJsonArray } from "@/src/lib/storyflow/prisma-json";

/**
 * GET /api/script-builder/draft/[draftId]/glue-analysis
 * Run heuristic glue analysis (robot words + seams + optional repetition/pacing)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;

  try {
    const scriptDraft = await storyflowPrisma.scriptDraft.findUnique({
      where: { id: draftId },
    });

    if (!scriptDraft) {
      return NextResponse.json({ error: "Script draft not found" }, { status: 404 });
    }

    const beatDrafts = fromJsonArray<BeatDraft>(scriptDraft.beatDrafts);
    if (beatDrafts.length === 0) {
      return NextResponse.json({ error: "No beat drafts to analyze" }, { status: 400 });
    }

    const polishedText = scriptDraft.polishedText ?? beatDrafts.map((b) => b.text).join("\n\n");

    const issues = analyzeGlue(polishedText, beatDrafts, {
      includeRepetition: true,
    });

    // Persist analysis + status transition into gluing
    const updatedDraft = await storyflowPrisma.scriptDraft.update({
      where: { id: draftId },
      data: {
        glueIssues: toJsonArray(issues),
        status: scriptDraft.status === "COMPLETED" ? "GLUING" : scriptDraft.status,
        polishedText,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });
    await recordScriptDraftHistory(updatedDraft, "glue_analysis");

    const issueCount = {
      warnings: issues.filter((i) => i.severity === "warning").length,
      errors: issues.filter((i) => i.severity === "error").length,
    };

    return NextResponse.json({
      issues,
      issueCount,
      polishedText,
    });
  } catch (error) {
    console.error("[api/script-builder/glue-analysis] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to run glue analysis",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
