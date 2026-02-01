import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@/src/test/utils";
import { createQueryWrapper, createTestQueryClient } from "@/src/test/utils";
import { useRegenerateSegment } from "../use-tts";
import * as ttsApi from "@/src/lib/api/tts";

describe("useRegenerateSegment", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls generateTTS and invalidates related caches", async () => {
    const client = createTestQueryClient();
    const wrapper = createQueryWrapper(client);
    const payload = { projectId: "proj-1", segmentIndex: 2, force: true };

    vi.spyOn(ttsApi, "generateTTS").mockResolvedValue({
      segment: { index: 2, text: "hello", audioUrl: "/a.mp3", actualDuration: 1.2, timestamps: [] },
    });
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useRegenerateSegment(payload.projectId), { wrapper });
    await result.current.mutateAsync(payload);

    expect(ttsApi.generateTTS).toHaveBeenCalledWith(payload);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["script", payload.projectId] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["segments", payload.projectId] });
  });
});
