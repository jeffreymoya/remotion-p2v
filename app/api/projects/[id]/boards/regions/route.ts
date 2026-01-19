import { NextResponse } from "next/server";
import { z } from "zod";
import path from "path";
import fs from "fs/promises";
import {
  BoardElementSchema,
  BoardRegionsOutput,
} from "@/src/lib/boards-types";
import {
  detectBoardRegions,
  RegionDetectionResponseSchema,
} from "@/src/lib/boards/regions-service";
import { getBoardsAIService } from "@/src/lib/boards/ai-service";

/**
 * Request body schema for region detection
 */
const detectRegionsRequestSchema = z.object({
  boardId: z.string().min(1),
  imagePath: z.string().min(1),
  elements: z.array(BoardElementSchema).min(1),
  gridLayout: z.object({
    rows: z.number().int().min(1),
    cols: z.number().int().min(1),
  }),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/projects/[id]/boards/regions
 *
 * Detect regions in a board image using AI vision.
 *
 * Request body:
 * {
 *   boardId: string,        // Board identifier (e.g., "board-1")
 *   imagePath: string,      // Relative path from project root (e.g., "assets/images/board-1.png")
 *   elements: BoardElement[], // Expected elements in the board
 *   gridLayout: { rows: number, cols: number } // Grid layout used for the board
 * }
 *
 * Response:
 * {
 *   boardId: string,
 *   imagePath: string,
 *   imageMetadata: { width, height, aspectRatio },
 *   regions: BoardRegion[],
 *   warnings: string[]
 * }
 */
export async function POST(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;

  // Parse and validate request body
  const json = await req.json().catch(() => null);
  const parsed = detectRegionsRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const { boardId, imagePath, elements, gridLayout } = parsed.data;

  // Construct absolute path to image
  const projectDir = path.join(process.cwd(), "public", "projects", projectId);
  const absoluteImagePath = path.join(projectDir, imagePath);

  // Validate that image file exists
  try {
    await fs.access(absoluteImagePath);
  } catch {
    console.error(`[REGIONS] Image not found: ${absoluteImagePath}`);
    return NextResponse.json(
      {
        error: "Image file not found",
        imagePath,
        absolutePath: absoluteImagePath,
      },
      { status: 404 }
    );
  }

  try {
    // Initialize AI service
    const aiService = getBoardsAIService();
    await aiService.initialize();

    // Create board prompt object needed by the service
    const boardPrompt = {
      boardId,
      gridLayout,
      styleGuide: "", // Not needed for region detection
      elements,
      segmentContexts: [], // Not needed for region detection
      fullPromptText: "", // Not needed for region detection
    };

    // Detect regions using the service
    const result = await detectBoardRegions(
      boardPrompt,
      absoluteImagePath,
      async (multimodalPrompt: string) => {
        return await aiService.structuredComplete(
          multimodalPrompt,
          RegionDetectionResponseSchema,
          "boards-regions"
        );
      }
    );

    // Log warnings if any
    if (result.warnings.length > 0) {
      console.warn(`[REGIONS] Warnings for ${boardId}:`);
      result.warnings.forEach((w) => console.warn(`  - ${w}`));
    }

    // Construct response
    const response: BoardRegionsOutput & { warnings: string[] } = {
      version: "1.0",
      boardId,
      imagePath,
      imageMetadata: result.imageMetadata,
      regions: result.regions,
      generatedAt: new Date().toISOString(),
      warnings: result.warnings,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[REGIONS] Detection failed for ${boardId}:`, message);

    // Check for specific error types
    if (message.includes("references unknown element")) {
      return NextResponse.json(
        { error: "Region validation failed", details: message },
        { status: 422 } // Unprocessable Entity
      );
    }

    if (message.includes("Could not read image dimensions")) {
      return NextResponse.json(
        { error: "Invalid image file", details: message },
        { status: 422 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { error: "Region detection failed", details: message },
      { status: 500 }
    );
  }
}
