import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@/src/test/utils";
import { createQueryWrapper, createTestQueryClient } from "@/src/test/utils";
import { useSaveAssetMappings } from "../use-mappings";
import * as api from "@/src/lib/api/mappings";

describe("useSaveAssetMappings", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("calls saveAssetMappings with project id", async () => {
    const projectId = "proj-map";
    const mappings = { 0: { assetId: "asset-1" } };
    vi.spyOn(api, "saveAssetMappings").mockResolvedValue();

    const { result } = renderHook(() => useSaveAssetMappings(projectId), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });

    await result.current.mutateAsync(mappings);
    expect(api.saveAssetMappings).toHaveBeenCalledWith(projectId, mappings);
  });
});
