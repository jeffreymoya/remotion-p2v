import { NextResponse } from "next/server";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

/**
 * GET /api/script-builder/draft/[draftId]/history
 * Returns history snapshots for a script draft (most recent first).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ draftId: string }> }
) {
  const { draftId } = await params;

  try {
    const draft = await storyflowPrisma.scriptDraft.findUnique({
      where: { id: draftId },
      select: { id: true, blueprintId: true },
    });

    if (!draft) {
      return NextResponse.json({ error: "Script draft not found" }, { status: 404 });
    }

    const history = await storyflowPrisma.scriptDraftHistory.findMany({
      where: { scriptDraftId: draftId },
      orderBy: [{ createdAt: "desc" }, { version: "desc" }],
      select: {
        id: true,
        scriptDraftId: true,
        blueprintId: true,
        version: true,
        event: true,
        snapshot: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error("[api/script-builder/draft/history] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch script draft history",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
