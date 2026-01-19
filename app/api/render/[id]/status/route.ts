import { NextResponse } from "next/server";

import { getRenderStatus } from "@/src/lib/storyflow/render";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const render = await getRenderStatus(id);
    return NextResponse.json(render);
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status ?? 500;
    return NextResponse.json({ error: (err as { message?: string })?.message ?? "Failed to fetch render status" }, { status });
  }
}
