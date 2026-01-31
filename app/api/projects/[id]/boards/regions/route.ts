import { NextResponse } from "next/server";
import { z } from "zod";
import path from "path";
import fs from "fs/promises";

import {
  NotFoundError,
  ValidationError,
  parseBody,
  withErrorHandler,
} from "@/app/api/lib";
import {
  BoardElementSchema,
  BoardRegionsOutput,
} from "@/src/lib/boards-types";
import {
  detectBoardRegions,
  RegionDetectionResponseSchema,
} from "@/src/lib/boards/regions-service";
import { aiGenerate } from "@/src/lib/services/ai";
import { boardsLogger } from "@/src/lib/logger";
import { getProjectPaths } from "@/src/lib/paths";

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
export const POST = withErrorHandler(async (req: Request, { params }: RouteParams) => {
  const { id: projectId } = await params;

  const { boardId, imagePath, elements, gridLayout } = await parseBody(
    req,
    detectRegionsRequestSchema
  );

  const { root } = getProjectPaths(projectId);
  const absoluteImagePath = path.join(root, imagePath);

  try {
    await fs.access(absoluteImagePath);
  } catch {
    boardsLogger.error({ projectId, boardId, imagePath, absolutePath: absoluteImagePath }, "Board image not found");
    throw new NotFoundError("Board image", absoluteImagePath);
  }

  const boardPrompt = {
    boardId,
    gridLayout,
    styleGuide: "", // Not needed for region detection
    elements,
    segmentContexts: [], // Not needed for region detection
    fullPromptText: "", // Not needed for region detection
  };

  let result;
  try {
    result = await detectBoardRegions(
      boardPrompt,
      absoluteImagePath,
      async (multimodalPrompt: string) => {
        const { data } = await aiGenerate<z.infer<typeof RegionDetectionResponseSchema>>({
          projectId,
          operation: "boards-regions",
          prompt: multimodalPrompt,
          schema: RegionDetectionResponseSchema,
          outputFormat: "json",
          metadata: { boardId },
        });
        return data;
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("references unknown element") || message.includes("Could not read image dimensions")) {
      throw new ValidationError("Region detection failed", message);
    }
    throw error;
  }

  if (result.warnings.length > 0) {
    boardsLogger.warn({ projectId, boardId, warnings: result.warnings }, "Region detection completed with warnings");
  }

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
}, "api/projects/[id]/boards/regions");
