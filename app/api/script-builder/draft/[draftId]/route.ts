import { NextResponse } from "next/server";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

/**
 * GET /api/script-builder/draft/[draftId]
 * Retrieve a script draft with its blueprint and beat drafts
 */
export async function GET(
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

    return NextResponse.json({
      draft: scriptDraft,
      message: "Draft retrieved successfully",
    });
  } catch (error) {
    console.error("[api/script-builder/draft] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve draft",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
