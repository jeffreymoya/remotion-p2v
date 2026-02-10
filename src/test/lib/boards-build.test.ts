import { describe, expect, it, vi, beforeEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";

import { buildViewportJsonFromFiles } from "@/src/lib/boards/viewport-service";
import { buildBoardPlan, createId } from "@/src/test/factories";

vi.mock("sharp", () => ({
  default: vi.fn(() => ({
    metadata: vi.fn().mockResolvedValue({ width: 100, height: 50 }),
  })),
}));

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

describe("boards viewport build", () => {
  const projectPath = path.join(process.cwd(), "tmp", `boards-${createId()}`);

  const boardsDir = path.join(projectPath, "boards");
  const imagesDir = path.join(projectPath, "assets", "images");

  beforeEach(async () => {
    await fs.rm(projectPath, { recursive: true, force: true });
  });

  it("prefers upscaled assets and maps triggers to keyframes", async () => {
    const plan = buildBoardPlan({
      boards: [
        {
          boardId: "board-1",
          segmentIndices: [0],
          totalDurationMs: 1000,
          topicSummary: "Test board",
        },
      ],
      totalSegments: 1,
    });

    const regions = {
      boards: [
        {
          version: "1.0" as const,
          boardId: "board-1",
          assetId: "asset-1",
          assetPath: "assets/images/board-1.png",
          imageMetadata: { width: 100, height: 50, aspectRatio: 2 },
          regions: [
            {
              id: "region-1",
              elementId: "elem-1",
              gridPosition: { row: 0, col: 0 },
              bounds: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
              label: "test",
              salience: 0.9,
            },
          ],
          generatedAt: new Date().toISOString(),
        },
      ],
    };

    const triggers = {
      version: "1.0",
      triggers: [
        {
          triggerId: "trigger-1",
          wordId: "seg-0-w-0",
          globalWordIndex: 0,
          segmentIndex: 0,
          localWordIndex: 0,
          word: "Hello",
          wordStartMs: 1000,
          targetRegionId: "region-1",
          targetBoardId: "board-1",
          transitionMs: 0,
          triggerType: "segment_start" as const,
        },
      ],
      totalWords: 1,
      totalTriggers: 1,
      generatedAt: new Date().toISOString(),
    };

    await writeJson(path.join(boardsDir, "board-plan.json"), plan);
    await writeJson(path.join(boardsDir, "board-regions.json"), regions);
    await writeJson(path.join(boardsDir, "board-triggers.json"), triggers);

    // Provide upscaled asset to prefer over base
    await fs.mkdir(imagesDir, { recursive: true });
    await fs.writeFile(path.join(imagesDir, "board-1_8k.png"), Buffer.from("img"));

    const viewport = await buildViewportJsonFromFiles(projectPath, 25);

    expect(viewport.boards).toHaveLength(1);
    const board = viewport.boards[0];
    expect(board.imageSource).toBe("board-1_8k.png");
    expect(board.segmentRange).toEqual([0, 0]);
    expect(board.regions).toHaveLength(1);

    expect(viewport.wordTriggers).toHaveLength(1);
    expect(viewport.keyframes).toHaveLength(1);

    const keyframe = viewport.keyframes[0];
    expect(keyframe.frame).toBe(25);
    expect(keyframe.boardId).toBe("board-1");
    expect(keyframe.regionId).toBe("region-1");
    expect(keyframe.viewport.centerX).toBeGreaterThan(0);
    expect(keyframe.viewport.centerX).toBeLessThan(1);
  });
});
