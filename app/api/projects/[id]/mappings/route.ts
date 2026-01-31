import { NextResponse } from "next/server";
import { z } from "zod";

import { parseBody, withErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

const bodySchema = z.object({
  mappings: z.record(z.string()).transform((record) => {
    // convert keys to numbers
    const result: Record<number, string> = {};
    Object.entries(record).forEach(([k, v]) => {
      const idx = Number(k);
      if (!Number.isNaN(idx)) result[idx] = v as string;
    });
    return result;
  }),
});

type RouteParams = { params: Promise<{ id: string }> };

export const GET = withErrorHandler(async (_req: Request, { params }: RouteParams) => {
  const { id } = await params;
  const project = await storyflowPrisma.project.findByIdOrThrow(id);

  return NextResponse.json({ assetMappings: project.assetMappings ?? {} });
}, "projects/[id]/mappings");

export const POST = withErrorHandler(async (req: Request, { params }: RouteParams) => {
  const { id } = await params;
  const data = await parseBody(req, bodySchema);

  await storyflowPrisma.project.findByIdOrThrow(id);

  const assetMappings = data.mappings;

  await storyflowPrisma.project.update({
    where: { id },
    data: { assetMappings },
  });

  return NextResponse.json({ assetMappings });
}, "projects/[id]/mappings");
