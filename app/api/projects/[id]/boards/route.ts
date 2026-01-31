import { NextResponse } from "next/server";
import { z } from "zod";

import { parseBody, withErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

const createSchema = z.object({
  layout: z.object({ columns: z.number().int().min(1), rows: z.number().int().min(1) }),
});

type RouteParams = { params: Promise<{ id: string }> };

export const GET = withErrorHandler(async (_req: Request, { params }: RouteParams) => {
  const { id } = await params;
  const boards = await storyflowPrisma.board.findMany({
    where: { projectId: id },
    orderBy: { index: "asc" },
  });

  return NextResponse.json({ boards });
}, "projects/[id]/boards");

export const POST = withErrorHandler(async (req: Request, { params }: RouteParams) => {
  const { id } = await params;
  const { layout } = await parseBody(req, createSchema);

  const project = await storyflowPrisma.project.findByIdOrThrow(id);

  const nextIndex =
    (await storyflowPrisma.board.count({ where: { projectId: id } })) ?? 0;

  const board = await storyflowPrisma.board.create({
    data: {
      projectId: id,
      index: nextIndex,
      layout,
      regions: [],
    },
  });

  // Update project status when board created - transition to RENDER_READY
  if (project.status === "ASSETS_READY" || project.status === "BOARDS_READY") {
    await storyflowPrisma.project.update({
      where: { id },
      data: { status: "RENDER_READY" },
    });
  }

  return NextResponse.json({ board });
}, "projects/[id]/boards");
