import { NextResponse } from "next/server";
import { z } from "zod";

import { parseBody, withErrorHandler } from "@/app/api/lib";
import { startRenderJob } from "@/src/lib/storyflow/render";

const requestSchema = z.object({
  projectId: z.string().min(1),
  quality: z.enum(["DRAFT", "MEDIUM", "HIGH", "PRODUCTION"]).optional(),
});

export const POST = withErrorHandler(async (req) => {
  const { projectId, quality } = await parseBody(req, requestSchema);

  const render = await startRenderJob(projectId, quality ?? "DRAFT");
  return NextResponse.json(render);
}, "render/start");
