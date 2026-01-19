import { NextResponse } from "next/server";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { deleteProjectDirectory } from "@/src/lib/storyflow/projects";

type Params = { params: Promise<{ id: string }> };

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
