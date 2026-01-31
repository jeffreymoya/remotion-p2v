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
import { aiGenerate } from "@/src/lib/services/ai";
import type { Milliseconds, Seconds } from "@/src/lib/types/units";
import { sec, ms, secToMs } from "@/src/lib/types/units";

/**
 * Script segment interface matching database schema
 */
export interface ScriptSegment {
  index: number;
  text: string;
  estimatedDuration?: Seconds;
  wordCount?: number;
}

/**
 * Segment metrics for planning
 */
interface SegmentMetrics {
  index: number;
  durationMs: Milliseconds;
  cumulativeDurationMs: Milliseconds;
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
  projectId: string,
  segments: ScriptSegment[],
  config: BoardsConfig = DEFAULT_BOARDS_CONFIG
): Promise<BoardPlan> {
  // Calculate segment metrics
  const metrics = calculateMetrics(segments);

  // Detect topic breaks using AI
  const topicBreaks = await detectTopicBreaks(projectId, segments);

  // Group segments into boards
  const boardGroups = groupSegments(metrics, topicBreaks, {
    targetDurationMs: config.targetDurationPerBoardMs,
    minSegments: config.minSegmentsPerBoard,
    maxSegments: config.maxSegmentsPerBoard,
  });

  // Generate topic summaries for each board
  const boards: BoardSegmentMapping[] = [];
  for (const group of boardGroups) {
    const summary = await generateTopicSummary(projectId, segments, group.indices);
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
    const durationMs = secToMs(sec(seg.estimatedDuration || 0));
    cumulative += durationMs;
    return {
      index: seg.index,
      durationMs,
      cumulativeDurationMs: ms(cumulative),
      text: seg.text,
    };
  });
}

/**
 * Detect topic breaks using AI
 */
export async function detectTopicBreaks(
  projectId: string,
  segments: ScriptSegment[]
): Promise<TopicBreak[]> {
  if (segments.length === 0) return [];

  const prompt = boardsPlanPrompt(
    segments.map((s) => ({ index: s.index, text: s.text }))
  );

  const { data: response } = await aiGenerate<z.infer<typeof TopicBreakResponseSchema>>({
    projectId,
    operation: "boards-plan",
    prompt,
    schema: TopicBreakResponseSchema,
    outputFormat: "json",
  });

  // Filter out invalid breaks
  const topicBreaks = (response.topicBreaks ?? [])
    .filter((tb) => tb.afterSegmentIndex < segments.length - 1)
    .map((tb) => ({
      afterSegmentIndex: tb.afterSegmentIndex,
      reason: tb.reason,
      confidence: tb.confidence ?? 0,
    }));

  return topicBreaks;
}

/**
 * Group segments into boards based on duration and topic breaks
 */
export function groupSegments(
  metrics: SegmentMetrics[],
  topicBreaks: TopicBreak[],
  config: { targetDurationMs: Milliseconds; minSegments: number; maxSegments: number }
): Array<{ indices: number[]; durationMs: Milliseconds }> {
  const boards: Array<{ indices: number[]; durationMs: Milliseconds }> = [];
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
): { indices: number[]; durationMs: Milliseconds } {
  const durationMs = segmentIndices.reduce((sum, idx) => {
    const metric = metrics.find((m) => m.index === idx);
    return ms(sum + (metric?.durationMs ?? 0));
  }, 0 as number) as Milliseconds;

  return {
    indices: [...segmentIndices],
    durationMs,
  };
}

/**
 * Generate topic summary for a group of segments using AI
 */
export async function generateTopicSummary(
  projectId: string,
  segments: ScriptSegment[],
  indices: number[]
): Promise<string> {
  if (indices.length === 0) return "No segments";

  const texts = indices
    .map((i) => segments.find((s) => s.index === i)?.text)
    .filter((t): t is string => !!t);

  const prompt = topicSummaryPrompt(texts);

  const { data: summary } = await aiGenerate<string>({
    projectId,
    operation: "boards-plan-summary",
    prompt,
    outputFormat: "text",
    metadata: { indices },
  });

  return summary.trim();
}
