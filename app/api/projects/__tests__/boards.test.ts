import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET as getBoards, POST as postBoards } from "../[id]/boards/route";
import { GET as getBoard, PUT as putBoard } from "../[id]/boards/[boardId]/route";
import { POST as postPlan, GET as getPlan } from "../[id]/boards/plan/route";
import { POST as postPrompts } from "../[id]/boards/prompts/route";
import { POST as postTriggers } from "../[id]/boards/triggers/route";
import { POST as postViewport } from "../[id]/boards/viewport/route";
import { NotFoundError } from "@/app/api/lib";

// In-memory fs mock
const memFiles = new Map<string, string>();

vi.mock("fs/promises", () => {
  const access = vi.fn(async (file: string) => {
    if (!memFiles.has(file)) {
      const err = new Error("ENOENT");
      // @ts-expect-error augment
      err.code = "ENOENT";
      throw err;
    }
  });
  const readFile = vi.fn(async (file: string) => {
    const val = memFiles.get(file);
    if (val === undefined) {
      const err = new Error("ENOENT");
      // @ts-expect-error augment
      err.code = "ENOENT";
      throw err;
    }
    return val;
  });
  const writeFile = vi.fn(async (file: string, data: string) => {
    memFiles.set(file, typeof data === "string" ? data : JSON.stringify(data));
  });
  const rm = vi.fn();
  return { __esModule: true, default: { access, readFile, writeFile, rm }, access, readFile, writeFile, rm };
});

vi.mock("@/src/lib/paths", () => ({
  getProjectPaths: vi.fn((projectId: string) => ({
    root: `/projects/${projectId}`,
    boards: `/projects/${projectId}/boards`,
    assetsImages: `/projects/${projectId}/assets/images`,
    tags: `/projects/${projectId}/tags.json`,
    viewport: `/projects/${projectId}/viewport.json`,
  })),
  ensureProjectDirs: vi.fn(async (projectId: string) => ({
    boards: `/projects/${projectId}/boards`,
    assetsImages: `/projects/${projectId}/assets/images`,
  })),
  getPublicDir: vi.fn(() => "/public"),
}));

