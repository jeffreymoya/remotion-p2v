import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST as postScript } from "../script/route";
import { POST as postRefine } from "../refine/route";
import { POST as postViewport } from "../viewport/route";
import { ValidationError, NotFoundError, ServiceUnavailableError } from "@/app/api/lib";
import { buildViewport } from "@/src/test/factories";

vi.mock("@/src/lib/storyflow/prisma", () => ({
  storyflowPrisma: {
    project: {
      findByIdOrThrow: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/src/lib/storyflow/scripts", () => ({
  saveScript: vi.fn(),
  generateDemoScript: vi.fn(),
}));

vi.mock("@/src/lib/storyflow/ai", () => ({
  generateScriptFromGemini: vi.fn(),
}));

vi.mock("@/src/lib/services/ai", () => ({
  aiGenerate: vi.fn(),
}));

vi.mock("@/config/prompts", () => ({
  refineTopicPrompt: vi.fn(() => "prompt"),
}));

vi.mock("@/src/lib/storyflow/settings", () => ({
  getSettings: vi.fn(() => ({
    ai: { proModel: "gemini-2.0" },
  })),
}));

vi.mock("@/src/lib/logger", () => {
  const baseLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnValue({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  };
  return {
    aiLogger: {
      warn: vi.fn(),
      error: vi.fn(),
    },
    logger: baseLogger,
  };
});

vi.mock("@/src/lib/storyflow/viewport", () => ({
  generateViewportForProject: vi.fn(),
}));

const { storyflowPrisma } = await import("@/src/lib/storyflow/prisma");
const { saveScript, generateDemoScript } = await import("@/src/lib/storyflow/scripts");
const { generateScriptFromGemini } = await import("@/src/lib/storyflow/ai");
const { aiGenerate } = await import("@/src/lib/services/ai");
const { generateViewportForProject } = await import("@/src/lib/storyflow/viewport");

describe("POST /api/ai/script", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates script via Gemini and saves it", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({ id: "proj-1", topic: "Old Topic" });
    vi.mocked(generateScriptFromGemini).mockResolvedValue({ segments: [{ text: "Hello" }] });
    vi.mocked(saveScript).mockResolvedValue({ id: "script-1" });

    const req = new NextRequest("http://localhost:3000/api/ai/script", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-1", topic: "New Topic" }),
    });

    const res = await postScript(req);
    const json = await res.json();

    expect(generateScriptFromGemini).toHaveBeenCalledWith("proj-1", "New Topic");
    expect(saveScript).toHaveBeenCalledWith("proj-1", { segments: [{ text: "Hello" }] });
    expect(storyflowPrisma.project.update).toHaveBeenCalledWith({
      where: { id: "proj-1" },
      data: { topic: "New Topic" },
    });
    expect(res.status).toBe(200);
    expect(json).toEqual({ script: { id: "script-1" } });
  });

  it("falls back to demo script when Gemini fails", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({ id: "proj-1", topic: "Old Topic" });
    vi.mocked(generateScriptFromGemini).mockRejectedValue(new Error("gemini down"));
    vi.mocked(generateDemoScript).mockReturnValue({ segments: [{ text: "Fallback" }] });
    vi.mocked(saveScript).mockResolvedValue({ id: "script-demo" });

    const req = new NextRequest("http://localhost:3000/api/ai/script", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-1", topic: "New Topic" }),
    });

    const res = await postScript(req);
    const json = await res.json();

    expect(generateScriptFromGemini).toHaveBeenCalled();
    expect(generateDemoScript).toHaveBeenCalledWith("New Topic");
    expect(saveScript).toHaveBeenCalledWith("proj-1", { segments: [{ text: "Fallback" }] });
    expect(res.status).toBe(200);
    expect(json.script.id).toBe("script-demo");
  });

  it("returns 404 when project is missing", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockRejectedValue(new NotFoundError("Project", "proj-404"));

    const req = new NextRequest("http://localhost:3000/api/ai/script", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-404", topic: "Topic" }),
    });

    const res = await postScript(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.code).toBe("NOT_FOUND");
  });

  it("returns 400 for invalid body", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/script", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await postScript(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/ai/refine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const refinement = {
    refinedTitle: "Refined",
    refinedDescription: "Desc",
    targetAudience: "aud",
    keyAngles: ["a", "b", "c"],
    hooks: ["h1", "h2"],
    suggestedDuration: 120,
    reasoning: "why",
  };

  it("refines topic with aiGenerate and updates project topic", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({ id: "proj-1" });
    vi.mocked(aiGenerate).mockResolvedValue({ data: refinement });

    const req = new NextRequest("http://localhost:3000/api/ai/refine", {
      method: "POST",
      body: JSON.stringify({
        projectId: "proj-1",
        title: "Title",
        description: "Desc",
      }),
    });

    const res = await postRefine(req);
    const json = await res.json();

    expect(aiGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "proj-1",
        operation: "refine-topic",
        schema: expect.anything(),
      })
    );
    expect(storyflowPrisma.project.update).toHaveBeenCalledWith({
      where: { id: "proj-1" },
      data: { topic: "Refined" },
    });
    expect(res.status).toBe(200);
    expect(json).toEqual(refinement);
  });

  it("returns 503 when Gemini is unavailable", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({ id: "proj-1" });
    vi.mocked(aiGenerate).mockRejectedValue(new Error("gemini unavailable"));

    const req = new NextRequest("http://localhost:3000/api/ai/refine", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-1", title: "Title" }),
    });

    const res = await postRefine(req);
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.code).toBe("SERVICE_UNAVAILABLE");
  });

  it("returns 404 when project is missing", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockRejectedValue(new NotFoundError("Project", "proj-404"));

    const req = new NextRequest("http://localhost:3000/api/ai/refine", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-404", title: "Title" }),
    });

    const res = await postRefine(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.code).toBe("NOT_FOUND");
  });

  it("returns 400 for invalid payload", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/refine", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-1" }),
    });

    const res = await postRefine(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/ai/viewport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns generated viewport", async () => {
    const viewport = buildViewport();
    vi.mocked(generateViewportForProject).mockResolvedValue({ viewport, source: "ai" });

    const req = new NextRequest("http://localhost:3000/api/ai/viewport", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-1", imageAssetId: "asset-1" }),
    });

    const res = await postViewport(req);
    const json = await res.json();

    expect(generateViewportForProject).toHaveBeenCalledWith("proj-1", "asset-1");
    expect(res.status).toBe(200);
    const expectedViewport = {
      ...viewport,
      createdAt: viewport.createdAt.toISOString(),
      updatedAt: viewport.updatedAt.toISOString(),
    };
    expect(json).toEqual({ viewport: expectedViewport, source: "ai" });
  });

  it("returns 404 when viewport generation fails for missing artifact", async () => {
    vi.mocked(generateViewportForProject).mockRejectedValue(new NotFoundError("Asset", "asset-404"));

    const req = new NextRequest("http://localhost:3000/api/ai/viewport", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-1", imageAssetId: "asset-404" }),
    });

    const res = await postViewport(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.code).toBe("NOT_FOUND");
  });

  it("returns 400 for invalid payload", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai/viewport", {
      method: "POST",
      body: JSON.stringify({ projectId: "" }),
    });

    const res = await postViewport(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });
});
