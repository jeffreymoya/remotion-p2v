import { NextResponse } from "next/server";
import { z } from "zod";

import { NotFoundError, parseBody, withErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { transitionProjectStatus } from "@/src/lib/storyflow/status-machine";

const updateSchema = z.object({
  layout: z.object({ columns: z.number().int().min(1), rows: z.number().int().min(1) }).optional(),
  regions: z.array(z.any()).optional(),
  triggers: z.any().optional(),
});

type RouteParams = { params: Promise<{ id: string; boardId: string }> };

export const GET = withErrorHandler(async (_req: Request, { params }: RouteParams) => {
  const { id, boardId } = await params;
  const board = await storyflowPrisma.board.findFirst({
    where: { id: boardId, projectId: id },
  });

  if (!board) throw new NotFoundError("Board", boardId);
  return NextResponse.json({ board });
}, "projects/[id]/boards/[boardId]");

export const PUT = withErrorHandler(async (req: Request, { params }: RouteParams) => {
  const { id, boardId } = await params;
  const data = await parseBody(req, updateSchema);

  const board = await storyflowPrisma.board.update({
    where: { id: boardId },
    data,
  });

  await transitionProjectStatus(id, "BOARDS_READY");

  return NextResponse.json({ board });
}, "projects/[id]/boards/[boardId]");
