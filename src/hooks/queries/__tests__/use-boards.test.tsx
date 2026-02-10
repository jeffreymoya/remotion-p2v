import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@/src/test/utils";
import { createQueryWrapper, createTestQueryClient } from "@/src/test/utils";
import {
  useBoards,
  usePlanBoards,
  useGenerateBoardPrompts,
  useDetectBoardRegions,
  useGenerateBoardTriggers,
  useBuildViewport,
} from "../use-boards";
import * as boardsApi from "@/src/lib/api/boards";
import { buildBoard } from "@/src/test/factories";

describe("useBoards", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("fetches boards for project", async () => {
    const boards = [buildBoard({ id: "b1", projectId: "p1" })];
    vi.spyOn(boardsApi, "fetchBoards").mockResolvedValue(boards as any);

    const { result } = renderHook(() => useBoards("p1"), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.data).toEqual(boards));
    expect(boardsApi.fetchBoards).toHaveBeenCalledWith("p1");
  });
});

describe("board mutations", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("plan mutation calls API", async () => {
    vi.spyOn(boardsApi, "planBoards").mockResolvedValue({ ok: true } as any);
    const { result } = renderHook(() => usePlanBoards("p1"), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });
    await result.current.mutateAsync({ payload: { scriptSegments: [] } });
    expect(boardsApi.planBoards).toHaveBeenCalledWith("p1", { scriptSegments: [] }, undefined);
  });

  it("prompts mutation calls API", async () => {
    vi.spyOn(boardsApi, "generateBoardPrompts").mockResolvedValue({ ok: true } as any);
    const { result } = renderHook(() => useGenerateBoardPrompts("p1"), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });
    await result.current.mutateAsync({
      payload: {
        boards: [],
        segments: [],
        gridLayout: { rows: 2, cols: 3 },
        styleGuide: "Noir collage wall",
      },
    });
    expect(boardsApi.generateBoardPrompts).toHaveBeenCalledWith(
      "p1",
      { boards: [], segments: [], gridLayout: { rows: 2, cols: 3 }, styleGuide: "Noir collage wall" },
      undefined
    );
  });

  it("regions mutation calls API", async () => {
    vi.spyOn(boardsApi, "detectBoardRegions").mockResolvedValue({ ok: true } as any);
    const { result } = renderHook(() => useDetectBoardRegions("p1"), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });
    await result.current.mutateAsync({
      payload: { boardId: "b1", assetId: "asset-1", elements: [], gridLayout: { rows: 1, cols: 1 } },
    });
    expect(boardsApi.detectBoardRegions).toHaveBeenCalledWith(
      "p1",
      { boardId: "b1", assetId: "asset-1", elements: [], gridLayout: { rows: 1, cols: 1 } },
      undefined
    );
  });

  it("triggers mutation calls API", async () => {
    vi.spyOn(boardsApi, "generateBoardTriggers").mockResolvedValue({ ok: true } as any);
    const { result } = renderHook(() => useGenerateBoardTriggers("p1"), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });
    await result.current.mutateAsync({});
    expect(boardsApi.generateBoardTriggers).toHaveBeenCalledWith("p1", undefined, undefined);
  });

  it("viewport mutation calls API", async () => {
    vi.spyOn(boardsApi, "buildViewport").mockResolvedValue({ viewportJson: { fps: 30 } } as any);
    const { result } = renderHook(() => useBuildViewport("p1"), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });
    await result.current.mutateAsync({ payload: { fps: 30 } });
    expect(boardsApi.buildViewport).toHaveBeenCalledWith("p1", { fps: 30 }, undefined);
  });
});
