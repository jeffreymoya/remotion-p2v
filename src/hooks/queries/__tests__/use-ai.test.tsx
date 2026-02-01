import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@/src/test/utils";
import { createQueryWrapper, createTestQueryClient } from "@/src/test/utils";
import { useRefineTopic } from "../use-ai";
import * as api from "@/src/lib/api/ai";

describe("useRefineTopic", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("calls refineTopic mutation", async () => {
    const payload = { projectId: "p1", title: "Title", description: "Desc" };
    vi.spyOn(api, "refineTopic").mockResolvedValue({ refinedTitle: "Better", refinedDescription: "Better desc" } as any);

    const { result } = renderHook(() => useRefineTopic(), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });

    await result.current.mutateAsync(payload);
    expect(api.refineTopic).toHaveBeenCalledWith(payload);
  });
});
