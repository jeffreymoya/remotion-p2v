import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST as postStart } from "../start/route";
import { GET as getStatus } from "../[id]/status/route";
import { NotFoundError } from "@/app/api/lib";

vi.mock("@/src/lib/storyflow/render", () => ({
  startRenderJob: vi.fn(),
  getRenderStatus: vi.fn(),
}));

const { startRenderJob, getRenderStatus } = await import("@/src/lib/storyflow/render");

describe("POST /api/render/start", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts a render with default quality when none is provided", async () => {
    vi.mocked(startRenderJob).mockResolvedValue({
      id: "render-1",
      projectId: "proj-1",
      status: "PROCESSING",
      quality: "DRAFT",
    });

    const req = new NextRequest("http://localhost:3000/api/render/start", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-1" }),
    });

    const res = await postStart(req);
    const json = await res.json();

    expect(startRenderJob).toHaveBeenCalledWith("proj-1", "DRAFT");
    expect(res.status).toBe(200);
    expect(json.id).toBe("render-1");
  });

  it("starts a render with the provided quality", async () => {
    vi.mocked(startRenderJob).mockResolvedValue({
      id: "render-2",
      projectId: "proj-1",
      status: "PROCESSING",
      quality: "HIGH",
    });

    const req = new NextRequest("http://localhost:3000/api/render/start", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-1", quality: "HIGH" }),
    });

    const res = await postStart(req);
    const json = await res.json();

    expect(startRenderJob).toHaveBeenCalledWith("proj-1", "HIGH");
    expect(res.status).toBe(200);
    expect(json.quality).toBe("HIGH");
  });

  it("returns 400 when the request body is invalid", async () => {
    const req = new NextRequest("http://localhost:3000/api/render/start", {
      method: "POST",
      body: JSON.stringify({ quality: "DRAFT" }),
    });

    const res = await postStart(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when the project is not found", async () => {
    vi.mocked(startRenderJob).mockRejectedValue(new NotFoundError("Project", "missing"));

    const req = new NextRequest("http://localhost:3000/api/render/start", {
      method: "POST",
      body: JSON.stringify({ projectId: "missing" }),
    });

    const res = await postStart(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.code).toBe("NOT_FOUND");
  });
});

describe("GET /api/render/[id]/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns render status when render exists", async () => {
    vi.mocked(getRenderStatus).mockResolvedValue({
      id: "render-1",
      projectId: "proj-1",
      status: "COMPLETED",
      quality: "DRAFT",
    });

    const req = new NextRequest("http://localhost:3000/api/render/render-1/status", {
      method: "GET",
    });

    const res = await getStatus(req, { params: Promise.resolve({ id: "render-1" }) });
    const json = await res.json();

    expect(getRenderStatus).toHaveBeenCalledWith("render-1");
    expect(res.status).toBe(200);
    expect(json.status).toBe("COMPLETED");
  });

  it("returns 404 when render is missing", async () => {
    vi.mocked(getRenderStatus).mockRejectedValue(new NotFoundError("Render", "missing"));

    const req = new NextRequest("http://localhost:3000/api/render/missing/status");

    const res = await getStatus(req, { params: Promise.resolve({ id: "missing" }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.code).toBe("NOT_FOUND");
  });
});
