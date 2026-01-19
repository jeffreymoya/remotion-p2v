> NOTE: CLI is deprecated and will be removed. Use the web UI. Any CLI references below are historical.

# Stage 2: Plan Stage

## Overview

Analyze the script to determine how many board images are needed and which segments map to each board.

**Files to create**:
- `config/prompts/boards-plan.prompt.ts`
- `cli/lib/board-planner.ts`

---

## Input

`scripts/script-v1.json`:

```json
{
  "title": "...",
  "segments": [
    {
      "id": "segment-1",
      "order": 1,
      "text": "...",
      "estimatedDurationMs": 15000,
      "speakingNotes": "..."
    }
  ]
}
```

---

## Output

`boards/board-plan.json`:

```json
{
  "version": "1.0",
  "scriptPath": "scripts/script-v1.json",
  "totalSegments": 10,
  "totalDurationMs": 735000,
  "boards": [
    {
      "boardId": "board-1",
      "segmentIndices": [0, 1],
      "totalDurationMs": 100000,
      "topicSummary": "Introduction and early career"
    },
    {
      "boardId": "board-2",
      "segmentIndices": [2, 3, 4],
      "totalDurationMs": 245000,
      "topicSummary": "Playing style and innovations"
    }
  ],
  "generatedAt": "2026-01-08T..."
}
```

---

## Algorithm

### Step 1: Calculate Segment Metrics

```typescript
interface SegmentMetrics {
  index: number;
  id: string;
  durationMs: number;
  cumulativeDurationMs: number;
  text: string;
}

function calculateMetrics(segments: ScriptSegment[]): SegmentMetrics[] {
  let cumulative = 0;
  return segments.map((seg, idx) => {
    cumulative += seg.estimatedDurationMs;
    return {
      index: idx,
      id: seg.id,
      durationMs: seg.estimatedDurationMs,
      cumulativeDurationMs: cumulative,
      text: seg.text,
    };
  });
}
```

### Step 2: Identify Topic Breaks (LLM)

Use Gemini to analyze segment text and identify natural topic shifts:

```typescript
interface TopicBreak {
  afterSegmentIndex: number;  // Break occurs after this segment
  reason: string;             // Why this is a topic shift
  confidence: number;         // 0-1
}
```

### Step 3: Apply Grouping Rules

```typescript
interface GroupingConfig {
  targetDurationMs: number;    // 75000 (75s)
  minSegments: number;         // 2
  maxSegments: number;         // 5
  topicBreakWeight: number;    // How much to respect topic breaks
}

function groupSegments(
  metrics: SegmentMetrics[],
  topicBreaks: TopicBreak[],
  config: GroupingConfig
): BoardSegmentMapping[] {
  const boards: BoardSegmentMapping[] = [];
  let currentBoard: number[] = [];
  let currentDuration = 0;

  for (let i = 0; i < metrics.length; i++) {
    const seg = metrics[i];
    const isTopicBreak = topicBreaks.some(tb => tb.afterSegmentIndex === i);

    // Check if we should start a new board
    const shouldBreak =
      // Duration exceeds target and we have minimum segments
      (currentDuration + seg.durationMs > config.targetDurationMs &&
       currentBoard.length >= config.minSegments) ||
      // Topic break and we have minimum segments
      (isTopicBreak && currentBoard.length >= config.minSegments) ||
      // Maximum segments reached
      (currentBoard.length >= config.maxSegments);

    if (shouldBreak && currentBoard.length > 0) {
      boards.push(createBoardMapping(boards.length + 1, currentBoard, metrics));
      currentBoard = [];
      currentDuration = 0;
    }

    currentBoard.push(i);
    currentDuration += seg.durationMs;
  }

  // Don't forget the last board
  if (currentBoard.length > 0) {
    boards.push(createBoardMapping(boards.length + 1, currentBoard, metrics));
  }

  return boards;
}
```

### Step 4: Generate Topic Summaries (LLM)

