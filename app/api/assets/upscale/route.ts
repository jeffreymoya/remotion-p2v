import { NextResponse } from "next/server";
import { z } from "zod";

import { parseBody, withErrorHandler } from "@/app/api/lib";
import { processManualUpscale } from "@/src/lib/storyflow/upscale/schedule";

const schema = z.object({
  assetId: z.string().min(1),
});

export const POST = withErrorHandler(async (req) => {
  const { assetId } = await parseBody(req, schema);

  const asset = await processManualUpscale(assetId);
  return NextResponse.json({ asset });
}, "assets/upscale");
