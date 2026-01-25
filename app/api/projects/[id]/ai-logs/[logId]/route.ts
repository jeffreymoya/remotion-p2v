import { NextRequest, NextResponse } from "next/server";

import { handleApiError, NotFoundError } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; logId: string } }
) {
  try {
    const resolvedParams = await params;
    const log = await storyflowPrisma.aiCallLog.findUnique({
      where: { id: resolvedParams.logId },
      include: {
        parent: { select: { id: true, operation: true, status: true } },
        children: { select: { id: true, operation: true, status: true } },
      },
    });

    if (!log || log.projectId !== resolvedParams.id) {
      throw new NotFoundError("AI call log", resolvedParams.logId);
    }

    return NextResponse.json({ log });
  } catch (error) {
    return handleApiError(error, "projects/[id]/ai-logs/[logId]");
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
