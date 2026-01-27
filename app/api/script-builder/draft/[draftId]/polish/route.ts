import { NextResponse } from "next/server";
import { z } from "zod";
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
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;
  const json = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { polishedText, resolvedIssues = [] } = parsed.data;

  try {
    const scriptDraft = await storyflowPrisma.scriptDraft.findUnique({
      where: { id: draftId },
    });

    if (!scriptDraft) {
      return NextResponse.json({ error: "Script draft not found" }, { status: 404 });
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
  } catch (error) {
    console.error("[api/script-builder/polish] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to save polished script",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
