import assert from 'assert';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import sharp from 'sharp';

import { buildViewportJsonFromFiles as buildViewportJson } from '../src/lib/boards/viewport-service';

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function createTestImage(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await sharp({
    create: {
      width: 100,
      height: 50,
      channels: 3,
      background: '#ffffff',
    },
  })
    .png()
    .toFile(filePath);
}

async function run() {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'boards-build-'));
  const projectPath = path.join(tmpRoot, 'project-boards-test');
  const boardsDir = path.join(projectPath, 'boards');
  const imagesDir = path.join(projectPath, 'assets', 'images');

  // Inputs
  const plan = {
    version: '1.0',
    scriptPath: 'scripts/script-v1.json',
    totalSegments: 1,
    totalDurationMs: 1000,
    boards: [
      {
        boardId: 'board-1',
        segmentIndices: [0],
        totalDurationMs: 1000,
        topicSummary: 'Test board',
      },
    ],
    generatedAt: new Date().toISOString(),
  };

  const regions = {
    boards: [
      {
        version: '1.0' as const,
        boardId: 'board-1',
        imagePath: 'assets/images/board-1.png',
        imageMetadata: { width: 100, height: 50, aspectRatio: 2 },
        regions: [
          {
            id: 'region-1',
            elementId: 'elem-1',
            gridPosition: { row: 0, col: 0 },
            bounds: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
            label: 'test',
            salience: 0.9,
          },
        ],
        generatedAt: new Date().toISOString(),
      },
    ],
  };

  const triggers = {
    version: '1.0',
    triggers: [
      {
        triggerId: 'trigger-1',
        wordId: 'seg-0-w-0',
        globalWordIndex: 0,
        segmentIndex: 0,
        localWordIndex: 0,
        word: 'Hello',
        wordStartMs: 1000,
        targetRegionId: 'region-1',
        targetBoardId: 'board-1',
        transitionMs: 0,
        triggerType: 'segment_start' as const,
      },
    ],
    totalWords: 1,
    totalTriggers: 1,
    generatedAt: new Date().toISOString(),
  };

  await writeJson(path.join(boardsDir, 'board-plan.json'), plan);
  await writeJson(path.join(boardsDir, 'board-regions.json'), regions);
  await writeJson(path.join(boardsDir, 'board-triggers.json'), triggers);

  // Image (_8k should be preferred when present)
  await createTestImage(path.join(imagesDir, 'board-1_8k.png'));

  const viewport = await buildViewportJson(projectPath, 25);

  assert.strictEqual(viewport.boards.length, 1);
  const board = viewport.boards[0];
  assert.strictEqual(board.imageSource, 'board-1_8k.png', 'should prefer upscaled asset when available');
  assert.deepStrictEqual(board.segmentRange, [0, 0]);
  assert.strictEqual(board.regions.length, 1);

  assert.strictEqual(viewport.wordTriggers.length, 1);
  assert.strictEqual(viewport.keyframes.length, 1);

  const keyframe = viewport.keyframes[0];
  assert.strictEqual(keyframe.frame, 25, 'wordStartMs 1000ms at 25fps => frame 25');
  assert.strictEqual(keyframe.boardId, 'board-1');
  assert.strictEqual(keyframe.regionId, 'region-1');

  // Center should be derived from bounds
  const { centerX, centerY } = keyframe.viewport;
  assert.ok(centerX > 0 && centerX < 1, 'centerX normalized');
  assert.ok(centerY > 0 && centerY < 1, 'centerY normalized');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
