import { NextResponse } from "next/server";
import { z } from "zod";

import { parseBody, withErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

const bodySchema = z.object({
  imageAssetId: z.string().optional(),
  keyframes: z.array(z.any()),
  regions: z.array(z.any()).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export const GET = withErrorHandler(async (_req: Request, { params }: RouteParams) => {
  const { id } = await params;
  const viewport = await storyflowPrisma.viewport.findUnique({
    where: { projectId: id },
  });

  if (!viewport) return NextResponse.json({ viewport: null });
  return NextResponse.json({ viewport });
}, "projects/[id]/viewport");

export const POST = withErrorHandler(async (req: Request, { params }: RouteParams) => {
  const { id } = await params;
  const { imageAssetId, keyframes, regions } = await parseBody(req, bodySchema);

  const project = await storyflowPrisma.project.findByIdOrThrow(id, {
    include: { viewport: true },
  });

  const viewport = await storyflowPrisma.viewport.upsert({
    where: { projectId: id },
    update: { imageAssetId, keyframes, regions },
    create: {
      projectId: id,
      imageAssetId,
      keyframes,
      regions,
    },
  });

  // Update project status when viewport saved - transition to RENDER_READY
  if (project.status === "ASSETS_READY" || project.status === "VIEWPORT_READY") {
    await storyflowPrisma.project.update({
      where: { id },
      data: { status: "RENDER_READY" },
    });
  }

  return NextResponse.json({ viewport });
}, "projects/[id]/viewport");