For each board group, generate a concise topic summary:

```typescript
async function generateTopicSummary(
  segments: ScriptSegment[],
  indices: number[]
): Promise<string> {
  const combinedText = indices.map(i => segments[i].text).join(' ');
  // Use Gemini to summarize in 5-10 words
  return await gemini.summarize(combinedText);
}
```

---

## LLM Prompt: Topic Break Detection

**File**: `config/prompts/boards-plan.prompt.ts`

```typescript
export function boardsPlanPrompt(segments: Array<{ index: number; text: string }>): string {
  const segmentList = segments
    .map(s => `[${s.index}] ${s.text.substring(0, 200)}...`)
    .join('\n\n');

  return `You are analyzing a video script to identify natural topic breaks for visual scene changes.

SCRIPT SEGMENTS:
${segmentList}

TASK:
Identify where MAJOR TOPIC SHIFTS occur between segments. A topic shift means:
- The subject matter changes significantly
- A new chapter or phase begins
- The narrative moves to a different aspect

RULES:
- Only identify SIGNIFICANT breaks, not minor transitions
- Consider 2-5 breaks for a 10-segment script
- Do NOT break between every segment

RETURN FORMAT:
{
  "topicBreaks": [
    {
      "afterSegmentIndex": 2,
      "reason": "Shifts from early career to playing style",
      "confidence": 0.9
    }
  ],
  "segmentSummaries": [
    { "index": 0, "topic": "Introduction" },
    { "index": 1, "topic": "Early career" }
  ]
}`;
}
```

---

## LLM Prompt: Topic Summary

```typescript
export function topicSummaryPrompt(segmentTexts: string[]): string {
  return `Summarize the main topic of these script segments in 5-10 words.

SEGMENTS:
${segmentTexts.join('\n---\n')}

Return ONLY the summary, no explanation. Example: "Early career and college achievements"`;
}
```

---

## Implementation: board-planner.ts

```typescript
// cli/lib/board-planner.ts

import { BoardPlan, BoardSegmentMapping, DEFAULT_BOARDS_CONFIG } from '../../src/lib/boards-types';
import { callGemini } from '../services/ai/gemini-cli';
import { boardsPlanPrompt, topicSummaryPrompt } from '../../config/prompts/boards-plan.prompt';

interface ScriptSegment {
  id: string;
  order: number;
  text: string;
  estimatedDurationMs: number;
}

interface Script {
  title: string;
  segments: ScriptSegment[];
  totalEstimatedDurationMs: number;
}

export async function planBoards(
  script: Script,
  scriptPath: string,
  config = DEFAULT_BOARDS_CONFIG
): Promise<BoardPlan> {
  console.log(`[PLAN] Analyzing ${script.segments.length} segments...`);

  // Step 1: Get topic breaks from LLM
  const topicBreaks = await detectTopicBreaks(script.segments);
  console.log(`[PLAN] Found ${topicBreaks.length} topic breaks`);

  // Step 2: Group segments into boards
  const boardGroups = groupSegments(script.segments, topicBreaks, config);
  console.log(`[PLAN] Created ${boardGroups.length} boards`);

  // Step 3: Generate summaries for each board
  const boards: BoardSegmentMapping[] = [];
  for (const group of boardGroups) {
    const summary = await generateTopicSummary(script.segments, group.indices);
    boards.push({
      boardId: `board-${boards.length + 1}`,
      segmentIndices: group.indices,
      totalDurationMs: group.durationMs,
      topicSummary: summary,
    });
  }

  return {
    version: '1.0',
    scriptPath,
    totalSegments: script.segments.length,
    totalDurationMs: script.totalEstimatedDurationMs,
    boards,
    generatedAt: new Date().toISOString(),
  };
}

async function detectTopicBreaks(segments: ScriptSegment[]): Promise<TopicBreak[]> {
  const prompt = boardsPlanPrompt(
    segments.map((s, i) => ({ index: i, text: s.text }))
  );

  const response = await callGemini(prompt);
  const parsed = JSON.parse(response);

  return parsed.topicBreaks;
}

function groupSegments(
  segments: ScriptSegment[],
  topicBreaks: TopicBreak[],
  config: typeof DEFAULT_BOARDS_CONFIG
): Array<{ indices: number[]; durationMs: number }> {
  // ... implementation as shown in Algorithm section
}

async function generateTopicSummary(
  segments: ScriptSegment[],
  indices: number[]
): Promise<string> {
  const texts = indices.map(i => segments[i].text);
  const prompt = topicSummaryPrompt(texts);
  return await callGemini(prompt);
}
```

