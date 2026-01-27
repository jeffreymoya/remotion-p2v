import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';

import { storyflowPrisma } from '@/src/lib/storyflow/prisma';
import { buildViewportJson } from '@/src/lib/boards/viewport-service';
import { boardsLogger } from '@/src/lib/logger';
import { withLogging } from '@/src/lib/api-logger';
import {
  BoardPlan,
  BoardPlanSchema,
  BoardRegionsOutput,
  BoardRegionsOutputSchema,
  BoardTriggersOutput,
  BoardTriggersOutputSchema,
} from '@/src/lib/boards-types';

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
export const POST = withLogging(async (req: Request, { params }: RouteParams) => {
  const { id: projectId } = await params;

  try {

    // Parse and validate request body
    const json = await req.json().catch(() => ({}));
    const parsed = viewportRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { fps = 30 } = parsed.data;

    // Fetch project
    const project = await storyflowPrisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Determine project path
    const projectPath = path.join(
      process.cwd(),
      'public',
      'projects',
      projectId
    );

    const boardsDir = path.join(projectPath, 'boards');

    // Load required files
    const planPath = path.join(boardsDir, 'board-plan.json');
    const regionsPath = path.join(boardsDir, 'board-regions.json');
    const triggersPath = path.join(boardsDir, 'board-triggers.json');

    // Check file existence
    const missingFiles: string[] = [];
    for (const [label, file] of [
      ['board plan', planPath],
      ['board regions', regionsPath],
      ['board triggers', triggersPath],
    ]) {
      try {
        await fs.access(file);
      } catch {
        missingFiles.push(label);
      }
    }

    if (missingFiles.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required files',
          code: 'DEPENDENCIES_NOT_MET',
          details: {
            missing: missingFiles,
            message: `Required files not found: ${missingFiles.join(', ')}. Complete previous stages first.`,
          },
        },
        { status: 409 }
      );
    }

    // Load and parse files
    const [planData, regionsWrapper, triggersData] = await Promise.all([
      fs.readFile(planPath, 'utf-8').then(JSON.parse),
      fs.readFile(regionsPath, 'utf-8').then(JSON.parse),
      fs.readFile(triggersPath, 'utf-8').then(JSON.parse),
    ]);

    // Validate loaded data
    const plan = BoardPlanSchema.parse(planData) as BoardPlan;
    const triggers = BoardTriggersOutputSchema.parse(triggersData) as BoardTriggersOutput;

    // Parse regions - handle both single and multi-board formats
    let regionsData: BoardRegionsOutput[];
    if (Array.isArray(regionsWrapper.boards)) {
      regionsData = regionsWrapper.boards.map((r: unknown) =>
        BoardRegionsOutputSchema.parse(r)
      );
    } else if (regionsWrapper.version && regionsWrapper.boardId) {
      // Single board format
      regionsData = [BoardRegionsOutputSchema.parse(regionsWrapper)];
    } else {
      return NextResponse.json(
        { error: 'Invalid regions file format' },
        { status: 400 }
      );
    }

    // Verify images exist (at least original versions)
    const imagesDir = path.join(projectPath, 'assets', 'images');
    const missingImages: string[] = [];

    for (const board of plan.boards) {
      const originalPath = path.join(imagesDir, `${board.boardId}.png`);
      const upscaledPath = path.join(imagesDir, `${board.boardId}_8k.png`);

      try {
        await fs.access(upscaledPath);
        // Has upscaled version - perfect!
      } catch {
        try {
          await fs.access(originalPath);
          // Has original - acceptable but not ideal
        } catch {
          missingImages.push(board.boardId);
        }
      }
    }

    if (missingImages.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing board images',
          code: 'IMAGE_NOT_UPLOADED',
          details: {
            missing: missingImages,
            message: `No images found for boards: ${missingImages.join(', ')}`,
          },
        },
        { status: 409 }
      );
    }

    boardsLogger.info({ projectId, boardCount: plan.boards.length, triggerCount: triggers.totalTriggers }, "Loading board data");

    // Build viewport.json
    const viewport = await buildViewportJson(plan, regionsData, triggers, {
      fps,
      projectPath,
    });

    // Save to file
    const outputPath = path.join(projectPath, 'viewport.json');
    await fs.writeFile(outputPath, JSON.stringify(viewport, null, 2));

    boardsLogger.info(
      {
        projectId,
        boards: viewport.boards.length,
        triggers: viewport.wordTriggers.length,
        keyframes: viewport.keyframes.length
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific error types
    if (error instanceof z.ZodError) {
      boardsLogger.error({ error: error.format() }, "Viewport validation error");
      return NextResponse.json(
        { error: 'Validation error', details: error.format() },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      (error.message.includes('No image found') ||
        error.message.includes('Missing image info'))
    ) {
      boardsLogger.error({ error: errorMessage }, "Board image not found");
      return NextResponse.json(
        {
          error: 'Board image not found',
          code: 'IMAGE_NOT_UPLOADED',
          message: error.message,
        },
        { status: 409 }
      );
    }

    boardsLogger.error({ error: errorMessage }, "Failed to build viewport");
    return NextResponse.json(
      {
        error: 'Failed to build viewport',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
});

/**
 * GET /api/projects/[id]/boards/viewport
 *
 * Retrieve existing viewport.json (if built)
 */
export async function GET(_req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;

  try {

    const project = await storyflowPrisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectPath = path.join(
      process.cwd(),
      'public',
      'projects',
      projectId
    );

    const viewportPath = path.join(projectPath, 'viewport.json');

    try {
      const viewportData = await fs.readFile(viewportPath, 'utf-8');
      const viewport = JSON.parse(viewportData);
      return NextResponse.json(viewport);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json(
          { error: 'Viewport not found', code: 'VIEWPORT_NOT_BUILT' },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    boardsLogger.error({ projectId, error: message }, 'Error fetching viewport');
    return NextResponse.json(
      { error: 'Failed to fetch viewport' },
      { status: 500 }
    );
  }
}
