import { NextResponse } from "next/server";

import { withErrorHandler } from "@/app/api/lib";
import { runScriptStage } from "@/src/lib/storyflow/pipeline/stages/script";

type Params = { params: Promise<{ id: string }> };

export const POST = withErrorHandler(async (_req: Request, { params }: Params) => {
  const { id } = await params;
  const result = await runScriptStage(id);
  return NextResponse.json({ status: "SCRIPT_READY", segments: result.segmentCount });
}, "projects/[id]/script/stage");
