import {
  BoardPlan,
  BoardPromptsOutput,
  BoardRegionsOutput,
  BoardTriggersOutput,
  DEFAULT_BOARDS_CONFIG,
  ViewportTrigger,
} from '../boards-types';

interface TagsJson {
  manifest: {
    audio: Array<{
      id: string;
      segmentId: string;
      durationMs: number;
      wordTimestamps?: Array<{
        word: string;
        startMs: number;
        endMs: number;
      }>;
    }>;
  };
}

interface WordTiming {
  word: string;
  startMs: number;
  endMs: number;
  segmentIndex: number;
  localWordIndex: number;
  globalWordIndex: number;
  globalStartMs: number;
}

interface SegmentRegionMapping {
  segmentIndex: number;
  boardId: string;
  regionId: string;
}

export interface TriggerConfig {
  triggerAtSegmentStart: boolean;
  triggerAtTopicShift: boolean;
  minWordsBetweenTriggers: number;
  transitionMs: {
    segmentStart: number;
    topicShift: number;
    emphasis: number;
  };
}

export const DEFAULT_TRIGGER_CONFIG: TriggerConfig = {
  triggerAtSegmentStart: true,
  triggerAtTopicShift: true,
  minWordsBetweenTriggers: 20,
  transitionMs: {
    segmentStart: DEFAULT_BOARDS_CONFIG.transitionDefaults.segmentStart,
    topicShift: DEFAULT_BOARDS_CONFIG.transitionDefaults.topicShift,
    emphasis: DEFAULT_BOARDS_CONFIG.transitionDefaults.emphasis,
  },
};

export async function generateBoardTriggers(
  plan: BoardPlan,
  prompts: BoardPromptsOutput,
  regionsData: BoardRegionsOutput[],
  tags: TagsJson,
  config: TriggerConfig = DEFAULT_TRIGGER_CONFIG
): Promise<BoardTriggersOutput> {
  console.log('[TRIGGERS] Extracting word timings...');
  const wordTimings = extractWordTimings(tags);
  console.log(`[TRIGGERS] Found ${wordTimings.length} words`);

  const segmentRegionMap = buildSegmentRegionMap(plan, prompts, regionsData);
  console.log(`[TRIGGERS] Mapped ${segmentRegionMap.size} segments to regions`);

  const topicBreaks = plan.boards.slice(1).map(b => b.segmentIndices[0]);
  console.log(`[TRIGGERS] Topic breaks at segments: ${topicBreaks.join(', ') || 'none'}`);

  const triggers = generateTriggers(wordTimings, segmentRegionMap, topicBreaks, config);
  console.log(`[TRIGGERS] Generated ${triggers.length} triggers`);

  return {
    version: '1.0',
    triggers,
    totalWords: wordTimings.length,
    totalTriggers: triggers.length,
    generatedAt: new Date().toISOString(),
  };
}

function extractWordTimings(tags: TagsJson): WordTiming[] {
  const timings: WordTiming[] = [];
  let globalWordIndex = 0;
  let globalTimeOffset = 0;

  const audioEntries = tags.manifest?.audio ?? [];
  if (audioEntries.length === 0) {
    throw new Error('[TRIGGERS] No audio entries found in tags.manifest.audio');
  }

  for (let segIdx = 0; segIdx < audioEntries.length; segIdx++) {
    const audio = audioEntries[segIdx];
    const words = [...(audio.wordTimestamps ?? [])].sort((a, b) => (a.startMs ?? 0) - (b.startMs ?? 0));

    const segmentDuration = Number.isFinite(audio.durationMs)
      ? audio.durationMs
      : words[words.length - 1]?.endMs ?? 0;

    if (!Number.isFinite(segmentDuration) || segmentDuration <= 0) {
      console.warn(`[TRIGGERS] Segment ${segIdx} missing duration and word timings; skipping`);
      continue;
    }

    if (words.length === 0) {
      // Fallback: use a single placeholder word covering the segment
      timings.push({
        word: '[SEGMENT]',
        startMs: 0,
        endMs: segmentDuration,
        segmentIndex: segIdx,
        localWordIndex: 0,
        globalWordIndex: globalWordIndex++,
        globalStartMs: globalTimeOffset,
      });
      globalTimeOffset += segmentDuration;
      continue;
    }

    for (let localIdx = 0; localIdx < words.length; localIdx++) {
      const w = words[localIdx];
      timings.push({
        word: w.word,
        startMs: w.startMs,
        endMs: w.endMs,
        segmentIndex: segIdx,
        localWordIndex: localIdx,
        globalWordIndex: globalWordIndex++,
        globalStartMs: globalTimeOffset + w.startMs,
      });
    }

    globalTimeOffset += segmentDuration;
  }

  return timings;
}

