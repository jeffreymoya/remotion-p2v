import { z } from "zod";
import {
  BoardPlan,
  BoardSegmentMapping,
  BoardsConfig,
  DEFAULT_BOARDS_CONFIG,
  MAX_BOARDS,
} from "../boards-types";
import {
  boardsPlanPrompt,
  topicSummaryPrompt,
} from "@/config/prompts/boards-plan.prompt";
import { getBoardsAIService } from "./ai-service";

/**
 * Script segment interface matching database schema
 */
export interface ScriptSegment {
  index: number;
  text: string;
  estimatedDuration?: number; // in seconds
  wordCount?: number;
}

/**
 * Segment metrics for planning
 */
interface SegmentMetrics {
  index: number;
  durationMs: number;
  cumulativeDurationMs: number;
  text: string;
}

/**
 * Topic break detected by AI
 */
interface TopicBreak {
  afterSegmentIndex: number;
  reason: string;
  confidence: number;
}

/**
 * Zod schemas for AI responses
 */
const TopicBreakSchema = z.object({
  afterSegmentIndex: z.number().int().min(0),
  reason: z.string(),
  confidence: z.number().min(0).max(1).default(0.5),
});

const TopicBreakResponseSchema = z.object({
  topicBreaks: z.array(TopicBreakSchema).default([]),
  segmentSummaries: z
    .array(z.object({ index: z.number().int().min(0), topic: z.string() }))
    .optional(),
});

/**
 * Plan board groups from script content using LLM topic breaks and duration rules.
 */
export async function planBoards(
  segments: ScriptSegment[],
  config: BoardsConfig = DEFAULT_BOARDS_CONFIG
): Promise<BoardPlan> {
  // Calculate segment metrics
  const metrics = calculateMetrics(segments);

  // Detect topic breaks using AI
  const topicBreaks = await detectTopicBreaks(segments);

  // Group segments into boards
  const boardGroups = groupSegments(metrics, topicBreaks, {
    targetDurationMs: config.targetDurationPerBoardMs,
    minSegments: config.minSegmentsPerBoard,
    maxSegments: config.maxSegmentsPerBoard,
  });

  // Generate topic summaries for each board
  const boards: BoardSegmentMapping[] = [];
  for (const group of boardGroups) {
    const summary = await generateTopicSummary(segments, group.indices);
    boards.push({
      boardId: `board-${boards.length + 1}`,
      segmentIndices: group.indices,
      totalDurationMs: group.durationMs,
      topicSummary: summary,
    });
  }

  const totalDurationMs = segments.reduce(
    (sum, seg) => sum + (seg.estimatedDuration || 0) * 1000,
    0
  );

  return {
    version: "1.0",
    scriptPath: "", // Will be set by API endpoint
    totalSegments: segments.length,
    totalDurationMs,
    boards,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Calculate metrics for each segment
 */
export function calculateMetrics(segments: ScriptSegment[]): SegmentMetrics[] {
  let cumulative = 0;
  return segments.map((seg) => {
    // Convert estimatedDuration from seconds to milliseconds
    const durationMs = (seg.estimatedDuration || 0) * 1000;
    cumulative += durationMs;
    return {
      index: seg.index,
      durationMs,
      cumulativeDurationMs: cumulative,
      text: seg.text,
    };
  });
}

/**
 * Detect topic breaks using AI
 */
export async function detectTopicBreaks(
  segments: ScriptSegment[]
): Promise<TopicBreak[]> {
  if (segments.length === 0) return [];

  const aiService = getBoardsAIService();
  await aiService.initialize();

  const prompt = boardsPlanPrompt(
    segments.map((s) => ({ index: s.index, text: s.text }))
  );

  const response = await aiService.completeJson(
    prompt,
    TopicBreakResponseSchema,
    "boards-plan"
  );

  // Filter out invalid breaks
  const topicBreaks = response.topicBreaks
    .filter((tb) => tb.afterSegmentIndex < segments.length - 1)
    .map((tb) => ({
      afterSegmentIndex: tb.afterSegmentIndex,
      reason: tb.reason,
      confidence: tb.confidence,
    }));

  return topicBreaks;
}

/**
 * Group segments into boards based on duration and topic breaks
 */
export function groupSegments(
  metrics: SegmentMetrics[],
  topicBreaks: TopicBreak[],
  config: { targetDurationMs: number; minSegments: number; maxSegments: number }
): Array<{ indices: number[]; durationMs: number }> {
  const boards: Array<{ indices: number[]; durationMs: number }> = [];
  const validMetrics = metrics.filter((m) => {
    if (m.durationMs <= 0) {
      console.warn(`[PLAN] Skipping segment ${m.index} with zero duration`);
      return false;
    }
    return true;
  });

  const topicBreakSet = new Set(topicBreaks.map((tb) => tb.afterSegmentIndex));

  let current: number[] = [];
  let currentDuration = 0;

  for (const seg of validMetrics) {
    const isTopicBreak = topicBreakSet.has(seg.index);
    const exceedsTarget =
      currentDuration + seg.durationMs > config.targetDurationMs &&
      current.length >= config.minSegments;
    const reachedMax = current.length >= config.maxSegments;
    const shouldBreak =
      (exceedsTarget ||
        (isTopicBreak && current.length >= config.minSegments) ||
        reachedMax) &&
      current.length > 0;

    if (shouldBreak) {
      boards.push(createBoardMapping(boards.length + 1, current, metrics));
      current = [];
      currentDuration = 0;

      if (boards.length >= MAX_BOARDS) {
        console.warn(
          `[PLAN] Reached maximum board limit (${MAX_BOARDS}). Remaining segments added to last board.`
        );
        break;
      }
    }

    current.push(seg.index);
    currentDuration += seg.durationMs;
  }

  // Handle remaining segments
  if (boards.length >= MAX_BOARDS && current.length > 0) {
    const last = boards[boards.length - 1];
    last.indices.push(...current);
    last.durationMs += currentDuration;
  } else if (current.length > 0) {
    boards.push(createBoardMapping(boards.length + 1, current, metrics));
  }

  return boards;
}

/**
 * Create a board mapping from segment indices
 */
function createBoardMapping(
  boardNumber: number,
  segmentIndices: number[],
  metrics: SegmentMetrics[]
): { indices: number[]; durationMs: number } {
  const durationMs = segmentIndices.reduce((sum, idx) => {
    const metric = metrics.find((m) => m.index === idx);
    return sum + (metric?.durationMs ?? 0);
  }, 0);

  return {
    indices: [...segmentIndices],
    durationMs,
  };
}

/**
 * Generate topic summary for a group of segments using AI
 */
export async function generateTopicSummary(
  segments: ScriptSegment[],
  indices: number[]
): Promise<string> {
  if (indices.length === 0) return "No segments";

  const aiService = getBoardsAIService();
  await aiService.initialize();

  const texts = indices
    .map((i) => segments.find((s) => s.index === i)?.text)
    .filter((t): t is string => !!t);

  const prompt = topicSummaryPrompt(texts);

  const summary = await aiService.complete(prompt, "boards-plan-summary");

  return summary.trim();
}
