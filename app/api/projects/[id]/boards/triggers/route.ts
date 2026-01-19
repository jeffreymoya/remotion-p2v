import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';

import { storyflowPrisma } from '@/src/lib/storyflow/prisma';
import {
  generateBoardTriggers,
  DEFAULT_TRIGGER_CONFIG,
} from '@/src/lib/boards/trigger-service';
import {
  BoardPlan,
  BoardPlanSchema,
  BoardPromptsOutput,
  BoardPromptsOutputSchema,
  BoardRegionsOutput,
  BoardRegionsOutputSchema,
  BoardTriggersOutputSchema,
} from '@/src/lib/boards-types';

/**
 * Request schema for trigger generation
 */
const triggersRequestSchema = z.object({
  boardId: z.string().optional(), // Optional - will process all boards if not provided
  options: z
    .object({
      triggerAtSegmentStart: z.boolean().optional(),
      triggerAtTopicShift: z.boolean().optional(),
      minWordsBetweenTriggers: z.number().int().min(1).optional(),
      transitionMs: z
        .object({
          segmentStart: z.number().int().min(0).max(5000).optional(),
          topicShift: z.number().int().min(0).max(5000).optional(),
          emphasis: z.number().int().min(0).max(5000).optional(),
        })
        .optional(),
    })
    .optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/projects/[id]/boards/triggers
 *
 * Generate word-level triggers for camera movements based on TTS timestamps.
 * Requires: board plan, prompts, regions, and TTS word timestamps
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;

    // Parse and validate request body
    const json = await (req.json().catch(() => ({})));
    const parsed = triggersRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { options } = parsed.data;

    // Fetch project
    const project = await storyflowPrisma.project.findUnique({
      where: { id: projectId },
      include: { boards: { orderBy: { index: 'asc' } } },
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
    const promptsPath = path.join(boardsDir, 'board-prompts.json');
    const regionsPath = path.join(boardsDir, 'board-regions.json');
    const tagsPath = path.join(projectPath, 'tags.json');

    // Check file existence
    const missingFiles: string[] = [];
    for (const [label, file] of [
      ['board plan', planPath],
      ['board prompts', promptsPath],
      ['board regions', regionsPath],
      ['tags (TTS timestamps)', tagsPath],
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
            message: `Required files not found: ${missingFiles.join(', ')}`,
          },
        },
        { status: 409 }
      );
    }

    // Load and parse files
    const [planData, promptsData, regionsWrapper, tagsData] = await Promise.all([
      fs.readFile(planPath, 'utf-8').then(JSON.parse),
      fs.readFile(promptsPath, 'utf-8').then(JSON.parse),
      fs.readFile(regionsPath, 'utf-8').then(JSON.parse),
      fs.readFile(tagsPath, 'utf-8').then(JSON.parse),
    ]);

    // Validate loaded data
    const plan = BoardPlanSchema.parse(planData) as BoardPlan;
    const prompts = BoardPromptsOutputSchema.parse(promptsData) as BoardPromptsOutput;

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

    // Verify TTS timestamps exist
    if (!tagsData.manifest?.audio || tagsData.manifest.audio.length === 0) {
      return NextResponse.json(
        {
          error: 'TTS word timestamps not found',
          code: 'TTS_NOT_GENERATED',
          message:
            'Word-level timestamps are required for trigger generation. Generate TTS first.',
        },
        { status: 409 }
      );
    }

    // Build trigger config
    const triggerConfig = {
      ...DEFAULT_TRIGGER_CONFIG,
      ...(options?.triggerAtSegmentStart !== undefined && {
        triggerAtSegmentStart: options.triggerAtSegmentStart,
      }),
      ...(options?.triggerAtTopicShift !== undefined && {
        triggerAtTopicShift: options.triggerAtTopicShift,
      }),
      ...(options?.minWordsBetweenTriggers !== undefined && {
        minWordsBetweenTriggers: options.minWordsBetweenTriggers,
      }),
      ...(options?.transitionMs && {
        transitionMs: {
          ...DEFAULT_TRIGGER_CONFIG.transitionMs,
          ...options.transitionMs,
        },
      }),
    };

    // Generate triggers
    const triggersOutput = await generateBoardTriggers(
      plan,
      prompts,
      regionsData,
      tagsData,
      triggerConfig
    );

    // Validate output
    const validatedTriggers = BoardTriggersOutputSchema.parse(triggersOutput);

    // Save to file
    const outputPath = path.join(boardsDir, 'board-triggers.json');
    await fs.writeFile(outputPath, JSON.stringify(validatedTriggers, null, 2));

    console.log(`[api/boards/triggers] Saved ${validatedTriggers.totalTriggers} triggers`);

    // Update database (store in Board.triggers field)
    // For now, we'll skip DB storage and rely on file system

    return NextResponse.json({
      triggers: validatedTriggers.triggers,
      totalWords: validatedTriggers.totalWords,
      totalTriggers: validatedTriggers.totalTriggers,
      generatedAt: validatedTriggers.generatedAt,
    });
  } catch (error) {
    console.error('[api/boards/triggers] Error generating triggers:', error);

    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.format() },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('No audio entries')) {
      return NextResponse.json(
        {
          error: 'TTS word timestamps not found',
          code: 'TTS_NOT_GENERATED',
          message: error.message,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate triggers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects/[id]/boards/triggers
 *
 * Retrieve existing board triggers (if saved to file)
 */
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;

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

    const triggersPath = path.join(projectPath, 'boards', 'board-triggers.json');

    try {
      const triggersData = await fs.readFile(triggersPath, 'utf-8');
      const triggers = BoardTriggersOutputSchema.parse(JSON.parse(triggersData));
      return NextResponse.json(triggers);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json(
          { error: 'Triggers not found', code: 'TRIGGERS_NOT_GENERATED' },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('[api/boards/triggers] Error fetching triggers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch triggers' },
      { status: 500 }
    );
  }
}
