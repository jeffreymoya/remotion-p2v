import { NextResponse } from "next/server";
import { z } from "zod";
import path from "path";

import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { AssetType } from "@/src/lib/storyflow/types";
import { createProjectDirectory } from "@/src/lib/storyflow/projects";
import { extractMetadata, saveAssetBuffer } from "@/src/lib/storyflow/assets";

const bodySchema = z.object({
  projectId: z.string().min(1),
  url: z.string().url(),
  filename: z.string().min(1),
  type: z.enum(["IMAGE", "VIDEO"]),
  source: z.string().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { projectId, url, filename, type, source } = parsed.data;

  const project = await storyflowPrisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: "Unable to download media" }, { status: 502 });
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "";
    const extFromType =
      contentType.includes("jpeg") || contentType.includes("jpg")
        ? ".jpg"
        : contentType.includes("png")
          ? ".png"
          : path.extname(filename) || ".bin";

    await createProjectDirectory(projectId);
    const stored = await saveAssetBuffer(projectId, type as AssetType, filename + extFromType, buffer);
    const metadata = await extractMetadata(stored.absolutePath, type as AssetType).catch(() => null);

    const asset = await storyflowPrisma.asset.create({
      data: {
        projectId,
        type: type as AssetType,
        filename: stored.filename,
        path: `/${stored.relativePath.replace(/\\/g, "/")}`,
        metadata: { ...(metadata ?? {}), source: source ?? "stock" },
      },
    });

    if (project.status === "DRAFT" || project.status === "SCRIPT_READY") {
      await storyflowPrisma.project.update({
        where: { id: projectId },
        data: { status: "ASSETS_READY" },
      });
    }

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    console.error("[api/assets/import] failed", error);
    return NextResponse.json({ error: "Failed to import asset" }, { status: 500 });
  }
}
