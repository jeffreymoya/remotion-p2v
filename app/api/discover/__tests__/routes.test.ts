import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET as getDiscover, POST as postDiscover } from "../route";
import { POST as postGeneralize } from "../generalize/route";
import { ValidationError } from "@/app/api/lib";

vi.mock("@/src/lib/storyflow/discovery", () => ({
  fetchTrendingTopics: vi.fn(),
}));

vi.mock("@/src/lib/storyflow/ai", () => ({
  generalizeTopics: vi.fn(),
}));

const { fetchTrendingTopics } = await import("@/src/lib/storyflow/discovery");
const { generalizeTopics } = await import("@/src/lib/storyflow/ai");

describe("/api/discover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns topics with defaults when no query provided", async () => {
    vi.mocked(fetchTrendingTopics).mockResolvedValue([{ topic: "ai" }]);

    const req = new NextRequest("http://localhost:3000/api/discover");
    const res = await getDiscover(req);
    const json = await res.json();

    expect(fetchTrendingTopics).toHaveBeenCalledWith("US", undefined);
    expect(res.status).toBe(200);
    expect(json.topics).toEqual([{ topic: "ai" }]);
  });

  it("POST returns topics with provided geo/category", async () => {
    vi.mocked(fetchTrendingTopics).mockResolvedValue([{ topic: "news" }]);

    const req = new NextRequest("http://localhost:3000/api/discover", {
      method: "POST",
      body: JSON.stringify({ geo: "CA", category: 12 }),
    });

    const res = await postDiscover(req);
    const json = await res.json();

    expect(fetchTrendingTopics).toHaveBeenCalledWith("CA", 12);
    expect(res.status).toBe(200);
    expect(json.topics[0].topic).toBe("news");
  });

  it("returns 400 for invalid payload", async () => {
    const req = new NextRequest("http://localhost:3000/api/discover", {
      method: "POST",
      body: JSON.stringify({ geo: "X", category: "not-a-number" }),
    });

    const res = await postDiscover(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/discover/generalize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generalizes trending topics with defaults", async () => {
    vi.mocked(fetchTrendingTopics).mockResolvedValue([{ topic: "ai" }]);
    vi.mocked(generalizeTopics).mockResolvedValue([
      { topic: "ai", suggestions: ["ml", "llm"] },
    ]);

    const req = new NextRequest("http://localhost:3000/api/discover/generalize", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-1" }),
    });

    const res = await postGeneralize(req);
    const json = await res.json();

    expect(fetchTrendingTopics).toHaveBeenCalledWith("US", undefined);
    expect(generalizeTopics).toHaveBeenCalledWith("proj-1", [{ topic: "ai" }], 4);
    expect(res.status).toBe(200);
    expect(json.totalTrends).toBe(1);
  });

  it("returns empty payload when no topics available", async () => {
    vi.mocked(fetchTrendingTopics).mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/discover/generalize", {
      method: "POST",
      body: JSON.stringify({ projectId: "proj-1" }),
    });

    const res = await postGeneralize(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.trendingTopics).toEqual([]);
  });

  it("returns 400 for invalid payload", async () => {
    const req = new NextRequest("http://localhost:3000/api/discover/generalize", {
      method: "POST",
      body: JSON.stringify({}), // missing projectId
    });

    const res = await postGeneralize(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });
});
