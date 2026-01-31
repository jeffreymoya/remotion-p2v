import { NextResponse } from "next/server";
import { z } from "zod";

import { ValidationError, withErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { extractMetadata, saveAssetFile } from "@/src/lib/storyflow/assets";
import { validateUpload } from "@/src/lib/storyflow/file-validation";
import { AssetType } from "@/src/lib/storyflow/types";
import { toJsonObject } from "@/src/lib/storyflow/prisma-json";

const typeSchema = z.enum(["IMAGE", "VIDEO", "AUDIO", "MUSIC"]);

export const POST = withErrorHandler(async (req) => {
  const formData = await req.formData().catch(() => {
    throw new ValidationError("Invalid form data");
  });

  if (!formData) {
    throw new ValidationError("Invalid form data");
  }

  const file = formData.get("file");
  const projectId = formData.get("projectId");
  const type = formData.get("type");

  if (!(file instanceof File)) {
    throw new ValidationError("File missing");
  }

  if (typeof projectId !== "string" || !projectId) {
    throw new ValidationError("projectId is required");
  }

  const parsedType = typeSchema.safeParse(type);
  if (!parsedType.success) {
    throw new ValidationError("Invalid asset type", parsedType.error.format());
  }

  const assetType = parsedType.data as AssetType;

  const project = await storyflowPrisma.project.findByIdOrThrow(projectId);

  const validation = await validateUpload(file, assetType);
  if (!validation.valid) {
    throw new ValidationError(validation.error ?? "Invalid upload");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const stored = await saveAssetFile(
    projectId,
    assetType,
    file,
    buffer,
    validation.ext
  );

  const metadata = await extractMetadata(stored.absolutePath, assetType).catch(() => null);

  const asset = await storyflowPrisma.asset.create({
    data: {
      projectId,
      type: assetType,
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
}, "assets/upload");
