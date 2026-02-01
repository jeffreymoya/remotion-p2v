import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { NotFoundError } from "@/app/api/lib";
import { GET } from "../[id]/timeline/route";

vi.mock("@/src/lib/storyflow/pipeline/stages/build", () => ({
  buildProjectArtifacts: vi.fn(),
}));

import { buildProjectArtifacts } from "@/src/lib/storyflow/pipeline/stages/build";

describe("Projects API - /api/projects/[id]/timeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns timeline when build succeeds", async () => {
    const timeline = { segments: [], durationMs: 1000 };
    vi.mocked(buildProjectArtifacts).mockResolvedValue(timeline as never);

    const req = new NextRequest("http://localhost:3000/api/projects/proj-1/timeline");
    const res = await GET(req, { params: Promise.resolve({ id: "proj-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.timeline).toEqual(timeline);
    expect(buildProjectArtifacts).toHaveBeenCalledWith("proj-1");
  });

  it("returns 404 when timeline build fails due to missing artifacts", async () => {
    vi.mocked(buildProjectArtifacts).mockRejectedValue(new NotFoundError("Viewport", "proj-2"));

    const req = new NextRequest("http://localhost:3000/api/projects/proj-2/timeline");
    const res = await GET(req, { params: Promise.resolve({ id: "proj-2" }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.code).toBe("NOT_FOUND");
    expect(json.error).toBe("Viewport not found: proj-2");
  });
});