function buildSegmentRegionMap(
  plan: BoardPlan,
  prompts: BoardPromptsOutput,
  regionsData: BoardRegionsOutput[]
): Map<number, SegmentRegionMapping> {
  const map = new Map<number, SegmentRegionMapping>();

  for (const board of plan.boards) {
    const prompt = prompts.prompts.find(p => p.boardId === board.boardId);
    const boardRegions = regionsData.find(r => r.boardId === board.boardId);

    if (!prompt || !boardRegions) {
      console.warn(`[TRIGGERS] Missing data for ${board.boardId}`);
      continue;
    }

    for (const ctx of prompt.segmentContexts) {
      const region = boardRegions.regions.find(r => r.elementId === ctx.focusElementId);
      if (!region) {
        console.warn(`[TRIGGERS] No region found for element ${ctx.focusElementId} in ${board.boardId}`);
        continue;
      }

      map.set(ctx.segmentIndex, {
        segmentIndex: ctx.segmentIndex,
        boardId: board.boardId,
        regionId: region.id,
      });
    }
  }

  return map;
}

function generateTriggers(
  wordTimings: WordTiming[],
  segmentRegionMap: Map<number, SegmentRegionMapping>,
  topicBreaks: number[],
  config: TriggerConfig
): ViewportTrigger[] {
  const triggers: ViewportTrigger[] = [];
  let lastTriggerGlobalIndex = -config.minWordsBetweenTriggers;
  let currentRegionId: string | null = null;
  let currentBoardId: string | null = null;

  for (const word of wordTimings) {
    const mapping = segmentRegionMap.get(word.segmentIndex);
    if (!mapping) continue;

    const isSegmentStart = word.localWordIndex === 0;
    const isMissingWord = word.word === '[SEGMENT]';
    const isTopicShift = config.triggerAtTopicShift && isSegmentStart && topicBreaks.includes(word.segmentIndex);
    const isBoardChange = currentBoardId !== null && mapping.boardId !== currentBoardId;
    const isRegionChange = isBoardChange || mapping.regionId !== currentRegionId;
    const hasMinGap = word.globalWordIndex - lastTriggerGlobalIndex >= config.minWordsBetweenTriggers;

    const canFireSegmentStart =
      config.triggerAtSegmentStart &&
      isSegmentStart &&
      isRegionChange &&
      (hasMinGap || isBoardChange || triggers.length === 0 || isMissingWord);

    const canFireTopicShift = isTopicShift && (isRegionChange || isBoardChange || hasMinGap || triggers.length === 0 || isMissingWord);

    let triggerType: ViewportTrigger['triggerType'] | null = null;
    let transitionMs = config.transitionMs.segmentStart;

    if (canFireTopicShift) {
      triggerType = 'topic_shift';
      transitionMs = config.transitionMs.topicShift;
    } else if (canFireSegmentStart) {
      triggerType = 'segment_start';
      transitionMs = config.transitionMs.segmentStart;
    }

    if (triggerType) {
      if (triggers.length === 0) {
        transitionMs = 0;
      }

      triggers.push({
        triggerId: `trigger-${triggers.length + 1}`,
        wordId: `seg-${word.segmentIndex}-w-${word.localWordIndex}`,
        globalWordIndex: word.globalWordIndex,
        segmentIndex: word.segmentIndex,
        localWordIndex: word.localWordIndex,
        word: word.word,
        wordStartMs: word.globalStartMs,
        targetRegionId: mapping.regionId,
        targetBoardId: mapping.boardId,
        transitionMs,
        triggerType,
      });

      lastTriggerGlobalIndex = word.globalWordIndex;
      currentRegionId = mapping.regionId;
    }

    currentBoardId = mapping.boardId;
  }

  return triggers;
}
