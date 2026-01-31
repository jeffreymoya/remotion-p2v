import { NextResponse } from "next/server";
import { z } from "zod";

import { NotFoundError, parseBody, withErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { GlueIssue } from "@/src/lib/storyflow/script-builder-types";
import { recordScriptDraftHistory } from "@/src/lib/storyflow/history";
import { fromJsonArray, toJsonArray } from "@/src/lib/storyflow/prisma-json";

const requestSchema = z.object({
  polishedText: z.string().min(10, "polishedText is required"),
  resolvedIssues: z.array(z.string()).optional(),
});

/**
 * PUT /api/script-builder/draft/[draftId]/polish
 * Save edited script text and mark resolved glue issues
 */
export const PUT = withErrorHandler(
  async (req: Request, { params }: { params: Promise<{ draftId: string }> }) => {
    const { draftId } = await params;
    const { polishedText, resolvedIssues = [] } = await parseBody(req, requestSchema);

    const scriptDraft = await storyflowPrisma.scriptDraft.findUnique({
      where: { id: draftId },
    });

    if (!scriptDraft) {
      throw new NotFoundError("Script draft", draftId);
    }

    const existingIssues = fromJsonArray<GlueIssue>(scriptDraft.glueIssues);
    const updatedIssues = existingIssues.map((issue) => ({
      ...issue,
      resolved: resolvedIssues.includes(issue.id) ? true : issue.resolved,
    }));

    const updated = await storyflowPrisma.scriptDraft.update({
      where: { id: draftId },
      data: {
        polishedText,
        glueIssues: toJsonArray(updatedIssues),
        status: "POLISHING",
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });
    await recordScriptDraftHistory(updated, "polish_saved");

    return NextResponse.json({
      draft: updated,
      message: "Polished script saved",
    });
  },
  "script-builder/draft/[draftId]/polish"
);
