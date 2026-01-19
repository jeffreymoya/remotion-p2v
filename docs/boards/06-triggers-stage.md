> NOTE: CLI is deprecated and will be removed. Use the web UI. Any CLI references below are historical.

# Stage 6: Triggers Stage

## Overview

Generate word-level viewport triggers that precisely sync camera movement with speech. Triggers fire at specific words to pan to specific regions.

**Files to create**:
- `cli/lib/trigger-generator.ts`

---

## Input

- `boards/board-plan.json` (segment-to-board mapping)
- `boards/board-prompts.json` (segment-to-element mapping)
- `boards/board-regions.json` (region bounds)
- `tags.json` (word-level timestamps from TTS)

---

## Output

`boards/board-triggers.json`:

```json
{
  "version": "1.0",
  "triggers": [
    {
      "triggerId": "trigger-1",
      "wordId": "seg-0-w-0",
      "globalWordIndex": 0,
      "segmentIndex": 0,
      "localWordIndex": 0,
      "word": "In",
      "wordStartMs": 15,
      "targetRegionId": "region-1",
      "targetBoardId": "board-1",
      "transitionMs": 0,
      "triggerType": "segment_start"
    },
    {
      "triggerId": "trigger-2",
      "wordId": "seg-2-w-0",
      "globalWordIndex": 45,
      "segmentIndex": 2,
      "localWordIndex": 0,
      "word": "Traditional",
      "wordStartMs": 38234,
      "targetRegionId": "region-3",
      "targetBoardId": "board-1",
      "transitionMs": 800,
      "triggerType": "segment_start"
    }
  ],
  "totalWords": 850,
  "totalTriggers": 12,
  "generatedAt": "2026-01-08T..."
}
```

---

## Word Timing Source

From `tags.json`, the audio array is nested under `manifest.audio`:

```json
{
  "tags": [...],
  "manifest": {
    "images": [],
    "videos": [],
    "audio": [
      {
        "id": "segment-1",
        "segmentId": "segment-1",
        "durationMs": 9371.2,
        "wordTimestamps": [
          { "word": "In", "startMs": 15, "endMs": 135 },
          { "word": "a", "startMs": 135, "endMs": 195 },
          { "word": "league", "startMs": 195, "endMs": 420 }
        ]
      }
    ]
  }
}
```

> **Important**: Access audio data via `tags.manifest.audio`, not `tags.audio`.

---

## Algorithm

### Step 1: Extract Word Timings

```typescript
interface WordTiming {
  word: string;
  startMs: number;
  endMs: number;
  segmentIndex: number;
  localWordIndex: number;
  globalWordIndex: number;
  globalStartMs: number;  // Absolute time from video start
}

function extractWordTimings(tags: TagsJson): WordTiming[] {
  const timings: WordTiming[] = [];
  let globalWordIndex = 0;
  let globalTimeOffset = 0;

  // Access audio via manifest.audio (not tags.audio)
  for (let segIdx = 0; segIdx < tags.manifest.audio.length; segIdx++) {
    const audio = tags.manifest.audio[segIdx];
    const words = audio.wordTimestamps || [];

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

    globalTimeOffset += audio.durationMs;
  }

  return timings;
}
```

### Step 2: Build Segment-to-Region Map

> **Element Linking**: This function uses `elementId` to link segments to regions, not positional index. This is more robust because:
> 1. Region detection may return regions in any order
> 2. Element IDs are stable across the pipeline
> 3. Validation in regions stage ensures valid elementId values

```typescript
interface SegmentRegionMapping {
  segmentIndex: number;
  boardId: string;
  regionId: string;
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
      // Find region by elementId match (not positional index)
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
```

### Step 3: Generate Triggers

