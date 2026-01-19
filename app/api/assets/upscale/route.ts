import { NextResponse } from "next/server";
import { z } from "zod";
import { processUpscaleJob } from "@/src/lib/storyflow/upscale/job";

const schema = z.object({
  assetId: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "assetId is required" }, { status: 400 });
  }

  try {
    const asset = await processUpscaleJob(parsed.data.assetId);
    return NextResponse.json({ asset });
  } catch (error: unknown) {
    const message = (error as { message?: string })?.message || "Upscale failed";
    const status =
      message.includes("not found") || message.includes("Asset") ? 404
        : message.includes("only supported") ? 400
        : message.includes("Real-ESRGAN") ? 503
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
