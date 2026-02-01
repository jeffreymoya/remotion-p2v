import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "../[id]/media/stage/route";
import { runMediaStage } from "@/src/lib/storyflow/pipeline/stages/media";

vi.mock("@/src/lib/storyflow/pipeline/stages/media", () => ({
  runMediaStage: vi.fn(),
}));

describe("POST /api/projects/[id]/media/stage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs media stage and returns asset count", async () => {
    vi.mocked(runMediaStage).mockResolvedValue({ assetCount: 3 });

    const req = new NextRequest("http://localhost:3000/api/projects/proj-1/media/stage", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "proj-1" }) });
    const json = await res.json();

    expect(runMediaStage).toHaveBeenCalledWith("proj-1");
    expect(res.status).toBe(200);
    expect(json).toEqual({ status: "ASSETS_READY", assets: 3 });
  });

  it("bubbles pipeline errors through withErrorHandler", async () => {
    vi.mocked(runMediaStage).mockRejectedValue(new Error("pipeline failed"));

    const req = new NextRequest("http://localhost:3000/api/projects/proj-1/media/stage", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "proj-1" }) });
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.code).toBe("INTERNAL_ERROR");
    expect(json.error).toBeDefined();
  });
});