```typescript
interface TriggerConfig {
  triggerAtSegmentStart: boolean;   // Default: true
  triggerAtTopicShift: boolean;     // Default: true
  minWordsBetweenTriggers: number;  // Default: 20
  transitionMs: {
    segmentStart: number;           // Default: 800
    topicShift: number;             // Default: 1200
    emphasis: number;               // Default: 400
  };
}

function generateTriggers(
  wordTimings: WordTiming[],
  segmentRegionMap: Map<number, SegmentRegionMapping>,
  topicBreaks: number[],  // Segment indices where topic shifts
  config: TriggerConfig
): ViewportTrigger[] {
  const triggers: ViewportTrigger[] = [];
  let lastTriggerGlobalIndex = -config.minWordsBetweenTriggers;
  let currentRegionId: string | null = null;

  for (const word of wordTimings) {
    const mapping = segmentRegionMap.get(word.segmentIndex);
    if (!mapping) continue;

    const isSegmentStart = word.localWordIndex === 0;
    const isTopicShift = topicBreaks.includes(word.segmentIndex) && isSegmentStart;
    const isRegionChange = mapping.regionId !== currentRegionId;
    const hasMinGap = (word.globalWordIndex - lastTriggerGlobalIndex) >= config.minWordsBetweenTriggers;

    // Determine trigger type
    let triggerType: TriggerType | null = null;
    let transitionMs = 0;

    if (isSegmentStart && isRegionChange) {
      if (isTopicShift) {
        triggerType = 'topic_shift';
        transitionMs = config.transitionMs.topicShift;
      } else {
        triggerType = 'segment_start';
        transitionMs = config.transitionMs.segmentStart;
      }
    }

    // First trigger has no transition
    if (triggers.length === 0) {
      transitionMs = 0;
    }

    if (triggerType) {
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
  }

  return triggers;
}
```

---

## Implementation

```typescript
// cli/lib/trigger-generator.ts

import { ViewportTrigger, BoardPlan, BoardPromptsOutput } from '../../src/lib/boards-types';

interface TagsJson {
  tags: Array<{
    tag: string;
    segmentId: string;
    confidence: number;
  }>;
  manifest: {
    images: Array<unknown>;
    videos: Array<unknown>;
    audio: Array<{
      id: string;
      segmentId: string;
      durationMs: number;
      path: string;
      wordTimestamps: Array<{
        word: string;
        startMs: number;
        endMs: number;
      }>;
    }>;
  };
}

export async function generateBoardTriggers(
  plan: BoardPlan,
  prompts: BoardPromptsOutput,
  regionsData: BoardRegionsOutput[],  // Added: required for elementId linking
  tags: TagsJson,
  config = DEFAULT_TRIGGER_CONFIG
): Promise<BoardTriggersOutput> {
  console.log('[TRIGGERS] Extracting word timings...');

  // Step 1: Extract word timings from manifest.audio
  const wordTimings = extractWordTimings(tags);
  console.log(`[TRIGGERS] Found ${wordTimings.length} words`);

  // Step 2: Build segment-to-region map using elementId linking
  const segmentRegionMap = buildSegmentRegionMap(plan, prompts, regionsData);
  console.log(`[TRIGGERS] Mapped ${segmentRegionMap.size} segments to regions`);

  // Step 3: Identify topic shifts (segments that start new boards)
  const topicBreaks = plan.boards
    .slice(1)  // Skip first board
    .map(b => b.segmentIndices[0]);
  console.log(`[TRIGGERS] Topic breaks at segments: ${topicBreaks.join(', ')}`);

  // Step 4: Generate triggers
  const triggers = generateTriggers(
    wordTimings,
    segmentRegionMap,
    topicBreaks,
    config
  );
  console.log(`[TRIGGERS] Generated ${triggers.length} triggers`);

  return {
    version: '1.0',
    triggers,
    totalWords: wordTimings.length,
    totalTriggers: triggers.length,
    generatedAt: new Date().toISOString(),
  };
}

const DEFAULT_TRIGGER_CONFIG = {
  triggerAtSegmentStart: true,
  triggerAtTopicShift: true,
  minWordsBetweenTriggers: 20,
  transitionMs: {
    segmentStart: 800,
    topicShift: 1200,
    emphasis: 400,
  },
};
```

