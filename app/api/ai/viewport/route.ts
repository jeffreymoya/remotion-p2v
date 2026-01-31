import { NextResponse } from "next/server";
import { z } from "zod";

import { parseBody, withErrorHandler } from "@/app/api/lib";
import { generateViewportForProject } from "@/src/lib/storyflow/viewport";

const requestSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  imageAssetId: z.string().min(1, "imageAssetId is required"),
});

export const POST = withErrorHandler(async (req) => {
  const { projectId, imageAssetId } = await parseBody(req, requestSchema);

  const { viewport, source } = await generateViewportForProject(
    projectId,
    imageAssetId
  );

  return NextResponse.json({ viewport, source });
}, "ai/viewport");
