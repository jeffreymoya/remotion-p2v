import { NextResponse } from "next/server";

import { NotFoundError, withErrorHandler } from "@/app/api/lib";
import { getRenderStatus } from "@/src/lib/storyflow/render";

type Params = { params: Promise<{ id: string }> };

export const GET = withErrorHandler(async (_req: Request, { params }: Params) => {
  const { id } = await params;
  const render = await getRenderStatus(id);
  if (!render) {
    throw new NotFoundError("Render", id);
  }

  return NextResponse.json(render);
}, "render/[id]/status");
