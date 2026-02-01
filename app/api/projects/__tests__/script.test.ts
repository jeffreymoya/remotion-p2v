import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "../[id]/script/stage/route";
import { ValidationError, NotFoundError } from "@/app/api/lib";
import { runScriptStage } from "@/src/lib/storyflow/pipeline/stages/script";

vi.mock("@/src/lib/storyflow/pipeline/stages/script", () => ({
  runScriptStage: vi.fn(),
}));

describe("POST /api/projects/[id]/script/stage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs script stage and returns segment count", async () => {
    vi.mocked(runScriptStage).mockResolvedValue({ segmentCount: 4 });

    const req = new NextRequest("http://localhost:3000/api/projects/proj-1/script/stage", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "proj-1" }) });
    const json = await res.json();

    expect(runScriptStage).toHaveBeenCalledWith("proj-1");
    expect(res.status).toBe(200);
    expect(json).toEqual({ status: "SCRIPT_READY", segments: 4 });
  });

  it("returns 404 when the script is missing", async () => {
    vi.mocked(runScriptStage).mockRejectedValue(new NotFoundError("Script", "proj-1"));

    const req = new NextRequest("http://localhost:3000/api/projects/proj-1/script/stage", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "proj-1" }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.code).toBe("NOT_FOUND");
  });

  it("returns 400 when stage validation fails", async () => {
    vi.mocked(runScriptStage).mockRejectedValue(new ValidationError("Invalid state"));

    const req = new NextRequest("http://localhost:3000/api/projects/proj-1/script/stage", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "proj-1" }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
    expect(json.error).toContain("Invalid state");
  });
});
