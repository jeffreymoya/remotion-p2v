import { NextResponse } from "next/server";
import { z } from "zod";
import * as fs from "fs/promises";

import {
  ConflictError,
  ValidationError,
  parseBody,
  withErrorHandler,
} from "@/app/api/lib";
import {
  generateBoardTriggers,
  DEFAULT_TRIGGER_CONFIG,
} from "@/src/lib/boards/trigger-service";
import {
  BoardPlan,
  BoardPlanSchema,
  BoardPromptsOutput,
  BoardPromptsOutputSchema,
  BoardRegionsOutput,
  BoardRegionsOutputSchema,
  BoardTriggersOutputSchema,
} from "@/src/lib/boards-types";
import { boardsLogger } from "@/src/lib/logger";
import { getProjectPaths } from "@/src/lib/paths";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

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
export const POST = withErrorHandler(async (req: Request, { params }: RouteParams) => {
  const { id: projectId } = await params;

  const { options } = await parseBody(req, triggersRequestSchema);

  await storyflowPrisma.project.findByIdOrThrow(projectId, {
    include: { boards: { orderBy: { index: "asc" } } },
  });

  const paths = getProjectPaths(projectId);
  const planPath = `${paths.boards}/board-plan.json`;
  const promptsPath = `${paths.boards}/board-prompts.json`;
  const regionsPath = `${paths.boards}/board-regions.json`;
  const tagsPath = paths.tags;

  const missingFiles: string[] = [];
  for (const [label, file] of [
    ["board plan", planPath],
    ["board prompts", promptsPath],
    ["board regions", regionsPath],
    ["tags (TTS timestamps)", tagsPath],
  ]) {
    try {
      await fs.access(file);
    } catch {
      missingFiles.push(label);
    }
  }

  if (missingFiles.length > 0) {
    throw new ConflictError(
      `Missing required files: ${missingFiles.join(", ")}. Complete previous stages first.`
    );
  }

  const [planData, promptsData, regionsWrapper, tagsData] = await Promise.all([
    fs.readFile(planPath, "utf-8").then(JSON.parse),
    fs.readFile(promptsPath, "utf-8").then(JSON.parse),
    fs.readFile(regionsPath, "utf-8").then(JSON.parse),
    fs.readFile(tagsPath, "utf-8").then(JSON.parse),
  ]);

  const plan = BoardPlanSchema.parse(planData) as BoardPlan;
  const prompts = BoardPromptsOutputSchema.parse(promptsData) as BoardPromptsOutput;

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

  if (!tagsData.manifest?.audio || tagsData.manifest.audio.length === 0) {
    throw new ConflictError(
      "TTS word timestamps not found. Generate TTS before trigger generation."
    );
  }

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

  const triggersOutput = await generateBoardTriggers(
    plan,
    prompts,
    regionsData,
    tagsData,
    triggerConfig
  );

  const validatedTriggers = BoardTriggersOutputSchema.parse(triggersOutput);

  const outputPath = `${paths.boards}/board-triggers.json`;
  await fs.writeFile(outputPath, JSON.stringify(validatedTriggers, null, 2));

  boardsLogger.info({ projectId, triggerCount: validatedTriggers.totalTriggers }, "Board triggers saved successfully");

  return NextResponse.json({
    triggers: validatedTriggers.triggers,
    totalWords: validatedTriggers.totalWords,
    totalTriggers: validatedTriggers.totalTriggers,
    generatedAt: validatedTriggers.generatedAt,
  });
}, "api/projects/[id]/boards/triggers");

/**
 * GET /api/projects/[id]/boards/triggers
 *
 * Retrieve existing board triggers (if saved to file)
 */
export const GET = withErrorHandler(async (_req: Request, { params }: RouteParams) => {
  const { id: projectId } = await params;

  await storyflowPrisma.project.findByIdOrThrow(projectId);

  const { boards } = getProjectPaths(projectId);
  const triggersPath = `${boards}/board-triggers.json`;

  try {
    const triggersData = await fs.readFile(triggersPath, "utf-8");
    const triggers = BoardTriggersOutputSchema.parse(JSON.parse(triggersData));
    return NextResponse.json(triggers);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new NotFoundError("Board triggers", projectId);
    }
    throw error;
  }
}, "api/projects/[id]/boards/triggers");
