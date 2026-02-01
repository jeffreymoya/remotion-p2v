import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@/src/test/utils";
import { createQueryWrapper, createTestQueryClient } from "@/src/test/utils";
import { useGenerateViewport, useSaveViewport } from "../use-viewport";
import * as viewportApi from "@/src/lib/api/viewport";

describe("useGenerateViewport", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("generates viewport with project and asset id", async () => {
    const payload = { projectId: "proj-1", imageAssetId: "asset-9" };
    vi.spyOn(viewportApi, "generateViewport").mockResolvedValue({
      viewport: { keyframes: [], regions: [] },
      source: "ai",
    });

    const { result } = renderHook(() => useGenerateViewport(), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });

    await result.current.mutateAsync(payload);
    expect(viewportApi.generateViewport).toHaveBeenCalledWith(payload.projectId, payload.imageAssetId);
  });
});

describe("useSaveViewport", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("saves viewport payload", async () => {
    const projectId = "proj-1";
    const data = { imageAssetId: "asset-1", keyframes: [], regions: [] };
    vi.spyOn(viewportApi, "saveViewport").mockResolvedValue({
      id: "vp-1",
      projectId,
      imageAssetId: data.imageAssetId,
      keyframes: data.keyframes,
      regions: data.regions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    const { result } = renderHook(() => useSaveViewport(projectId), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });

    await result.current.mutateAsync(data);
    expect(viewportApi.saveViewport).toHaveBeenCalledWith(projectId, data);
  });
});
