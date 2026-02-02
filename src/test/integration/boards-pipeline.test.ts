import { mkdtempSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { mkdir } from "node:fs/promises";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.hoisted(() => {
  process.env.SKIP_ENV_VALIDATION = "true";
});

// Mock sharp globally to avoid real image processing
vi.mock("sharp", () => {
  const fn = () => ({
    metadata: async () => ({ width: 1920, height: 1080 }),
  });
  return { __esModule: true, default: fn };
});

const aiGenerateMock = vi.hoisted(() => vi.fn());
const aiProviderCompleteMock = vi.hoisted(() => vi.fn());
const aiProviderFactoryMock = vi.hoisted(() => ({
  getProviderWithFallback: vi.fn().mockResolvedValue({
    complete: aiProviderCompleteMock,
    setPipelineStage: vi.fn(),
  }),
}));

vi.mock("@/src/lib/services/ai", () => ({
  aiGenerate: aiGenerateMock,
  AIProviderFactory: aiProviderFactoryMock,
}));

import { planBoards } from "@/src/lib/boards/plan-service";
import { generateBoardPrompts } from "@/src/lib/boards/prompts-service";
import { detectBoardRegions } from "@/src/lib/boards/regions-service";
import { generateBoardTriggers } from "@/src/lib/boards/trigger-service";
import { buildViewportJson } from "@/src/lib/boards/viewport-service";
import { BoardPromptsOutput, BoardRegionsOutput, BoardTriggersOutput, DEFAULT_BOARDS_CONFIG } from "@/src/lib/boards-types";

describe("Boards pipeline integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aiGenerateMock.mockReset();
    aiProviderCompleteMock.mockReset();

    // aiGenerate calls: 1) topic breaks, 2+) summaries per board
    aiGenerateMock
      .mockResolvedValueOnce({
        data: { topicBreaks: [{ afterSegmentIndex: 1, reason: "split", confidence: 0.9 }] },
      })
      .mockResolvedValue({ data: "Summary text" });

    // AI provider complete handler used by generateBoardPrompts
    aiProviderCompleteMock.mockImplementation((prompt: string) => {
      if (prompt.toLowerCase().includes("topics")) {
        // contentAnalysisPrompt path
        return JSON.stringify({
          topics: ["history"],
          entities: ["artifact"],
          tone: "dramatic",
        });
      }
      // elementDescriptionPrompt path
      return JSON.stringify(
        Array.from({ length: 6 }).map((_, i) => ({
          id: `elem-${i + 1}`,
          description: `Element ${i + 1}`,
          label: `Label ${i + 1}`,
        }))
      );
    });
  });

  it("flows plan -> prompts -> regions -> triggers -> viewport", async () => {
    const projectId = "proj-integration";
    const segments = [
      { index: 0, text: "First segment text", estimatedDuration: 5 },
      { index: 1, text: "Second segment text", estimatedDuration: 5 },
      { index: 2, text: "Third segment text", estimatedDuration: 5 },
    ];

    // 1) Plan boards
    const plan = await planBoards(projectId, segments, {
      ...DEFAULT_BOARDS_CONFIG,
      targetDurationPerBoardMs: 6000,
      minSegmentsPerBoard: 1,
      maxSegmentsPerBoard: 2,
    });
    expect(plan.boards.length).toBeGreaterThanOrEqual(2);
    const covered = plan.boards.flatMap((b) => b.segmentIndices).sort();
    expect(covered).toEqual([0, 1, 2]);

    // 2) Generate prompts
    const scriptForPrompts = segments.map((s) => ({
      id: `seg-${s.index}`,
      order: s.index,
      text: s.text,
      estimatedDurationMs: s.estimatedDuration * 1000,
    }));
    const prompts: BoardPromptsOutput = await generateBoardPrompts(plan.boards, scriptForPrompts);
    expect(prompts.prompts).toHaveLength(plan.boards.length);
    expect(prompts.prompts[0].segmentContexts[0].segmentIndex).toBe(0);

    // Prepare temp project with image placeholders
    const projectPath = mkdtempSync(path.join(tmpdir(), "boards-pipeline-"));
    const imagesDir = path.join(projectPath, "assets", "images");
    await mkdir(imagesDir, { recursive: true });
    for (const board of plan.boards) {
      writeFileSync(path.join(imagesDir, `${board.boardId}.png`), Buffer.from([0x89, 0x50]));
    }

    // 3) Detect regions (mock AI vision)
    const regionsResults: BoardRegionsOutput[] = [];
    for (const prompt of prompts.prompts) {
      const detection = await detectBoardRegions(
        prompt,
        path.join(imagesDir, `${prompt.boardId}.png`),
        async () => ({
          regions: prompt.elements.slice(0, 2).map((el, idx) => ({
            id: `${prompt.boardId}-region-${idx + 1}`,
            elementId: el.id,
            gridPosition: el.gridPosition,
            bounds: { x: 0.1 * (idx + 1), y: 0.1, width: 0.2, height: 0.2 },
            label: `Region ${idx + 1}`,
            salience: 0.8,
          })),
          detectionNotes: "ok",
        })
      );
      regionsResults.push({
        boardId: prompt.boardId,
        imageMetadata: detection.imageMetadata,
        regions: detection.regions,
        warnings: detection.warnings,
      });
    }

    expect(regionsResults).toHaveLength(plan.boards.length);
    expect(regionsResults[0].regions.length).toBeGreaterThan(0);

    // 4) Generate triggers
    const tags = {
      manifest: {
        audio: [
          {
            id: "a1",
            segmentId: "seg-0",
            durationMs: 4000,
            wordTimestamps: [
              { word: "hello", startMs: 0, endMs: 500 },
              { word: "world", startMs: 500, endMs: 1000 },
            ],
          },
          {
            id: "a2",
            segmentId: "seg-1",
            durationMs: 4000,
            wordTimestamps: [
              { word: "second", startMs: 0, endMs: 600 },
              { word: "segment", startMs: 600, endMs: 1200 },
            ],
          },
          {
            id: "a3",
            segmentId: "seg-2",
            durationMs: 3000,
            wordTimestamps: [
              { word: "third", startMs: 0, endMs: 700 },
              { word: "segment", startMs: 700, endMs: 1300 },
            ],
          },
        ],
      },
    };

    const triggers: BoardTriggersOutput = await generateBoardTriggers(plan, prompts, regionsResults, tags);
    expect(triggers.triggers.length).toBeGreaterThan(0);
    expect(triggers.triggers[0].targetBoardId).toBe(plan.boards[0].boardId);

    // 5) Build viewport.json
    const viewport = await buildViewportJson(plan, regionsResults, triggers, { projectPath, fps: 30 });

    expect(viewport.boards).toHaveLength(plan.boards.length);
    expect(viewport.wordTriggers.length).toBe(triggers.triggers.length);
    expect(viewport.keyframes.length).toBeGreaterThan(0);
    expect(viewport.boards[0].imageSource).toContain(".png");
  });
});
