import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@/src/test/utils";
import {
  createQueryWrapper,
  createTestQueryClient,
} from "@/src/test/utils";
import {
  useAssets,
  useDeleteAsset,
  useImportAsset,
  useSelectMusicAsset,
  useUpscaleAsset,
  useUploadAsset,
  assetKeys,
} from "../use-assets";
import * as assetsApi from "@/src/lib/api/assets";
import { buildAsset, buildAudioAsset, buildImageAsset } from "@/src/test/factories";

describe("useAssets", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches assets for a project", async () => {
    const projectId = "proj-123";
    const mockAssets = [buildImageAsset({ projectId }), buildAudioAsset({ projectId })];
    vi.spyOn(assetsApi, "fetchAssets").mockResolvedValue(mockAssets);

    const { result } = renderHook(() => useAssets(projectId), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual(mockAssets));
    expect(assetsApi.fetchAssets).toHaveBeenCalledWith(projectId);
  });

  it("propagates fetch errors", async () => {
    vi.spyOn(assetsApi, "fetchAssets").mockRejectedValue(new Error("nope"));

    const { result } = renderHook(() => useAssets("proj-err"), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("nope");
  });
});

describe("asset mutations", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("upload adds asset to cache", async () => {
    const projectId = "proj-upload";
    const client = createTestQueryClient();
    const wrapper = createQueryWrapper(client);
    const existing = buildAsset({ projectId, id: "existing" });
    client.setQueryData(assetKeys.byProject(projectId), [existing]);

    const uploaded = buildAsset({ projectId, id: "new-asset" });
    vi.spyOn(assetsApi, "uploadAsset").mockResolvedValue(uploaded);

    const { result } = renderHook(() => useUploadAsset(projectId), { wrapper });
    await result.current.mutateAsync(new File(["x"], "file.png", { type: "image/png" }));

    expect(client.getQueryData(assetKeys.byProject(projectId))).toEqual([uploaded, existing]);
  });

  it("import adds asset to cache", async () => {
    const projectId = "proj-import";
    const client = createTestQueryClient();
    const wrapper = createQueryWrapper(client);
    const imported = buildAsset({ projectId, id: "imported" });
    vi.spyOn(assetsApi, "importAsset").mockResolvedValue(imported);

    const { result } = renderHook(() => useImportAsset(projectId), { wrapper });
    await result.current.mutateAsync({ projectId, url: "http://", filename: "x", type: "IMAGE" });

    expect(client.getQueryData(assetKeys.byProject(projectId))).toEqual([imported]);
  });

  it("delete removes asset from cache", async () => {
    const projectId = "proj-delete";
    const client = createTestQueryClient();
    const wrapper = createQueryWrapper(client);
    const asset = buildAsset({ projectId, id: "delete-me" });
    client.setQueryData(assetKeys.byProject(projectId), [asset]);
    vi.spyOn(assetsApi, "deleteAsset").mockResolvedValue();

    const { result } = renderHook(() => useDeleteAsset(projectId), { wrapper });
    await result.current.mutateAsync(asset.id);

    expect(client.getQueryData(assetKeys.byProject(projectId))).toEqual([]);
  });

  it("upscale updates asset in cache", async () => {
    const projectId = "proj-upscale";
    const client = createTestQueryClient();
    const wrapper = createQueryWrapper(client);
    const base = buildImageAsset({ projectId, id: "asset-1", upscaled: false });
    const updated = { ...base, upscaled: true };
    client.setQueryData(assetKeys.byProject(projectId), [base]);
    vi.spyOn(assetsApi, "upscaleAsset").mockResolvedValue(updated as any);

    const { result } = renderHook(() => useUpscaleAsset(projectId), { wrapper });
    await result.current.mutateAsync(base.id);

    expect(client.getQueryData(assetKeys.byProject(projectId))).toEqual([updated]);
  });

  it("select music asset invalidates project cache", async () => {
    const projectId = "proj-music";
    const client = createTestQueryClient();
    const wrapper = createQueryWrapper(client);
    vi.spyOn(assetsApi, "selectMusicAsset").mockResolvedValue();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useSelectMusicAsset(projectId), { wrapper });
    await result.current.mutateAsync("asset-99");

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["projects", projectId] });
  });
});