vi.mock("@/src/lib/storyflow/prisma", () => ({
  storyflowPrisma: {
    project: {
      findByIdOrThrow: vi.fn(),
      update: vi.fn(),
    },
    board: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/src/lib/boards/plan-service", () => ({
  planBoards: vi.fn(),
}));

vi.mock("@/src/lib/boards/prompts-service", () => ({
  generateBoardPrompts: vi.fn(),
}));

vi.mock("@/src/lib/boards/regions-service", () => ({
  detectBoardRegions: vi.fn(),
  RegionDetectionResponseSchema: { parse: (x: unknown) => x },
}));

vi.mock("@/src/lib/services/ai", () => ({
  aiGenerate: vi.fn(),
}));

vi.mock("@/src/lib/boards/trigger-service", () => ({
  generateBoardTriggers: vi.fn(),
  DEFAULT_TRIGGER_CONFIG: {
    triggerAtSegmentStart: true,
    triggerAtTopicShift: true,
    minWordsBetweenTriggers: 3,
    transitionMs: { segmentStart: 100, topicShift: 100, emphasis: 100 },
  },
}));

vi.mock("@/src/lib/boards/viewport-service", () => ({
  buildViewportJson: vi.fn(),
}));

vi.mock("sharp", () => ({
  __esModule: true,
  default: vi.fn(() => ({
    metadata: vi.fn(async () => ({ width: 3000, height: 3000 })),
  })),
}));

const { storyflowPrisma } = await import("@/src/lib/storyflow/prisma");
const { planBoards } = await import("@/src/lib/boards/plan-service");
const { generateBoardPrompts } = await import("@/src/lib/boards/prompts-service");
const { generateBoardTriggers } = await import("@/src/lib/boards/trigger-service");
const { buildViewportJson } = await import("@/src/lib/boards/viewport-service");
const { access, writeFile } = await import("fs/promises");

describe("Boards API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memFiles.clear();
  });

  it("lists boards for a project", async () => {
    vi.mocked(storyflowPrisma.board.findMany).mockResolvedValue([{ id: "b1" }]);

    const res = await getBoards(new NextRequest("http://localhost:3000/api/projects/p1/boards"), {
      params: Promise.resolve({ id: "p1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.boards).toHaveLength(1);
  });

  it("creates a board and advances project status to BOARDS_READY", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({ id: "p1", status: "ASSETS_READY" });
    vi.mocked(storyflowPrisma.board.count).mockResolvedValue(0);
    vi.mocked(storyflowPrisma.board.create).mockResolvedValue({ id: "b1", index: 0 });

    const req = new NextRequest("http://localhost:3000/api/projects/p1/boards", {
      method: "POST",
      body: JSON.stringify({ layout: { columns: 2, rows: 2 } }),
    });
    const res = await postBoards(req, { params: Promise.resolve({ id: "p1" }) });

    expect(storyflowPrisma.board.create).toHaveBeenCalled();
    expect(storyflowPrisma.project.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { status: "BOARDS_READY" },
    });
    expect(res.status).toBe(200);
  });

  it("returns 400 for invalid board payload", async () => {
    const req = new NextRequest("http://localhost:3000/api/projects/p1/boards", {
      method: "POST",
      body: JSON.stringify({ layout: { columns: 0, rows: 0 } }),
    });
    const res = await postBoards(req, { params: Promise.resolve({ id: "p1" }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when project is missing", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockRejectedValue(
      new NotFoundError("Project", "missing")
    );

    const req = new NextRequest("http://localhost:3000/api/projects/missing/boards", {
      method: "POST",
      body: JSON.stringify({ layout: { columns: 2, rows: 2 } }),
    });
    const res = await postBoards(req, { params: Promise.resolve({ id: "missing" }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.code).toBe("NOT_FOUND");
  });

  it("gets board detail and handles missing board", async () => {
    vi.mocked(storyflowPrisma.board.findFirst).mockResolvedValue({ id: "b1" });

    const ok = await getBoard(new NextRequest("http://localhost:3000"), {
      params: Promise.resolve({ id: "p1", boardId: "b1" }),
    });
    expect(ok.status).toBe(200);

    vi.mocked(storyflowPrisma.board.findFirst).mockResolvedValue(null);
    const missing = await getBoard(new NextRequest("http://localhost:3000"), {
      params: Promise.resolve({ id: "p1", boardId: "b-missing" }),
    });
    expect(missing.status).toBe(404);
  });

  it("plans boards from script segments", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({
      id: "p1",
      script: { segments: [{ index: 0, text: "Hello", estimatedDuration: 1000 }] },
    });
    vi.mocked(storyflowPrisma.board.upsert).mockResolvedValue({ id: "b1", index: 0 });
    vi.mocked(storyflowPrisma.board.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(planBoards).mockResolvedValue({
      version: "1.0",
      scriptPath: "projects/p1/script.json",
      totalSegments: 1,
      totalDurationMs: 1000,
      boards: [{ boardId: "b1", segmentIndices: [0], totalDurationMs: 1000, topicSummary: "sum" }],
      generatedAt: new Date().toISOString(),
    });

    const req = new NextRequest("http://localhost:3000/api/projects/p1/boards/plan", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await postPlan(req, { params: Promise.resolve({ id: "p1" }) });
    const json = await res.json();

    expect(planBoards).toHaveBeenCalled();
    expect(storyflowPrisma.board.upsert).toHaveBeenCalledTimes(1);
    expect(storyflowPrisma.board.deleteMany).toHaveBeenCalledWith({
      where: { projectId: "p1", index: { gte: 1 } },
    });
    expect(writeFile).toHaveBeenCalledWith(
      "/projects/p1/boards/board-plan.json",
      expect.any(String),
      "utf-8"
    );
    expect(res.status).toBe(200);
    expect(json.boards).toHaveLength(1);
  });

  it("returns 404 when plan fetch finds no boards", async () => {
    vi.mocked(storyflowPrisma.board.findMany).mockResolvedValue([]);
    const res = await getPlan(new NextRequest("http://localhost:3000/api/projects/p1/boards/plan"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(404);
  });

  it("generates prompts and writes file", async () => {
    vi.mocked(generateBoardPrompts).mockResolvedValue({
      version: "1.0",
      prompts: [],
      generatedAt: new Date().toISOString(),
    });

    const req = new NextRequest("http://localhost:3000/api/projects/p1/boards/prompts", {
      method: "POST",
      body: JSON.stringify({
        boards: [{ boardId: "b1", segmentIndices: [0], totalDurationMs: 1000, topicSummary: "t" }],
        segments: [
          { id: "s1", order: 1, text: "hello", estimatedDurationMs: 1000, speakingNotes: "" },
        ],
        gridLayout: { rows: 3, cols: 2 },
        styleGuide: "Noir collage wall",
      }),
    });

    const res = await postPrompts(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
    expect(generateBoardPrompts).toHaveBeenCalledWith(
      "p1",
      expect.any(Array),
      expect.any(Array),
      { rows: 3, cols: 2 },
      "Noir collage wall"
    );
    expect(writeFile).toHaveBeenCalled();
  });

  it("fails triggers when required files missing", async () => {
    // ensure access throws
    const req = new NextRequest("http://localhost:3000/api/projects/p1/boards/triggers", { method: "POST", body: JSON.stringify({}) });
    const res = await postTriggers(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(409);
  });

  it("builds triggers when files exist", async () => {
    // populate required files
    const plan = {
      version: "1.0",
      scriptPath: "projects/p1/script.json",
      totalSegments: 1,
      totalDurationMs: 1000,
      boards: [{ boardId: "b1", segmentIndices: [0], totalDurationMs: 1000, topicSummary: "t" }],
      generatedAt: new Date().toISOString(),
    };
    const prompts = { version: "1.0", prompts: [], generatedAt: new Date().toISOString() };
    const regions = {
      boards: [
        {
          version: "1.0",
          boardId: "b1",
          assetId: "asset-1",
          imageMetadata: { width: 1, height: 1, aspectRatio: 1 },
          regions: [],
          generatedAt: new Date().toISOString(),
        },
      ],
    };
    const tags = { manifest: { audio: [{}] } };
    const paths = {
      boards: "/projects/p1/boards",
      tags: "/projects/p1/tags.json",
    };
    memFiles.set(`${paths.boards}/board-plan.json`, JSON.stringify(plan));
    memFiles.set(`${paths.boards}/board-prompts.json`, JSON.stringify(prompts));
    memFiles.set(`${paths.boards}/board-regions.json`, JSON.stringify(regions));
    memFiles.set(paths.tags, JSON.stringify(tags));

    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({ id: "p1" });
    vi.mocked(generateBoardTriggers).mockResolvedValue({
      version: "1.0",
      triggers: [],
      totalWords: 0,
      totalTriggers: 0,
      generatedAt: new Date().toISOString(),
    });

    const req = new NextRequest("http://localhost:3000/api/projects/p1/boards/triggers", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await postTriggers(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
  });

  it("builds viewport when artifacts present", async () => {
    const plan = {
      version: "1.0",
      scriptPath: "projects/p1/script.json",
      totalSegments: 1,
      totalDurationMs: 1000,
      boards: [{ boardId: "b1", segmentIndices: [0], totalDurationMs: 1000, topicSummary: "t" }],
      generatedAt: new Date().toISOString(),
    };
    const regions = {
      boards: [
        {
          version: "1.0",
          boardId: "b1",
          assetId: "asset-1",
          imageMetadata: { width: 1, height: 1, aspectRatio: 1 },
          regions: [],
          generatedAt: new Date().toISOString(),
        },
      ],
    };
    const triggers = {
      version: "1.0",
      triggers: [],
      totalWords: 0,
      totalTriggers: 0,
      generatedAt: new Date().toISOString(),
    };
    const base = "/projects/p1";
    memFiles.set(`${base}/boards/board-plan.json`, JSON.stringify(plan));
    memFiles.set(`${base}/boards/board-regions.json`, JSON.stringify(regions));
    memFiles.set(`${base}/boards/board-triggers.json`, JSON.stringify(triggers));
    // image presence
    memFiles.set(`${base}/assets/images/b1.png`, "");

    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({ id: "p1" });
    vi.mocked(buildViewportJson).mockResolvedValue({
      boards: [],
      wordTriggers: [],
      keyframes: [],
    });

    const req = new NextRequest("http://localhost:3000/api/projects/p1/boards/viewport", {
      method: "POST",
      body: JSON.stringify({ fps: 24 }),
    });
    const res = await postViewport(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
  });

});
