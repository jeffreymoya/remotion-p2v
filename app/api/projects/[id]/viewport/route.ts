import { NextResponse } from "next/server";
import { z } from "zod";

import { parseBody, withErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { transitionProjectStatus } from "@/src/lib/storyflow/status-machine";

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

  await storyflowPrisma.project.findByIdOrThrow(id, {
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

  await transitionProjectStatus(id, "RENDER_READY");

  return NextResponse.json({ viewport });
}, "projects/[id]/viewport");
