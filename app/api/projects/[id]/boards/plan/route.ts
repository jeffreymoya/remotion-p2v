import { NextResponse } from "next/server";
import { z } from "zod";

import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import {
  planBoards,
  type ScriptSegment,
} from "@/src/lib/boards/plan-service";
import {
  BoardsConfig,
  DEFAULT_BOARDS_CONFIG,
  BoardPlanSchema,
} from "@/src/lib/boards-types";

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
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;

    // Parse and validate request body
    const json = await req.json().catch(() => ({}));
    const parsed = planRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { scriptSegments, options } = parsed.data;

    // Fetch project and script from database
    const project = await storyflowPrisma.project.findUnique({
      where: { id: projectId },
      include: { script: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

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
      return NextResponse.json(
        { error: "No script found for project" },
        { status: 404 }
      );
    }

    if (segments.length === 0) {
      return NextResponse.json(
        { error: "Script has no segments" },
        { status: 400 }
      );
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
    const boardPlan = await planBoards(segments, config);

    // Add script path
    boardPlan.scriptPath = `projects/${projectId}/script.json`;

    // Validate the plan
    const validatedPlan = BoardPlanSchema.parse(boardPlan);

    // Store plan in database (optional - can be stored in Board.plan field)
    // For now, we'll just return it
    // Future: Store in Board records with plan field

    return NextResponse.json({
      boards: validatedPlan.boards,
      plan: validatedPlan,
    });
  } catch (error) {
    console.error("[api/boards/plan] Error planning boards:", error);

    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.format() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to plan boards",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects/[id]/boards/plan
 *
 * Retrieve existing board plan (if stored in database)
 */
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;

    // Fetch boards with plan data
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
      return NextResponse.json(
        { error: "No boards found for project" },
        { status: 404 }
      );
    }

    // Check if any boards have plan data
    const firstPlanData = boards.find((b) => b.plan)?.plan;

    if (!firstPlanData) {
      return NextResponse.json(
        { error: "No board plan found" },
        { status: 404 }
      );
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
  } catch (error) {
    console.error("[api/boards/plan] Error fetching plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch board plan" },
      { status: 500 }
    );
  }
}
