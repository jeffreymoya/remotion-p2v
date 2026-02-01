import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "../[id]/storyboard/route";
import { runStoryboardStage } from "@/src/lib/storyflow/pipeline/stages/storyboard";

vi.mock("@/src/lib/storyflow/pipeline/stages/storyboard", () => ({
  runStoryboardStage: vi.fn(),
}));

describe("POST /api/projects/[id]/storyboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs storyboard stage and returns board count", async () => {
    vi.mocked(runStoryboardStage).mockResolvedValue({ boardCount: 5 });

    const req = new NextRequest("http://localhost:3000/api/projects/proj-1/storyboard", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "proj-1" }) });
    const json = await res.json();

    expect(runStoryboardStage).toHaveBeenCalledWith("proj-1");
    expect(res.status).toBe(200);
    expect(json).toEqual({ status: "BOARDS_READY", boardCount: 5 });
  });

  it("surfaces errors via withErrorHandler", async () => {
    vi.mocked(runStoryboardStage).mockRejectedValue(new Error("storyboard broke"));

    const req = new NextRequest("http://localhost:3000/api/projects/proj-1/storyboard", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "proj-1" }) });
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.code).toBe("INTERNAL_ERROR");
  });
});