---

## CLI Integration

```typescript
// In cli/commands/boards.ts

case 'plan': {
  const script = await readJson<Script>(paths.script);
  const plan = await planBoards(script, 'scripts/script-v1.json', config);

  await writeJson(path.join(paths.boards, 'board-plan.json'), plan);

  console.log('\n[PLAN] Board Plan Summary:');
  for (const board of plan.boards) {
    console.log(`  ${board.boardId}: segments ${board.segmentIndices.join(', ')}`);
    console.log(`    Duration: ${(board.totalDurationMs / 1000).toFixed(1)}s`);
    console.log(`    Topic: ${board.topicSummary}`);
  }
  break;
}
```

---

## Verification

```bash
# Run plan stage
npm run boards -- --project project-1764548027472 plan

# Expected output:
# [PLAN] Analyzing 10 segments...
# [PLAN] Found 3 topic breaks
# [PLAN] Created 4 boards
#
# [PLAN] Board Plan Summary:
#   board-1: segments 0, 1
#     Duration: 100.0s
#     Topic: Introduction and origin story
#   board-2: segments 2, 3, 4
#     Duration: 245.0s
#     Topic: Playing style innovations
#   ...

# Verify output file
cat public/projects/project-1764548027472/boards/board-plan.json | jq .
```

---

## Edge Cases

1. **Very short script (1-2 segments)**: Create single board
2. **Very long segments**: May need to exceed target duration
3. **No clear topic breaks**: Fall back to duration-based splitting
4. **LLM returns invalid JSON**: Retry 3x with exponential backoff, then fail
5. **Segment with 0 duration**: Skip segment, log warning, continue processing
6. **Total duration < targetDurationPerBoardMs**: Create single board with all segments
7. **Would exceed MAX_BOARDS (10)**: Stop creating boards, warn user that script is too long

```typescript
// Edge case handling example
function groupSegments(
  metrics: SegmentMetrics[],
  topicBreaks: TopicBreak[],
  config: GroupingConfig
): BoardSegmentMapping[] {
  const boards: BoardSegmentMapping[] = [];

  // Filter out zero-duration segments
  const validMetrics = metrics.filter(m => {
    if (m.durationMs <= 0) {
      console.warn(`[PLAN] Skipping segment ${m.index} with zero duration`);
      return false;
    }
    return true;
  });

  // ... grouping logic ...

  // Enforce MAX_BOARDS limit
  if (boards.length >= MAX_BOARDS) {
    console.warn(`[PLAN] Reached maximum board limit (${MAX_BOARDS}). Remaining segments added to last board.`);
    // Add remaining segments to last board
  }

  return boards;
}
```

---

## LLM Error Handling

All Gemini calls should use retry logic with exponential backoff:

```typescript
async function callGeminiWithRetry(prompt: string, maxRetries = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callGemini(prompt);
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      if (isLastAttempt) {
        throw new Error(`LLM call failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : error}`);
      }

      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.warn(`[LLM] Attempt ${attempt}/${maxRetries} failed. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable');
}
```

Use this pattern for:
- `detectTopicBreaks()` - Topic break detection
- `generateTopicSummary()` - Summary generation

---

## Next Step

Proceed to [03-prompts-stage.md](./03-prompts-stage.md)
