import { NextResponse } from "next/server";

import { NotFoundError, withErrorHandler } from "@/app/api/lib";
import { deleteAsset } from "@/src/lib/storyflow/assets";

type Params = { params: Promise<{ id: string }> };

export const DELETE = withErrorHandler(async (_req, { params }: Params) => {
  const { id } = await params;
  const deleted = await deleteAsset(id);
  if (!deleted) {
    throw new NotFoundError("Asset", id);
  }

  return NextResponse.json({ success: true });
}, "assets/[id]");
