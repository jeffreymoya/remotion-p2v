import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/app/api/lib";
import { buildViewport } from "@/src/test/factories";
import { POST as postViewport } from "../viewport/route";

vi.mock("@/src/lib/storyflow/viewport", () => ({
  generateViewportForProject: vi.fn(),
}));

const { generateViewportForProject } = await import("@/src/lib/storyflow/viewport");

describe("POST /api/ai/viewport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns generated viewport", async () => {
    const viewport = buildViewport();
    vi.mocked(generateViewportForProject).mockResolvedValue({ viewport, source: "gemini" });

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
    expect(json).toEqual({ viewport: expectedViewport, source: "gemini" });
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
