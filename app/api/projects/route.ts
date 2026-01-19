import { NextResponse } from "next/server";
import { z } from "zod";
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

export async function GET() {
  const projects = await storyflowPrisma.project.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const data = await req.json();
  const parsed = createProjectSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const project = await storyflowPrisma.project.create({
    data: {
      name: parsed.data.name,
      aspectRatio: parsed.data.aspectRatio,
      topic: parsed.data.topic ?? null,
    },
  });

  await createProjectDirectory(project.id);

  return NextResponse.json({ project }, { status: 201 });
}
