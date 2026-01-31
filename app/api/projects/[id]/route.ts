import { NextResponse } from "next/server";
import { z } from "zod";

import { parseBody, withErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { deleteProjectDirectory } from "@/src/lib/storyflow/projects";

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

export const GET = withErrorHandler(async (_req, ctx) => {
  const { id } = await ctx!.params!;
  const project = await storyflowPrisma.project.findByIdOrThrow(id);
  return NextResponse.json({ project });
}, "projects/[id]");

export const PATCH = withErrorHandler(async (req, ctx) => {
  const { id } = await ctx!.params!;
  const data = await parseBody(req, updateProjectSchema);

  await storyflowPrisma.project.findByIdOrThrow(id);

  const updated = await storyflowPrisma.project.update({
    where: { id },
    data,
  });

  return NextResponse.json({ project: updated });
}, "projects/[id]");

export const DELETE = withErrorHandler(async (_req, ctx) => {
  const { id } = await ctx!.params!;
  await storyflowPrisma.project.findByIdOrThrow(id);

  await storyflowPrisma.project.delete({ where: { id } });
  await deleteProjectDirectory(id);

  return NextResponse.json({ success: true });
}, "projects/[id]");
