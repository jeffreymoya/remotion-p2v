import { NextResponse } from "next/server";
import { z } from "zod";

import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

const updateSchema = z.object({
  layout: z.object({ columns: z.number().int().min(1), rows: z.number().int().min(1) }).optional(),
  regions: z.array(z.any()).optional(),
  triggers: z.any().optional(),
});

type RouteParams = { params: Promise<{ id: string; boardId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id, boardId } = await params;
  const board = await storyflowPrisma.board.findFirst({
    where: { id: boardId, projectId: id },
  });

  if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });
  return NextResponse.json({ board });
}

export async function PUT(req: Request, { params }: RouteParams) {
  const { id, boardId } = await params;
  const json = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const board = await storyflowPrisma.board.update({
    where: { id: boardId },
    data: parsed.data,
  });

  // Update project status when board updated - transition to RENDER_READY
  const project = await storyflowPrisma.project.findUnique({ where: { id } });
  if (project && (project.status === "ASSETS_READY" || project.status === "BOARDS_READY")) {
    await storyflowPrisma.project.update({
      where: { id },
      data: { status: "RENDER_READY" },
    });
  }

  return NextResponse.json({ board });
}
