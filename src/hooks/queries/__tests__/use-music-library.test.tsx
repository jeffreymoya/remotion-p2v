import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@/src/test/utils";
import { createQueryWrapper, createTestQueryClient } from "@/src/test/utils";
import {
  useMusicSearch,
  useSelectMusicTrack,
  useUpdateMusicVolume,
} from "../use-music-library";
import * as musicApi from "@/src/lib/api/music";
import { MusicTrack } from "@/src/lib/storyflow/music/types";

describe("useMusicSearch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("searches when query provided", async () => {
    const tracks: MusicTrack[] = [
      { id: "t1", title: "Calm", previewUrl: "p", downloadUrl: "d", source: "pixabay" },
    ];
    vi.spyOn(musicApi, "searchMusicTracks").mockResolvedValue(tracks);

    const { result } = renderHook(() => useMusicSearch("calm"), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.data).toEqual(tracks));
    expect(musicApi.searchMusicTracks).toHaveBeenCalledWith("calm");
  });

  it("skips fetch when query empty", () => {
    const spy = vi.spyOn(musicApi, "searchMusicTracks");
    const { result } = renderHook(() => useMusicSearch(""), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });
    expect(result.current.isLoading).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("music mutations", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("select track calls API", async () => {
    const projectId = "proj-music";
    const track: MusicTrack = {
      id: "t1",
      title: "Calm",
      previewUrl: "p",
      downloadUrl: "d",
      source: "pixabay",
    };
    vi.spyOn(musicApi, "selectMusicTrack").mockResolvedValue({ asset: {}, selectedAssetId: "asset-1" });

    const { result } = renderHook(() => useSelectMusicTrack(projectId), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });
    await result.current.mutateAsync(track);

    expect(musicApi.selectMusicTrack).toHaveBeenCalledWith(projectId, track);
  });

  it("update volume forwards payload", async () => {
    const projectId = "proj-music";
    vi.spyOn(musicApi, "updateMusicVolume").mockResolvedValue();
    const { result } = renderHook(() => useUpdateMusicVolume(projectId), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });

    await result.current.mutateAsync({ assetId: "asset-1", volume: 0.5 });
    expect(musicApi.updateMusicVolume).toHaveBeenCalledWith(projectId, "asset-1", 0.5);
  });
});
