import { NextResponse } from "next/server";
import { z } from "zod";
import path from "path";
import fs from "fs/promises";

import { generateBoardPrompts } from "@/src/lib/boards/prompts-service";
import { BoardPromptsOutput } from "@/src/lib/boards-types";
import { boardsLogger } from "@/src/lib/logger";
import { withLogging } from "@/src/lib/api-logger";

const requestSchema = z.object({
  boards: z.array(
    z.object({
      boardId: z.string(),
      segmentIndices: z.array(z.number().int().min(0)),
      totalDurationMs: z.number().min(0),
      topicSummary: z.string(),
    })
  ).min(1, "At least one board is required"),
  segments: z.array(
    z.object({
      id: z.string(),
      order: z.number().int().min(1),
      text: z.string().min(1),
      estimatedDurationMs: z.number().min(0),
      speakingNotes: z.string().optional(),
    })
  ).min(1, "At least one segment is required"),
  gridLayout: z.object({
    rows: z.number().int().min(1).max(4).default(2),
    cols: z.number().int().min(1).max(6).default(3),
  }).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/projects/[id]/boards/prompts
 * Generate AI prompts for board image generation
 */
export const POST = withLogging(async (req: Request, { params }: RouteParams) => {
  const { id: projectId } = await params;

  // Parse and validate request body
  const json = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const { boards, segments, gridLayout } = parsed.data;

  try {
    boardsLogger.info({ projectId, boardCount: boards.length, segmentCount: segments.length }, "Generating board prompts");

    // Generate prompts using the service
    const result: BoardPromptsOutput = await generateBoardPrompts(
      boards,
      segments,
      gridLayout || { rows: 2, cols: 3 }
    );

    // Save the result to the project's boards directory
    const projectDir = path.join(process.cwd(), 'public', 'projects', projectId);
    const boardsDir = path.join(projectDir, 'boards');

    // Ensure boards directory exists
    await fs.mkdir(boardsDir, { recursive: true });

    // Save board-prompts.json
    const outputPath = path.join(boardsDir, 'board-prompts.json');
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf-8');

    boardsLogger.info({ projectId, outputPath, promptCount: result.prompts.length }, "Board prompts generated successfully");

    return NextResponse.json({
      success: true,
      data: result,
      saved: outputPath.replace(process.cwd(), ''),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isAIError = errorMessage.includes('[AI]') || errorMessage.includes('[LLM]');

    boardsLogger.error({ projectId, error: errorMessage, stage: isAIError ? "AI generation" : "Processing" }, "Failed to generate board prompts");

    return NextResponse.json(
      {
        error: "Failed to generate board prompts",
        details: errorMessage,
        stage: isAIError ? "AI generation" : "Processing",
      },
      { status: 500 }
    );
  }
});

/**
 * GET /api/projects/[id]/boards/prompts
 * Retrieve existing board prompts
 */
export const GET = withLogging(async (_req: Request, { params }: RouteParams) => {
  const { id: projectId } = await params;

  try {
    const projectDir = path.join(process.cwd(), 'public', 'projects', projectId);
    const promptsPath = path.join(projectDir, 'boards', 'board-prompts.json');

    // Check if file exists
    try {
      await fs.access(promptsPath);
    } catch {
      return NextResponse.json(
        { error: "Board prompts not found. Generate them first using POST." },
        { status: 404 }
      );
    }

    // Read and return the file
    const content = await fs.readFile(promptsPath, 'utf-8');
    const data: BoardPromptsOutput = JSON.parse(content);

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    boardsLogger.error({ projectId, error: errorMessage }, "Failed to read board prompts");

    return NextResponse.json(
      { error: "Failed to read board prompts", details: errorMessage },
      { status: 500 }
    );
  }
});
