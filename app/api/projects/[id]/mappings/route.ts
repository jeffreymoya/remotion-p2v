import { NextResponse } from "next/server";
import { z } from "zod";

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

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const project = await storyflowPrisma.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json({ assetMappings: project.assetMappings ?? {} });
}

export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const project = await storyflowPrisma.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const assetMappings = parsed.data.mappings;

  await storyflowPrisma.project.update({
    where: { id },
    data: { assetMappings },
  });

  return NextResponse.json({ assetMappings });
}
