import { NextResponse } from "next/server";
import { z } from "zod";

import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { extractMetadata, saveAssetFile } from "@/src/lib/storyflow/assets";
import { validateUpload } from "@/src/lib/storyflow/file-validation";
import { AssetType } from "@/src/lib/storyflow/types";
import { toJsonObject } from "@/src/lib/storyflow/prisma-json";

const typeSchema = z.enum(["IMAGE", "VIDEO", "AUDIO", "MUSIC"]);

export async function POST(req: Request) {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const projectId = formData.get("projectId");
  const type = formData.get("type");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File missing" }, { status: 400 });
  }
  if (typeof projectId !== "string" || !projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const parsedType = typeSchema.safeParse(type);
  if (!parsedType.success) {
    return NextResponse.json({ error: "Invalid asset type" }, { status: 400 });
  }

  const project = await storyflowPrisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const validation = await validateUpload(file, parsedType.data as AssetType);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const stored = await saveAssetFile(
      projectId,
      parsedType.data as AssetType,
      file,
      buffer,
      validation.ext
    );

    const metadata = await extractMetadata(
      stored.absolutePath,
      parsedType.data as AssetType
    ).catch(() => null);

    const asset = await storyflowPrisma.asset.create({
      data: {
        projectId,
        type: parsedType.data as AssetType,
        filename: stored.filename,
        path: `/${stored.relativePath.replace(/\\/g, "/")}`,
        metadata: toJsonObject(metadata),
      },
    });

    if (project.status === "DRAFT" || project.status === "SCRIPT_READY") {
      await storyflowPrisma.project.update({
        where: { id: projectId },
        data: { status: "ASSETS_READY" },
      });
    }

    return NextResponse.json({ asset });
  } catch (error) {
    console.error("[api/assets/upload] failed", error);
    return NextResponse.json(
      { error: "Failed to upload asset" },
      { status: 500 }
    );
  }
}
