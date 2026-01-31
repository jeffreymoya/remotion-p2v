import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

import { ValidationError, withErrorHandler } from "@/app/api/lib";
import { boardsLogger } from "@/src/lib/logger";
import { ensureProjectDirs } from "@/src/lib/paths";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/projects/[id]/boards/upload-image
 *
 * Upload a board image for the boards pipeline.
 *
 * Request: multipart/form-data
 * - file: Image file (PNG, JPEG, WebP)
 * - boardId: Board identifier (e.g., "board-1")
 *
 * Response:
 * {
 *   success: boolean;
 *   imagePath: string; // Relative path from project root
 *   metadata: { width, height, aspectRatio };
 * }
 */
export const POST = withErrorHandler(async (req: Request, { params }: RouteParams) => {
  const { id: projectId } = await params;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const boardId = formData.get("boardId") as string | null;

  if (!file) {
    throw new ValidationError("No file provided");
  }

  if (!boardId) {
    throw new ValidationError("No boardId provided");
  }

  const validTypes = ["image/png", "image/jpeg", "image/webp"];
  if (!validTypes.includes(file.type)) {
    throw new ValidationError("Invalid file type. Only PNG, JPEG, and WebP are supported.");
  }

  const maxSizeMB = 50;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new ValidationError(`File is too large. Maximum size: ${maxSizeMB}MB`);
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const metadata = await sharp(buffer).metadata();
  const minDimension = 2048;

  if (!metadata.width || !metadata.height) {
    throw new ValidationError("Could not read image dimensions");
  }

  if (metadata.width < minDimension || metadata.height < minDimension) {
    throw new ValidationError(
      `Image is too small. Minimum dimensions: ${minDimension}x${minDimension}px. Got: ${metadata.width}x${metadata.height}px`
    );
  }

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";

  const paths = await ensureProjectDirs(projectId);
  const boardsDir = paths.boards;

  const filename = `${boardId}.${extension}`;
  const filePath = path.join(boardsDir, filename);
  await writeFile(filePath, buffer);

  const relativePath = `boards/${filename}`;

  boardsLogger.info(
    {
      projectId,
      boardId,
      imagePath: relativePath,
      width: metadata.width,
      height: metadata.height,
    },
    "Saved board image"
  );

  return NextResponse.json({
    success: true,
    imagePath: relativePath,
    metadata: {
      width: metadata.width,
      height: metadata.height,
      aspectRatio: metadata.width / metadata.height,
    },
  });
}, "api/projects/[id]/boards/upload-image");
