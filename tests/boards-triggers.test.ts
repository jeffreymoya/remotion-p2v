import assert from 'assert';

import { DEFAULT_TRIGGER_CONFIG, generateBoardTriggers } from '../src/lib/trigger-generator';
import { BoardPlan, BoardPromptsOutput, BoardRegionsOutput } from '../src/lib/boards-types';

/**
 * Small sanity test to ensure the trigger generator stitches together
 * word timings, segment → element mappings, and topic breaks correctly.
 */
async function run() {
  const plan: BoardPlan = {
    version: '1.0',
    scriptPath: 'scripts/script-v1.json',
    totalSegments: 3,
    totalDurationMs: 3000,
    boards: [
      {
        boardId: 'board-1',
        segmentIndices: [0, 1],
        totalDurationMs: 2000,
        topicSummary: 'Opening context',
      },
      {
        boardId: 'board-2',
        segmentIndices: [2],
        totalDurationMs: 1000,
        topicSummary: 'Shift in topic',
      },
    ],
    generatedAt: '2026-01-08T00:00:00.000Z',
  };

  const prompts: BoardPromptsOutput = {
    version: '1.0',
    generatedAt: '2026-01-08T00:00:00.000Z',
    prompts: [
      {
        boardId: 'board-1',
        gridLayout: { rows: 2, cols: 3 },
        styleGuide: 'test-style',
        elements: [
          { id: 'elem-1', type: 'photo', gridPosition: { row: 0, col: 0 }, description: 'first' },
          { id: 'elem-2', type: 'note', gridPosition: { row: 0, col: 1 }, description: 'second' },
        ],
        segmentContexts: [
          { segmentIndex: 0, text: 'segment 0', focusElementId: 'elem-1' },
          { segmentIndex: 1, text: 'segment 1', focusElementId: 'elem-2' },
        ],
        fullPromptText: 'prompt-1',
      },
      {
        boardId: 'board-2',
        gridLayout: { rows: 2, cols: 3 },
        styleGuide: 'test-style',
        elements: [
          { id: 'elem-3', type: 'photo', gridPosition: { row: 1, col: 0 }, description: 'third' },
        ],
        segmentContexts: [
          { segmentIndex: 2, text: 'segment 2', focusElementId: 'elem-3' },
        ],
        fullPromptText: 'prompt-2',
      },
    ],
  };

  const regions: BoardRegionsOutput[] = [
    {
      version: '1.0',
      boardId: 'board-1',
      imagePath: 'assets/images/board-1.png',
      imageMetadata: { width: 2000, height: 1000, aspectRatio: 2 },
      regions: [
        {
          id: 'region-1',
          elementId: 'elem-1',
          gridPosition: { row: 0, col: 0 },
          bounds: { x: 0.05, y: 0.05, width: 0.3, height: 0.3 },
          label: 'first',
          salience: 0.9,
        },
        {
          id: 'region-2',
          elementId: 'elem-2',
          gridPosition: { row: 0, col: 1 },
          bounds: { x: 0.4, y: 0.05, width: 0.3, height: 0.3 },
          label: 'second',
          salience: 0.8,
        },
      ],
      generatedAt: '2026-01-08T00:00:00.000Z',
    },
    {
      version: '1.0',
      boardId: 'board-2',
      imagePath: 'assets/images/board-2.png',
      imageMetadata: { width: 2000, height: 1000, aspectRatio: 2 },
      regions: [
        {
          id: 'region-3',
          elementId: 'elem-3',
          gridPosition: { row: 1, col: 0 },
          bounds: { x: 0.05, y: 0.5, width: 0.3, height: 0.3 },
          label: 'third',
          salience: 0.7,
        },
      ],
      generatedAt: '2026-01-08T00:00:00.000Z',
    },
  ];

  const tags = {
    manifest: {
      audio: [
        {
          id: 'audio-0',
          segmentId: 'segment-0',
          durationMs: 1000,
          wordTimestamps: [
            { word: 'Hello', startMs: 0, endMs: 200 },
            { word: 'world', startMs: 500, endMs: 800 },
          ],
        },
        {
          id: 'audio-1',
          segmentId: 'segment-1',
          durationMs: 1000,
          wordTimestamps: [
            { word: 'Next', startMs: 0, endMs: 300 },
            { word: 'segment', startMs: 400, endMs: 700 },
          ],
        },
        {
          id: 'audio-2',
          segmentId: 'segment-2',
          durationMs: 1000,
          wordTimestamps: [
            { word: 'Final', startMs: 0, endMs: 250 },
            { word: 'topic', startMs: 300, endMs: 600 },
          ],
        },
      ],
    },
  };

  const config = {
    ...DEFAULT_TRIGGER_CONFIG,
    minWordsBetweenTriggers: 1,
    triggerAtTopicShift: true,
  } as const;

  const output = await generateBoardTriggers(plan, prompts, regions, tags, config);

  assert.strictEqual(output.triggers.length, 3, 'expected one trigger per segment start');

  const [t0, t1, t2] = output.triggers;

  assert.deepStrictEqual(t0, {
    triggerId: 'trigger-1',
    wordId: 'seg-0-w-0',
    globalWordIndex: 0,
    segmentIndex: 0,
    localWordIndex: 0,
    word: 'Hello',
    wordStartMs: 0,
    targetRegionId: 'region-1',
    targetBoardId: 'board-1',
    transitionMs: 0,
    triggerType: 'segment_start',
  });

  assert.strictEqual(t1.targetRegionId, 'region-2');
  assert.strictEqual(t1.segmentIndex, 1);
  assert.strictEqual(t1.wordStartMs, 1000, 'second segment should offset by previous duration');
  assert.strictEqual(t1.transitionMs, 800, 'segment_start transition should apply');
  assert.strictEqual(t1.triggerType, 'segment_start');

  assert.strictEqual(t2.targetRegionId, 'region-3');
  assert.strictEqual(t2.targetBoardId, 'board-2');
  assert.strictEqual(t2.triggerType, 'topic_shift');
  assert.strictEqual(t2.transitionMs, 1200);
  assert.strictEqual(t2.wordStartMs, 2000, 'third segment should include cumulative offset');

  // Ensure board change forces trigger even if gap < minWordsBetweenTriggers
  const shortGapConfig = {
    ...DEFAULT_TRIGGER_CONFIG,
    minWordsBetweenTriggers: 5,
    triggerAtSegmentStart: true,
    triggerAtTopicShift: true,
  } as const;

  const shortGapOutput = await generateBoardTriggers(plan, prompts, regions, tags, shortGapConfig);
  assert.strictEqual(shortGapOutput.triggers.length, 2, 'only board change should bypass min gap');
  const last = shortGapOutput.triggers.at(-1)!;
  assert.strictEqual(last.targetBoardId, 'board-2');
  assert.strictEqual(last.triggerType, 'topic_shift');

  assert.strictEqual(output.totalTriggers, 3);
  assert.strictEqual(output.totalWords, 6);

  // Missing word timestamps should still trigger once per segment
  const missingTags = {
    manifest: {
      audio: [
        { id: 'audio-0', segmentId: 'segment-0', durationMs: 1000, wordTimestamps: [] },
        { id: 'audio-1', segmentId: 'segment-1', durationMs: 1000, wordTimestamps: [] },
      ],
    },
  };

  const fallback = await generateBoardTriggers(
    { ...plan, totalSegments: 2, boards: [plan.boards[0]] },
    { ...prompts, prompts: [prompts.prompts[0]] },
    [regions[0]],
    missingTags as any,
    { ...DEFAULT_TRIGGER_CONFIG, minWordsBetweenTriggers: 5 }
  );

  assert.strictEqual(fallback.triggers.length, 2, 'fallback should fire per segment even without word timings');
  assert.strictEqual(fallback.totalWords, 2, 'placeholder words counted per segment');
  assert.strictEqual(fallback.triggers[1].segmentIndex, 1, 'second segment should still trigger despite min gap');

  // Unordered timestamps should be sorted by startMs
  const unorderedTags = {
    manifest: {
      audio: [
        {
          id: 'audio-0',
          segmentId: 'segment-0',
          durationMs: 1000,
          wordTimestamps: [
            { word: 'second', startMs: 500, endMs: 700 },
            { word: 'first', startMs: 0, endMs: 200 },
          ],
        },
      ],
    },
  };

  const unordered = await generateBoardTriggers(
    { ...plan, boards: [plan.boards[0]], totalSegments: 1 },
    { ...prompts, prompts: [prompts.prompts[0]] },
    [regions[0]],
    unorderedTags as any,
    { ...DEFAULT_TRIGGER_CONFIG, minWordsBetweenTriggers: 0 }
  );

  assert.strictEqual(unordered.triggers[0].word, 'first', 'should respect startMs ordering');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
