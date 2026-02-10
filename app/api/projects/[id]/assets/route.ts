import { NextResponse } from "next/server";

import { withErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/projects/[id]/assets
 * Fetch all assets for a project
 */
export const GET = withErrorHandler(async (_req: Request, { params }: RouteParams) => {
  const { id: projectId } = await params;

  await storyflowPrisma.project.findByIdOrThrow(projectId);

  const assets = await storyflowPrisma.asset.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    success: true,
    assets,
  });
}, "api/projects/[id]/assets");
