import { NextResponse } from "next/server";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";

import {
  ConflictError,
  NotFoundError,
  ValidationError,
  parseBody,
  withErrorHandler,
} from "@/app/api/lib";
import {
  BoardPlan,
  BoardPlanSchema,
  BoardRegionsOutput,
  BoardRegionsOutputSchema,
  BoardTriggersOutput,
  BoardTriggersOutputSchema,
} from "@/src/lib/boards-types";
import { buildViewportJson } from "@/src/lib/boards/viewport-service";
import { boardsLogger } from "@/src/lib/logger";
import { getProjectPaths } from "@/src/lib/paths";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

/**
 * Request schema for viewport build
 */
const viewportRequestSchema = z.object({
  fps: z.number().int().min(1).max(120).optional(), // Default: 30
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/projects/[id]/boards/viewport
 *
 * Build viewport.json from board plan, regions, and triggers.
 * Requires: board plan, regions, triggers, and board images (preferably 8K upscaled)
 */
export const POST = withErrorHandler(async (req: Request, { params }: RouteParams) => {
  const { id: projectId } = await params;

  const { fps = 30 } = await parseBody(req, viewportRequestSchema);

  await storyflowPrisma.project.findByIdOrThrow(projectId);

  const paths = getProjectPaths(projectId);
  const boardsDir = paths.boards;

  const planPath = path.join(boardsDir, "board-plan.json");
  const regionsPath = path.join(boardsDir, "board-regions.json");
  const triggersPath = path.join(boardsDir, "board-triggers.json");

  const missingFiles: string[] = [];
  for (const [label, file] of [
    ["board plan", planPath],
    ["board regions", regionsPath],
    ["board triggers", triggersPath],
  ]) {
    try {
      await fs.access(file);
    } catch {
      missingFiles.push(label);
    }
  }

  if (missingFiles.length > 0) {
    throw new ConflictError(
      `Required files not found: ${missingFiles.join(", ")}. Complete previous stages first.`
    );
  }

  const [planData, regionsWrapper, triggersData] = await Promise.all([
    fs.readFile(planPath, "utf-8").then(JSON.parse),
    fs.readFile(regionsPath, "utf-8").then(JSON.parse),
    fs.readFile(triggersPath, "utf-8").then(JSON.parse),
  ]);

  const plan = BoardPlanSchema.parse(planData) as BoardPlan;
  const triggers = BoardTriggersOutputSchema.parse(triggersData) as BoardTriggersOutput;

  let regionsData: BoardRegionsOutput[];
  if (Array.isArray(regionsWrapper.boards)) {
    regionsData = regionsWrapper.boards.map((r: unknown) =>
      BoardRegionsOutputSchema.parse(r)
    );
  } else if (regionsWrapper.version && regionsWrapper.boardId) {
    regionsData = [BoardRegionsOutputSchema.parse(regionsWrapper)];
  } else {
    throw new ValidationError("Invalid regions file format");
  }

  const imagesDir = paths.assetsImages;
  const missingImages: string[] = [];

  for (const board of plan.boards) {
    const originalPath = path.join(imagesDir, `${board.boardId}.png`);
    const upscaledPath = path.join(imagesDir, `${board.boardId}_8k.png`);

    try {
      await fs.access(upscaledPath);
    } catch {
      try {
        await fs.access(originalPath);
      } catch {
        missingImages.push(board.boardId);
      }
    }
  }

  if (missingImages.length > 0) {
    throw new ConflictError(
      `No images found for boards: ${missingImages.join(", ")}`
    );
  }

  boardsLogger.info({ projectId, boardCount: plan.boards.length, triggerCount: triggers.totalTriggers }, "Loading board data");

  const viewport = await buildViewportJson(plan, regionsData, triggers, {
    fps,
    projectPath: paths.root,
  });

  await fs.writeFile(paths.viewport, JSON.stringify(viewport, null, 2));

  boardsLogger.info(
    {
      projectId,
      boards: viewport.boards.length,
      triggers: viewport.wordTriggers.length,
      keyframes: viewport.keyframes.length,
    },
    "viewport.json created successfully"
  );

  return NextResponse.json({
    viewportJson: viewport,
    stats: {
      boards: viewport.boards.length,
      triggers: viewport.wordTriggers.length,
      keyframes: viewport.keyframes.length,
    },
    outputPath: `projects/${projectId}/viewport.json`,
  });
}, "api/projects/[id]/boards/viewport");

/**
 * GET /api/projects/[id]/boards/viewport
 *
 * Retrieve existing viewport.json (if built)
 */
export const GET = withErrorHandler(async (_req: Request, { params }: RouteParams) => {
  const { id: projectId } = await params;

  await storyflowPrisma.project.findByIdOrThrow(projectId);

  const { viewport } = getProjectPaths(projectId);

  try {
    const viewportData = await fs.readFile(viewport, "utf-8");
    const data = JSON.parse(viewportData);
    return NextResponse.json(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new NotFoundError("Viewport", projectId);
    }
    throw error;
  }
}, "api/projects/[id]/boards/viewport");
