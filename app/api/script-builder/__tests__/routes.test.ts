import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST as postBlueprint } from "../blueprint/route";
import { GET as getDraft } from "../draft/[draftId]/route";
import { POST as postExecute } from "../execute/route";
import { POST as postSegment } from "../segment/route";
import { ValidationError, NotFoundError } from "@/app/api/lib";

vi.mock("@/src/lib/storyflow/prisma", () => ({
  storyflowPrisma: {
    project: { findByIdOrThrow: vi.fn(), update: vi.fn() },
    blueprint: { create: vi.fn(), findByIdOrThrow: vi.fn() },
    scriptDraft: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
    script: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@/src/lib/storyflow/history", () => ({
  recordBlueprintHistory: vi.fn(),
  recordScriptDraftHistory: vi.fn(),
}));

vi.mock("@/src/lib/storyflow/script-builder", () => ({
  generateBlueprint: vi.fn(),
  calculateBeatCount: vi.fn(),
  executeBeat: vi.fn(),
  segmentScript: vi.fn(),
}));

const { storyflowPrisma } = await import("@/src/lib/storyflow/prisma");
const { recordBlueprintHistory, recordScriptDraftHistory } = await import("@/src/lib/storyflow/history");
const { generateBlueprint, calculateBeatCount, executeBeat, segmentScript } = await import(
  "@/src/lib/storyflow/script-builder"
);

describe("POST /api/script-builder/blueprint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates and persists a blueprint", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({ id: "proj-1", topic: "Old" });
    vi.mocked(calculateBeatCount).mockReturnValue(3);
    vi.mocked(generateBlueprint).mockResolvedValue({
      beats: [{ index: 1, title: "Intro" }, { index: 2, title: "Body" }, { index: 3, title: "Outro" }],
    });
    vi.mocked(storyflowPrisma.blueprint.create).mockResolvedValue({ id: "bp-1", beats: [] });

    const req = new NextRequest("http://localhost:3000/api/script-builder/blueprint", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-1", topic: "New Topic", targetDurationMs: 120000 }),
    });

    const res = await postBlueprint(req);
    const json = await res.json();

    expect(generateBlueprint).toHaveBeenCalledWith("proj-1", "New Topic", 120000);
    expect(storyflowPrisma.blueprint.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ projectId: "proj-1", status: "PENDING_REVIEW" }),
      })
    );
    expect(storyflowPrisma.project.update).toHaveBeenCalledWith({
      where: { id: "proj-1" },
      data: { topic: "New Topic" },
    });
    expect(recordBlueprintHistory).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(json.message).toContain("Blueprint generated");
  });

  it("returns 404 when project is missing", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockRejectedValue(new NotFoundError("Project", "missing"));

    const req = new NextRequest("http://localhost:3000/api/script-builder/blueprint", {
      method: "POST",
      body: JSON.stringify({ projectId: "missing", topic: "t", targetDurationMs: 1000 }),
    });

    const res = await postBlueprint(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.code).toBe("NOT_FOUND");
  });

  it("returns 400 for invalid body", async () => {
    const req = new NextRequest("http://localhost:3000/api/script-builder/blueprint", {
      method: "POST",
      body: JSON.stringify({ projectId: "", topic: "", targetDurationMs: -1 }),
    });

    const res = await postBlueprint(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/script-builder/draft/[draftId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns draft with blueprint", async () => {
    vi.mocked(storyflowPrisma.scriptDraft.findUnique).mockResolvedValue({
      id: "draft-1",
      blueprint: { id: "bp-1" },
    });

    const req = new NextRequest("http://localhost:3000/api/script-builder/draft/draft-1");
    const res = await getDraft(req, { params: Promise.resolve({ draftId: "draft-1" }) });
    const json = await res.json();

    expect(storyflowPrisma.scriptDraft.findUnique).toHaveBeenCalledWith({
      where: { id: "draft-1" },
      include: { blueprint: true },
    });
    expect(res.status).toBe(200);
    expect(json.draft.id).toBe("draft-1");
  });

  it("returns 404 when draft missing", async () => {
    vi.mocked(storyflowPrisma.scriptDraft.findUnique).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/script-builder/draft/missing");
    const res = await getDraft(req, { params: Promise.resolve({ draftId: "missing" }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.code).toBe("NOT_FOUND");
  });
});

describe("POST /api/script-builder/execute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executes beats and checkpoints progress", async () => {
    vi.mocked(storyflowPrisma.blueprint.findByIdOrThrow).mockResolvedValue({
      id: "bp-1",
      status: "APPROVED",
      projectId: "proj-1",
      beats: [
        { index: 1, title: "Intro" },
        { index: 2, title: "Body" },
      ],
    });
    vi.mocked(storyflowPrisma.scriptDraft.create).mockResolvedValue({ id: "draft-1" });
    vi.mocked(executeBeat).mockResolvedValue({ text: "Beat text", index: 1 });
    vi.mocked(storyflowPrisma.scriptDraft.update).mockResolvedValue({ id: "draft-1" });

    const req = new NextRequest("http://localhost:3000/api/script-builder/execute", {
      method: "POST",
      body: JSON.stringify({ blueprintId: "bp-1" }),
    });

    const res = await postExecute(req);
    const json = await res.json();

    expect(storyflowPrisma.blueprint.findByIdOrThrow).toHaveBeenCalledWith("bp-1");
    expect(executeBeat).toHaveBeenCalledTimes(2);
    expect(storyflowPrisma.scriptDraft.update).toHaveBeenCalled();
    expect(recordScriptDraftHistory).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(json.status).toBe("GLUING");
  });

  it("returns 400 when blueprint not approved", async () => {
    vi.mocked(storyflowPrisma.blueprint.findByIdOrThrow).mockResolvedValue({
      id: "bp-1",
      status: "PENDING_REVIEW",
      projectId: "proj-1",
      beats: [],
    });

    const req = new NextRequest("http://localhost:3000/api/script-builder/execute", {
      method: "POST",
      body: JSON.stringify({ blueprintId: "bp-1" }),
    });

    const res = await postExecute(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/script-builder/segment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("segments polished draft into script", async () => {
    vi.mocked(storyflowPrisma.scriptDraft.findUnique).mockResolvedValue({
      id: "draft-1",
      status: "GLUING",
      polishedText: "Hello world",
      blueprint: {
        projectId: "proj-1",
        project: { topic: "Topic" },
        beats: [{ index: 1, title: "Intro" }],
      },
    });
    vi.mocked(segmentScript).mockResolvedValue({
      segments: [{ index: 1, text: "Hello", wordCount: 2 }],
    });
    vi.mocked(storyflowPrisma.script.findUnique).mockResolvedValue(null);
    vi.mocked(storyflowPrisma.script.create).mockResolvedValue({ id: "script-1" });
    vi.mocked(storyflowPrisma.scriptDraft.update).mockResolvedValue({ id: "draft-1" });

    const req = new NextRequest("http://localhost:3000/api/script-builder/segment", {
      method: "POST",
      body: JSON.stringify({ draftId: "draft-1" }),
    });

    const res = await postSegment(req);
    const json = await res.json();

    expect(segmentScript).toHaveBeenCalledWith("proj-1", "Hello world", [{ index: 1, title: "Intro" }]);
    expect(storyflowPrisma.script.create).toHaveBeenCalled();
    expect(recordScriptDraftHistory).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(json.message).toContain("Script segmented");
  });

  it("returns 404 when draft missing", async () => {
    vi.mocked(storyflowPrisma.scriptDraft.findUnique).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/script-builder/segment", {
      method: "POST",
      body: JSON.stringify({ draftId: "missing" }),
    });

    const res = await postSegment(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.code).toBe("NOT_FOUND");
  });

  it("returns 400 when draft status invalid", async () => {
    vi.mocked(storyflowPrisma.scriptDraft.findUnique).mockResolvedValue({
      id: "draft-1",
      status: "DRAFTING",
      polishedText: "text",
      blueprint: { projectId: "proj-1", project: { topic: "t" }, beats: [] },
    });

    const req = new NextRequest("http://localhost:3000/api/script-builder/segment", {
      method: "POST",
      body: JSON.stringify({ draftId: "draft-1" }),
    });

    const res = await postSegment(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });
});
