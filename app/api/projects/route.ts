import { NextResponse } from "next/server";
import { z } from "zod";

import { withErrorHandler, parseBody } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { createProjectDirectory } from "@/src/lib/storyflow/projects";

const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .regex(
      /^[a-zA-Z0-9\s_\-'":?!,.()&]+$/,
      "Name can only contain letters, numbers, spaces, and common punctuation"
    ),
  topic: z
    .string()
    .min(1, "Topic must be at least 1 character")
    .max(500, "Topic must be 500 characters or less")
    .optional(),
  aspectRatio: z.enum(["16:9", "9:16"]).default("16:9"),
});

export const GET = withErrorHandler(async () => {
  const projects = await storyflowPrisma.project.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ projects });
}, "projects");

export const POST = withErrorHandler(async (req) => {
  const data = await parseBody(req, createProjectSchema);

  const project = await storyflowPrisma.project.create({
    data: {
      name: data.name,
      aspectRatio: data.aspectRatio,
      topic: data.topic ?? null,
    },
  });

  await createProjectDirectory(project.id);

  return NextResponse.json({ project }, { status: 201 });
}, "projects");
