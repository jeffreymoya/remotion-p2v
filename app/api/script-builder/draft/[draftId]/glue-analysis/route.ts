import { NextResponse } from "next/server";

import { NotFoundError, ValidationError, withErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { analyzeGlue } from "@/src/lib/storyflow/glue";
import { BeatDraft } from "@/src/lib/storyflow/script-builder-types";
import { recordScriptDraftHistory } from "@/src/lib/storyflow/history";
import { fromJsonArray, toJsonArray } from "@/src/lib/storyflow/prisma-json";

/**
 * GET /api/script-builder/draft/[draftId]/glue-analysis
 * Run heuristic glue analysis (robot words + seams + optional repetition/pacing)
 */
export const GET = withErrorHandler(
  async (_req: Request, { params }: { params: Promise<{ draftId: string }> }) => {
    const { draftId } = await params;

    const scriptDraft = await storyflowPrisma.scriptDraft.findUnique({
      where: { id: draftId },
    });

    if (!scriptDraft) {
      throw new NotFoundError("Script draft", draftId);
    }

    const beatDrafts = fromJsonArray<BeatDraft>(scriptDraft.beatDrafts);
    if (beatDrafts.length === 0) {
      throw new ValidationError("No beat drafts to analyze");
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
  },
  "script-builder/draft/[draftId]/glue-analysis"
);