---

## CLI Integration

```typescript
case 'triggers': {
  const plan = await readJson<BoardPlan>(path.join(paths.boards, 'board-plan.json'));
  const prompts = await readJson<BoardPromptsOutput>(path.join(paths.boards, 'board-prompts.json'));
  const regionsData = await readJson<{ boards: BoardRegionsOutput[] }>(
    path.join(paths.boards, 'board-regions.json')
  );
  const tags = await readJson<TagsJson>(path.join(paths.project, 'tags.json'));

  // Note: regionsData.boards is passed for elementId linking
  const triggersOutput = await generateBoardTriggers(plan, prompts, regionsData.boards, tags);

  await writeJson(path.join(paths.boards, 'board-triggers.json'), triggersOutput);

  console.log('\n[TRIGGERS] Trigger Summary:');
  console.log(`  Total words: ${triggersOutput.totalWords}`);
  console.log(`  Total triggers: ${triggersOutput.totalTriggers}`);
  console.log('\n  Triggers:');

  for (const t of triggersOutput.triggers) {
    const timeStr = (t.wordStartMs / 1000).toFixed(2) + 's';
    console.log(`    ${t.triggerId}: "${t.word}" @ ${timeStr} → ${t.targetRegionId} (${t.triggerType})`);
  }
  break;
}
```

---

## Verification

```bash
# Run triggers stage
npm run boards -- --project project-1764548027472 triggers

# Expected output:
# [TRIGGERS] Extracting word timings...
# [TRIGGERS] Found 850 words
# [TRIGGERS] Mapped 10 segments to regions
# [TRIGGERS] Topic breaks at segments: 2, 5, 8
# [TRIGGERS] Generated 10 triggers
#
# [TRIGGERS] Trigger Summary:
#   Total words: 850
#   Total triggers: 10
#
#   Triggers:
#     trigger-1: "In" @ 0.02s → region-1 (segment_start)
#     trigger-2: "From" @ 9.39s → region-2 (segment_start)
#     trigger-3: "Traditional" @ 32.25s → region-3 (topic_shift)
#     ...

# Verify trigger timing
cat public/projects/project-1764548027472/boards/board-triggers.json | \
  jq '.triggers[] | "\(.word) @ \(.wordStartMs)ms → \(.targetRegionId)"'
```

---

## Trigger Timeline Visualization

```
Time (s)    0    10    20    30    40    50    60    70    80
            │     │     │     │     │     │     │     │     │
Words       In...From...Traditional...But...Cam...With...What...
            ▼     ▼     ▼            ▼     ▼     ▼     ▼
Triggers    T1    T2    T3           T4    T5    T6    T7
            │     │     │            │     │     │     │
Regions     R1    R2    R3           R4    R5    R6    R1
            │     │     │            │     │     │     │
Boards      ├─────┼─────┤            ├─────┼─────┼─────┤
            board-1                  board-2
```

---

## Edge Cases

1. **Segment with no words**: Skip segment, map trigger to next segment
2. **Multiple segments same region**: Only trigger on first entry
3. **Very short segments**: May have fewer than minWordsBetweenTriggers
4. **Missing word timestamps**: Fall back to segment-level timing

```typescript
// Handle missing word timestamps
if (!audio.wordTimestamps || audio.wordTimestamps.length === 0) {
  console.warn(`[TRIGGERS] No word timestamps for segment ${segIdx}, using segment start`);
  timings.push({
    word: '[SEGMENT]',
    startMs: 0,
    endMs: audio.durationMs,
    segmentIndex: segIdx,
    localWordIndex: 0,
    globalWordIndex: globalWordIndex++,
    globalStartMs: globalTimeOffset,
  });
}
```

---

## Next Step

Proceed to [07-build-stage.md](./07-build-stage.md)
