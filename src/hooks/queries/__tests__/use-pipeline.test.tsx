import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@/src/test/utils";
import { createQueryWrapper, createTestQueryClient } from "@/src/test/utils";
import {
  useBuildProject,
  useRunMediaStage,
  useRunScriptStage,
  useRunStoryboard,
} from "../use-pipeline";
import * as pipelineApi from "@/src/lib/api/pipeline";
import { buildTimeline } from "@/src/test/factories";

describe("useBuildProject", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("stores timeline in cache on success", async () => {
    const timeline = buildTimeline({ id: "tl-1" });
    vi.spyOn(pipelineApi, "buildProject").mockResolvedValue(timeline as any);
    const client = createTestQueryClient();
    const { result } = renderHook(() => useBuildProject("proj-1"), {
      wrapper: createQueryWrapper(client),
    });

    await result.current.mutateAsync();
    expect(client.getQueryData(["timeline", "proj-1"])).toEqual(timeline);
  });
});

describe("stage mutations", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("run storyboard invalidates boards and project caches", async () => {
    vi.spyOn(pipelineApi, "runStoryboard").mockResolvedValue({ status: "ok", boardCount: 3 } as any);
    const client = createTestQueryClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useRunStoryboard("proj-2"), {
      wrapper: createQueryWrapper(client),
    });

    await result.current.mutateAsync();
    expect(pipelineApi.runStoryboard).toHaveBeenCalledWith("proj-2", undefined);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["boards", "proj-2"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["projects", "proj-2"] });
  });

  it("run media invalidates projects and assets", async () => {
    vi.spyOn(pipelineApi, "runMedia").mockResolvedValue({ status: "ok", assets: 2 } as any);
    const client = createTestQueryClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useRunMediaStage("proj-3"), {
      wrapper: createQueryWrapper(client),
    });

    await result.current.mutateAsync();
    expect(pipelineApi.runMedia).toHaveBeenCalledWith("proj-3", undefined);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["projects", "proj-3"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["assets", "proj-3"] });
  });

  it("run script stage invalidates projects and script caches", async () => {
    vi.spyOn(pipelineApi, "runScriptStageApi").mockResolvedValue({ status: "ok", segments: 5 } as any);
    const client = createTestQueryClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(() => useRunScriptStage("proj-4"), {
      wrapper: createQueryWrapper(client),
    });

    await result.current.mutateAsync();
    expect(pipelineApi.runScriptStageApi).toHaveBeenCalledWith("proj-4", undefined);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["projects", "proj-4"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["script", "proj-4"] });
  });
});
