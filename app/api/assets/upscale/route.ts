import { NextResponse } from "next/server";
import { z } from "zod";

import { parseBody, withErrorHandler } from "@/app/api/lib";
import { processUpscaleJob } from "@/src/lib/storyflow/upscale/job";

const schema = z.object({
  assetId: z.string().min(1),
});

export const POST = withErrorHandler(async (req) => {
  const { assetId } = await parseBody(req, schema);

  const asset = await processUpscaleJob(assetId);
  return NextResponse.json({ asset });
}, "assets/upscale");
