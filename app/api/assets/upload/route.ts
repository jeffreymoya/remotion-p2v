import { NextResponse } from "next/server";
import { z } from "zod";

import { NotFoundError, ValidationError, withErrorHandler } from "@/app/api/lib";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { extractMetadata, saveAssetFile } from "@/src/lib/storyflow/assets";
import { validateUpload } from "@/src/lib/storyflow/file-validation";
import { AssetType } from "@/src/lib/storyflow/types";
import { toJsonObject } from "@/src/lib/storyflow/prisma-json";

const typeSchema = z.enum(["IMAGE", "VIDEO", "AUDIO", "MUSIC"]);

function extractPlanBoardId(plan: unknown): string | null {
  if (!plan || typeof plan !== "object") return null;
  const candidate = (plan as { boardId?: unknown }).boardId;
  return typeof candidate === "string" && candidate.length > 0 ? candidate : null;
}

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
  const boardId = formData.get("boardId");
  const boardIdValue = typeof boardId === "string" ? boardId.trim() || null : null;

  if (!(file instanceof File)) {
    throw new ValidationError("File missing");
  }

  if (typeof projectId !== "string" || !projectId) {
    throw new ValidationError("projectId is required");
  }

  const parsedType = typeSchema.safeParse(type);
  if (!parsedType.success) {
    // Fallback for board uploads that omit type — default to IMAGE
    if (!boardIdValue) {
      throw new ValidationError("Invalid asset type", parsedType.error.format());
    }
  }

  const assetType = parsedType.success ? (parsedType.data as AssetType) : ("IMAGE" as AssetType);

  await storyflowPrisma.project.findByIdOrThrow(projectId);

  let targetBoardId: string | null = null;
  if (boardIdValue) {
    const boards = await storyflowPrisma.board.findMany({
      where: { projectId },
      select: { id: true, plan: true },
    });
    const board = boards.find((candidate) => {
      if (candidate.id === boardIdValue) return true;
      return extractPlanBoardId(candidate.plan) === boardIdValue;
    });

    if (!board) {
      throw new NotFoundError("Board", boardIdValue);
    }

    targetBoardId = board.id;
  }

  const validation = await validateUpload(file, assetType);
  if (!validation.valid) {
    throw new ValidationError(validation.error ?? "Invalid upload");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const overrideFilename = boardIdValue ? `${boardIdValue}.${validation.ext}` : undefined;

  const stored = await saveAssetFile(projectId, assetType, file, buffer, validation.ext, {
    overrideFilename,
  });

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

  if (targetBoardId) {
    await storyflowPrisma.board.update({
      where: { id: targetBoardId },
      data: { assetId: asset.id },
    });
  }

  return NextResponse.json({ asset });
}, "assets/upload");
