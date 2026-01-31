import { NextResponse } from "next/server";

import { NotFoundError, withErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

/**
 * GET /api/script-builder/draft/[draftId]/history
 * Returns history snapshots for a script draft (most recent first).
 */
export const GET = withErrorHandler(
  async (_req: Request, { params }: { params: Promise<{ draftId: string }> }) => {
    const { draftId } = await params;

    const draft = await storyflowPrisma.scriptDraft.findUnique({
      where: { id: draftId },
      select: { id: true, blueprintId: true },
    });

    if (!draft) {
      throw new NotFoundError("Script draft", draftId);
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
  },
  "script-builder/draft/[draftId]/history"
);
