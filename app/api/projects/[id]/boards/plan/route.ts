import { NextResponse } from "next/server";
import { z } from "zod";

import {
  NotFoundError,
  ValidationError,
  parseBody,
  withErrorHandler,
} from "@/app/api/lib";
import {
  planBoards,
  type ScriptSegment,
} from "@/src/lib/boards/plan-service";
import {
  BoardsConfig,
  DEFAULT_BOARDS_CONFIG,
  BoardPlanSchema,
} from "@/src/lib/boards-types";
import { boardsLogger } from "@/src/lib/logger";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

/**
 * Request schema for board planning
 */
const planRequestSchema = z.object({
  scriptSegments: z
    .array(
      z.object({
        index: z.number().int().min(0),
        text: z.string().min(1),
        estimatedDuration: z.number().optional(),
        wordCount: z.number().optional(),
      })
    )
    .optional(), // Optional - will use script from database if not provided
  options: z
    .object({
      maxBoardDuration: z.number().int().min(1000).optional(), // milliseconds
      gridLayout: z
        .object({
          rows: z.number().int().min(1).max(5),
          cols: z.number().int().min(1).max(5),
        })
        .optional(),
      minSegmentsPerBoard: z.number().int().min(1).optional(),
      maxSegmentsPerBoard: z.number().int().min(1).optional(),
    })
    .optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/projects/[id]/boards/plan
 *
 * Plan board groupings from script segments using AI topic analysis.
 */
export const POST = withErrorHandler(async (req: Request, { params }: RouteParams) => {
  const { id: projectId } = await params;
  const { scriptSegments, options } = await parseBody(req, planRequestSchema);

  const project = await storyflowPrisma.project.findByIdOrThrow(projectId, {
    include: { script: true },
  });

  // Use provided segments or fetch from database
  let segments: ScriptSegment[];

  if (scriptSegments && scriptSegments.length > 0) {
    segments = scriptSegments;
  } else if (project.script && project.script.segments) {
    // Parse segments from database
    const dbSegments = project.script.segments as Array<{
      index: number;
      text: string;
      estimatedDuration?: number;
      wordCount?: number;
    }>;
    segments = dbSegments.map((seg) => ({
      index: seg.index,
      text: seg.text,
      estimatedDuration: seg.estimatedDuration,
      wordCount: seg.wordCount,
    }));
  } else {
    throw new NotFoundError("Script", projectId);
  }

  if (segments.length === 0) {
    throw new ValidationError("Script has no segments");
  }

  // Build config from options
  const config: BoardsConfig = {
    ...DEFAULT_BOARDS_CONFIG,
    ...(options?.gridLayout && { gridLayout: options.gridLayout }),
    ...(options?.maxBoardDuration && {
      targetDurationPerBoardMs: options.maxBoardDuration,
    }),
    ...(options?.minSegmentsPerBoard && {
      minSegmentsPerBoard: options.minSegmentsPerBoard,
    }),
    ...(options?.maxSegmentsPerBoard && {
      maxSegmentsPerBoard: options.maxSegmentsPerBoard,
    }),
  };

  // Generate board plan
  const boardPlan = await planBoards(projectId, segments, config);

  // Add script path
  boardPlan.scriptPath = `projects/${projectId}/script.json`;

  // Validate the plan
  const validatedPlan = BoardPlanSchema.parse(boardPlan);

  boardsLogger.info({ projectId, boards: validatedPlan.boards.length }, "Board plan generated");

  return NextResponse.json({
    boards: validatedPlan.boards,
    plan: validatedPlan,
  });
}, "api/projects/[id]/boards/plan");

/**
 * GET /api/projects/[id]/boards/plan
 *
 * Retrieve existing board plan (if stored in database)
 */
export const GET = withErrorHandler(async (_req: Request, { params }: RouteParams) => {
  const { id: projectId } = await params;

  const boards = await storyflowPrisma.board.findMany({
    where: { projectId },
    orderBy: { index: "asc" },
    select: {
      id: true,
      index: true,
      plan: true,
      layout: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (boards.length === 0) {
    throw new NotFoundError("Boards for project", projectId);
  }

  const firstPlanData = boards.find((b) => b.plan)?.plan;

  if (!firstPlanData) {
    throw new NotFoundError("Board plan", projectId);
  }

  return NextResponse.json({
    plan: firstPlanData,
    boards: boards.map((b) => ({
      id: b.id,
      index: b.index,
      layout: b.layout,
      plan: b.plan,
    })),
  });
}, "api/projects/[id]/boards/plan");
