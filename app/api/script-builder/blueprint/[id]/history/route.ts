import { NextResponse } from "next/server";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

/**
 * GET /api/script-builder/blueprint/[id]/history
 * Returns all stored history snapshots for the blueprint (most recent first).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const blueprint = await storyflowPrisma.blueprint.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!blueprint) {
      return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
    }

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
  } catch (error) {
    console.error("[api/script-builder/blueprint/history] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch blueprint history",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
