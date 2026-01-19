import { NextResponse } from "next/server";
import { z } from "zod";

import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

const bodySchema = z.object({
  imageAssetId: z.string().optional(),
  keyframes: z.array(z.any()),
  regions: z.array(z.any()).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const viewport = await storyflowPrisma.viewport.findUnique({
    where: { projectId: id },
  });

  if (!viewport) return NextResponse.json({ viewport: null });
  return NextResponse.json({ viewport });
}

export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const { imageAssetId, keyframes, regions } = parsed.data;

  const project = await storyflowPrisma.project.findUnique({
    where: { id },
    include: { viewport: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

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
}
