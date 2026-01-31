import { NextResponse } from "next/server";

import { withErrorHandler } from "@/app/api/lib";
import { runStoryboardStage } from "@/src/lib/storyflow/pipeline/stages/storyboard";

type Params = { params: Promise<{ id: string }> };

export const POST = withErrorHandler(async (_req: Request, { params }: Params) => {
  const { id } = await params;
  const result = await runStoryboardStage(id);
  return NextResponse.json({ status: "BOARDS_READY", boardCount: result.boardCount });
}, "projects/[id]/storyboard");
