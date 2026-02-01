import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@/src/test/utils";
import { createQueryWrapper, createTestQueryClient } from "@/src/test/utils";
import { useRenderStatus, useStartRender } from "../use-render";
import * as renderApi from "@/src/lib/api/render";
import { buildRender } from "@/src/test/factories";

describe("useRenderStatus", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches render status when id provided", async () => {
    const render = buildRender({ id: "render-1", status: "PROCESSING", progress: 50 });
    vi.spyOn(renderApi, "fetchRenderStatus").mockResolvedValue(render as any);

    const { result } = renderHook(() => useRenderStatus(render.id), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.data).toEqual(render));
    expect(renderApi.fetchRenderStatus).toHaveBeenCalledWith(render.id);
  });

  it("does not fetch when id is null", () => {
    const spy = vi.spyOn(renderApi, "fetchRenderStatus");
    renderHook(() => useRenderStatus(null), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("useStartRender", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("starts render and seeds cache", async () => {
    const client = createTestQueryClient();
    const wrapper = createQueryWrapper(client);
    const render = buildRender({ id: "render-start" });
    vi.spyOn(renderApi, "startRender").mockResolvedValue(render as any);

    const { result } = renderHook(() => useStartRender("project-1"), { wrapper });
    await result.current.mutateAsync("HIGH");

    expect(client.getQueryData(["render-status", render.id])).toEqual(render);
  });
});
