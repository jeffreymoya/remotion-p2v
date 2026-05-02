import { NextResponse } from "next/server";
import { z } from "zod";

import { parseBody, withErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { normalizeAssetMappings } from "@/src/lib/storyflow/asset-mappings";
import type { AssetMappings } from "@/src/lib/storyflow/types";

const segmentKeyframeSchema = z.object({
  centerX: z.number(),
  centerY: z.number(),
  zoom: z.number(),
});

const segmentViewportSchema = z.object({
  start: segmentKeyframeSchema,
  end: segmentKeyframeSchema,
  easing: z.enum(["linear", "easeIn", "easeOut", "easeInOut"]).optional(),
});

const assetMappingObjectSchema = z.object({
  assetId: z.string().min(1),
  viewport: segmentViewportSchema.optional(),
});

const mappingValueSchema = z.union([z.string(), assetMappingObjectSchema]);

const bodySchema = z.object({
  mappings: z.record(mappingValueSchema).transform((record) => {
    return normalizeAssetMappings(record);
  }),
});

type RouteParams = { params: Promise<{ id: string }> };

export const GET = withErrorHandler(async (_req: Request, { params }: RouteParams) => {
  const { id } = await params;
  const project = await storyflowPrisma.project.findByIdOrThrow(id);

  const assetMappings: AssetMappings = normalizeAssetMappings(project.assetMappings);
  return NextResponse.json({ assetMappings });
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
