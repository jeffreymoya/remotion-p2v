import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET as getLogs } from "../[id]/ai-logs/route";
import { AiCallStatus } from "@/src/generated/storyflow";

vi.mock("@/src/lib/storyflow/prisma", () => ({
  storyflowPrisma: {
    aiCallLog: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/src/lib/services/ai", () => ({
  aiLogger: {
    onNewLog: vi.fn(),
  },
}));

const { storyflowPrisma } = await import("@/src/lib/storyflow/prisma");

describe("GET /api/projects/[id]/ai-logs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns logs with stats and pagination", async () => {
    const logs = [
      { id: "log-1", projectId: "proj-1", status: AiCallStatus.COMPLETED, startedAt: new Date() },
      { id: "log-2", projectId: "proj-1", status: AiCallStatus.PENDING, startedAt: new Date() },
    ];

    vi.mocked(storyflowPrisma.aiCallLog.findMany).mockResolvedValue(logs);
    vi.mocked(storyflowPrisma.aiCallLog.count).mockResolvedValue(2);
    vi.mocked(storyflowPrisma.aiCallLog.groupBy).mockResolvedValue([
      { status: AiCallStatus.COMPLETED, _count: 1, _avg: { durationMs: 1000 } },
      { status: AiCallStatus.PENDING, _count: 1, _avg: { durationMs: null } },
    ]);
    vi.mocked(storyflowPrisma.aiCallLog.aggregate).mockResolvedValue({
      _sum: { promptTokens: 10, responseTokens: 20 },
      _avg: { durationMs: 500 },
    });

    const req = new NextRequest("http://localhost:3000/api/projects/proj-1/ai-logs?page=0&limit=50");
    const res = await getLogs(req, { params: { id: "proj-1" } });
    const json = await res.json();

    expect(storyflowPrisma.aiCallLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { projectId: "proj-1" } })
    );
    expect(res.status).toBe(200);
    expect(json.logs).toHaveLength(2);
    expect(json.stats.summary.totalCalls).toBe(2);
    expect(json.pagination.totalCount).toBe(2);
  });

  it("returns 400 for invalid page param", async () => {
    const req = new NextRequest("http://localhost:3000/api/projects/proj-1/ai-logs?page=-1");
    const res = await getLogs(req, { params: { id: "proj-1" } });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });
});
