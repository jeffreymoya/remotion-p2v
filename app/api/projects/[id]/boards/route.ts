import { NextResponse } from "next/server";
import { z } from "zod";

import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

const createSchema = z.object({
  layout: z.object({ columns: z.number().int().min(1), rows: z.number().int().min(1) }),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const boards = await storyflowPrisma.board.findMany({
    where: { projectId: id },
    orderBy: { index: "asc" },
  });

  return NextResponse.json({ boards });
}

export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const project = await storyflowPrisma.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const nextIndex =
    (await storyflowPrisma.board.count({ where: { projectId: id } })) ?? 0;

  const board = await storyflowPrisma.board.create({
    data: {
      projectId: id,
      index: nextIndex,
      layout: parsed.data.layout,
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
}
