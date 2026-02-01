import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@/src/test/utils";
import { createQueryWrapper, createTestQueryClient } from "@/src/test/utils";
import { useExecutionStatus } from "../use-execution-status";
import * as api from "@/src/lib/api/script-builder";

describe("useExecutionStatus", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("polls until completed", async () => {
    // Keep test fast by returning completed status immediately (no refetch interval waits)
    const spy = vi.spyOn(api, "fetchExecutionStatus").mockResolvedValue({ status: "COMPLETED" } as any);

    const client = createTestQueryClient();
    const { result } = renderHook(() => useExecutionStatus("draft-1"), {
      wrapper: createQueryWrapper(client),
    });

    await waitFor(() => expect(result.current.data?.status).toBe("COMPLETED"));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("skips when id missing", () => {
    const spy = vi.spyOn(api, "fetchExecutionStatus");
    renderHook(() => useExecutionStatus(null), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it("surfaced errors", async () => {
    vi.spyOn(api, "fetchExecutionStatus").mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useExecutionStatus("draft-err"), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("boom");
  });
});
