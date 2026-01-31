import { NextResponse } from "next/server";

import { withErrorHandler } from "@/app/api/lib";
import { runMediaStage } from "@/src/lib/storyflow/pipeline/stages/media";

type Params = { params: Promise<{ id: string }> };

export const POST = withErrorHandler(async (_req: Request, { params }: Params) => {
  const { id } = await params;
  const result = await runMediaStage(id);
  return NextResponse.json({ status: "ASSETS_READY", assets: result.assetCount });
}, "projects/[id]/media/stage");
