import { NextResponse } from "next/server";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

import { NotFoundError, parseBody, withErrorHandler } from "@/app/api/lib";
import { generateBoardPrompts } from "@/src/lib/boards/prompts-service";
import { BoardPromptsOutput } from "@/src/lib/boards-types";
import { boardsLogger } from "@/src/lib/logger";
import { ensureProjectDirs, getProjectPaths, getPublicDir } from "@/src/lib/paths";

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
export const POST = withErrorHandler(async (req: Request, { params }: RouteParams) => {
  const { id: projectId } = await params;

  const { boards, segments, gridLayout } = await parseBody(req, requestSchema);

  boardsLogger.info({ projectId, boardCount: boards.length, segmentCount: segments.length }, "Generating board prompts");

  const result: BoardPromptsOutput = await generateBoardPrompts(
    boards,
    segments,
    gridLayout || { rows: 2, cols: 3 }
  );

  const paths = await ensureProjectDirs(projectId);
  const outputPath = `${paths.boards}/board-prompts.json`;

  await fs.writeFile(outputPath, JSON.stringify(result, null, 2), "utf-8");

  boardsLogger.info({ projectId, outputPath, promptCount: result.prompts.length }, "Board prompts generated successfully");

  return NextResponse.json({
    success: true,
    data: result,
    saved: `/${path.relative(getPublicDir(), outputPath).replace(/\\/g, "/")}`,
  });
}, "api/projects/[id]/boards/prompts");

/**
 * GET /api/projects/[id]/boards/prompts
 * Retrieve existing board prompts
 */
export const GET = withErrorHandler(async (_req: Request, { params }: RouteParams) => {
  const { id: projectId } = await params;

  const { boards } = getProjectPaths(projectId);
  const promptsPath = `${boards}/board-prompts.json`;

  try {
    await fs.access(promptsPath);
  } catch {
    throw new NotFoundError("Board prompts", projectId);
  }

  const content = await fs.readFile(promptsPath, "utf-8");
  const data: BoardPromptsOutput = JSON.parse(content);

  return NextResponse.json({
    success: true,
    data,
  });
}, "api/projects/[id]/boards/prompts");
