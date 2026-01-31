import { NextResponse } from "next/server";

import { NotFoundError, withErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

/**
 * GET /api/script-builder/draft/[draftId]
 * Retrieve a script draft with its blueprint and beat drafts
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

    return NextResponse.json({
      draft: scriptDraft,
      message: "Draft retrieved successfully",
    });
  },
  "script-builder/draft/[draftId]"
);
