import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { boardsLogger } from "@/src/lib/logger";
import { withLogging } from "@/src/lib/api-logger";

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
export const POST = withLogging(async (req: Request, { params }: RouteParams) => {
  const { id: projectId } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const boardId = formData.get("boardId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!boardId) {
      return NextResponse.json({ error: "No boardId provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PNG, JPEG, and WebP are supported." },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSizeMB = 50;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: `File is too large. Maximum size: ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate dimensions using sharp
    const metadata = await sharp(buffer).metadata();
    const minDimension = 2048;

    if (!metadata.width || !metadata.height) {
      return NextResponse.json(
        { error: "Could not read image dimensions" },
        { status: 422 }
      );
    }

    if (metadata.width < minDimension || metadata.height < minDimension) {
      return NextResponse.json(
        {
          error: `Image is too small. Minimum dimensions: ${minDimension}x${minDimension}px. Got: ${metadata.width}x${metadata.height}px`,
        },
        { status: 400 }
      );
    }

    // Determine file extension
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";

    // Create boards directory if it doesn't exist
    const projectDir = path.join(process.cwd(), "public", "projects", projectId);
    const boardsDir = path.join(projectDir, "boards");
    await mkdir(boardsDir, { recursive: true });

    // Save file
    const filename = `${boardId}.${extension}`;
    const filePath = path.join(boardsDir, filename);
    await writeFile(filePath, buffer);

    // Return relative path from project root
    const relativePath = `boards/${filename}`;

    boardsLogger.info({
      projectId,
      boardId,
      imagePath: relativePath,
      width: metadata.width,
      height: metadata.height,
    }, "Saved board image");

    return NextResponse.json({
      success: true,
      imagePath: relativePath,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        aspectRatio: metadata.width / metadata.height,
      },
    });
  } catch (error) {
    const { id: projectId } = await params;
    const message = error instanceof Error ? error.message : "Unknown error";
    boardsLogger.error({ projectId, error: message }, "Error uploading board image");

    return NextResponse.json(
      { error: "Failed to upload image", details: message },
      { status: 500 }
    );
  }
});
