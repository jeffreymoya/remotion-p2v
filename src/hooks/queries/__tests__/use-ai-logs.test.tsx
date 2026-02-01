import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@/src/test/utils";
import { createQueryWrapper, createTestQueryClient } from "@/src/test/utils";
import { useAiLogs } from "../use-ai-logs";
import * as api from "@/src/lib/api/ai-logs";

describe("useAiLogs", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("fetches logs with filters and returns data", async () => {
    const response = {
      logs: [{ id: "log-1" }],
      stats: { summary: { pendingCalls: 1, totalCalls: 1, successRate: 1, avgLatency: 100, totalTokens: 10 } },
      pagination: { page: 1, limit: 10, totalCount: 1, totalPages: 1, hasMore: false },
    };
    const spy = vi.spyOn(api, "fetchAiLogs").mockResolvedValue(response as any);

    const { result } = renderHook(() => useAiLogs("proj-1", "PENDING", "gemini"), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.data).toEqual(response));
    expect(spy).toHaveBeenCalledWith({
      projectId: "proj-1",
      status: "PENDING",
      provider: "gemini",
    });
  });
});
