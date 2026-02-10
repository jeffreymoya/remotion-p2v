import path from "path";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ValidationError, parseBody, withErrorHandler } from "@/app/api/lib";
import { ensureProjectDirs } from "@/src/lib/paths";
import { AssetType } from "@/src/lib/storyflow/types";
import { extractMetadata, saveAssetBuffer } from "@/src/lib/storyflow/assets";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

const bodySchema = z.object({
  projectId: z.string().min(1),
  url: z.string().url(),
  filename: z.string().min(1),
  type: z.enum(["IMAGE", "VIDEO"]),
  source: z.string().optional(),
});

export const POST = withErrorHandler(async (req) => {
  const { projectId, url, filename, type, source } = await parseBody(req, bodySchema);

  await storyflowPrisma.project.findByIdOrThrow(projectId);

  const res = await fetch(url);
  if (!res.ok) {
    throw new ValidationError("Unable to download media");
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "";
  const extFromType =
    contentType.includes("jpeg") || contentType.includes("jpg")
      ? ".jpg"
      : contentType.includes("png")
        ? ".png"
        : path.extname(filename) || ".bin";

  await ensureProjectDirs(projectId);

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

  return NextResponse.json({ asset }, { status: 201 });
}, "assets/import");
