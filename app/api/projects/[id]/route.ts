import { NextResponse } from "next/server";
import { z } from "zod";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { deleteProjectDirectory } from "@/src/lib/storyflow/projects";

type Params = { params: Promise<{ id: string }> };

const updateProjectSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less")
      .regex(/^[a-zA-Z0-9\s_'":?!,.()&-]+$/, "Name can only contain letters, numbers, spaces, and common punctuation")
      .optional(),
    topic: z
      .string()
      .min(1, "Topic must be at least 1 character")
      .max(500, "Topic must be 500 characters or less")
      .optional(),
    aspectRatio: z.enum(["16:9", "9:16"]).optional(),
    status: z
      .enum([
        "DRAFT",
        "SCRIPT_READY",
        "ASSETS_READY",
        "VIEWPORT_READY",
        "BOARDS_READY",
        "RENDER_READY",
        "RENDERING",
        "COMPLETED",
        "ERROR",
      ])
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
    path: ["name"],
  });

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;
  const project = await storyflowPrisma.project.findUnique({
    where: { id },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const project = await storyflowPrisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await storyflowPrisma.project.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ project: updated });
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  const project = await storyflowPrisma.project.findUnique({
    where: { id },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await storyflowPrisma.project.delete({ where: { id } });
  await deleteProjectDirectory(id);

  return NextResponse.json({ success: true });
}
