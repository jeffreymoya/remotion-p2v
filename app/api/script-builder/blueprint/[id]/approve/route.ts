import { NextResponse } from "next/server";

import { withErrorHandler } from "@/app/api/lib";
import { recordBlueprintHistory } from "@/src/lib/storyflow/history";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

/**
 * PUT /api/script-builder/blueprint/[id]/approve
 * Approve a blueprint and mark it ready for execution
 */
export const PUT = withErrorHandler(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    await storyflowPrisma.blueprint.findByIdOrThrow(id);

    // Update status to APPROVED
    const updated = await storyflowPrisma.blueprint.update({
      where: { id },
      data: {
        status: "APPROVED",
        updatedAt: new Date(),
      },
    });

    await recordBlueprintHistory(updated, "approved");

    return NextResponse.json({
      blueprint: updated,
      message: "Blueprint approved successfully",
    });
  },
  "script-builder/blueprint/[id]/approve"
);
