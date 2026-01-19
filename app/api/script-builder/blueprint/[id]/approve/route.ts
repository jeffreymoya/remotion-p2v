import { NextResponse } from "next/server";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { recordBlueprintHistory } from "@/src/lib/storyflow/history";

/**
 * PUT /api/script-builder/blueprint/[id]/approve
 * Approve a blueprint and mark it ready for execution
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Find blueprint
    const blueprint = await storyflowPrisma.blueprint.findUnique({
      where: { id },
    });

    if (!blueprint) {
      return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
    }

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
  } catch (error) {
    console.error("[api/script-builder/blueprint/approve] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to approve blueprint",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
