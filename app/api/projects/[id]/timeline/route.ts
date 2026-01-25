import { NextResponse } from "next/server";
import { buildTimeline } from "@/src/lib/storyflow/timeline-builder";
import { handleApiError, NotFoundError } from "../../../lib/errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const timeline = await buildTimeline(id);
    if (!timeline) {
      throw new NotFoundError("Timeline", id);
    }
    return NextResponse.json({ timeline });
  } catch (error) {
    return handleApiError(error, "projects/[id]/timeline");
  }
}
