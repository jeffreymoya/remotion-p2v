import { NextResponse } from "next/server";

import { withErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

/**
 * GET /api/script-builder/blueprint/[id]/history
 * Returns all stored history snapshots for the blueprint (most recent first).
 */
export const GET = withErrorHandler(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    await storyflowPrisma.blueprint.findByIdOrThrow(id, { select: { id: true } });

    const history = await storyflowPrisma.blueprintHistory.findMany({
      where: { blueprintId: id },
      orderBy: [{ createdAt: "desc" }, { version: "desc" }],
      select: {
        id: true,
        blueprintId: true,
        version: true,
        event: true,
        snapshot: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ history });
  },
  "script-builder/blueprint/[id]/history"
);
