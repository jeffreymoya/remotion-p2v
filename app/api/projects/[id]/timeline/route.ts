import { NextResponse } from "next/server";

import { withErrorHandler } from "@/app/api/lib";
import { buildProjectArtifacts } from "@/src/lib/storyflow/pipeline/stages/build";

type Params = { params: Promise<{ id: string }> };

export const GET = withErrorHandler(async (_req: Request, { params }: Params) => {
  const { id } = await params;
  const timeline = await buildProjectArtifacts(id);

  return NextResponse.json({ timeline });
}, "projects/[id]/timeline");
