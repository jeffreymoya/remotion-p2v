import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@/src/test/utils";
import { createQueryWrapper, createTestQueryClient } from "@/src/test/utils";
import { useAssetSearch } from "../use-asset-search";
import * as api from "@/src/lib/api/assets";

describe("useAssetSearch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("searches when query provided", async () => {
    const results = [
      { id: "1", previewUrl: "p", downloadUrl: "d", type: "IMAGE", source: "pixabay" },
    ];
    vi.spyOn(api, "searchAssets").mockResolvedValue(results as any);

    const { result } = renderHook(() => useAssetSearch("cat"), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.data).toEqual(results));
    expect(api.searchAssets).toHaveBeenCalledWith("cat");
  });

  it("skips when query empty", () => {
    const spy = vi.spyOn(api, "searchAssets");
    const { result } = renderHook(() => useAssetSearch(""), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });

    expect(result.current.isLoading).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
});
