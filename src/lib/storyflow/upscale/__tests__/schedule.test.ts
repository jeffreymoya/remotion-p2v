import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  findAsset: vi.fn(),
  updateAsset: vi.fn(),
}));

const settingsMocks = vi.hoisted(() => ({
  getSettings: vi.fn(),
}));

const jobMocks = vi.hoisted(() => ({
  processUpscaleJob: vi.fn(),
}));

vi.mock("@/src/lib/storyflow/prisma", () => ({
  storyflowPrisma: {
    asset: {
      findByIdOrThrow: prismaMocks.findAsset,
      update: prismaMocks.updateAsset,
    },
  },
}));

vi.mock("@/src/lib/storyflow/settings", () => ({
  getSettings: settingsMocks.getSettings,
}));

vi.mock("@/src/lib/storyflow/upscale/job", () => ({
  processUpscaleJob: jobMocks.processUpscaleJob,
}));

const { processManualUpscale, scheduleAutoUpscale } = await import(
  "@/src/lib/storyflow/upscale/schedule"
);

describe("upscale scheduling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    settingsMocks.getSettings.mockResolvedValue({
      upscale: { autoEnabled: true, skipIfWidthPx: 3840 },
    });
    prismaMocks.updateAsset.mockResolvedValue({ id: "asset-1" });
    prismaMocks.findAsset.mockResolvedValue({
      id: "asset-1",
      type: "IMAGE",
      upscaleStatus: "none",
    });
    jobMocks.processUpscaleJob.mockResolvedValue({
      id: "asset-1",
      upscaleStatus: "done",
    });
  });

  it("does nothing when automatic upscaling is disabled", async () => {
    settingsMocks.getSettings.mockResolvedValue({
      upscale: { autoEnabled: false, skipIfWidthPx: 3840 },
    });

    await scheduleAutoUpscale("asset-1");

    expect(prismaMocks.updateAsset).not.toHaveBeenCalled();
    expect(jobMocks.processUpscaleJob).not.toHaveBeenCalled();
  });

  it("queues and starts an automatic upscale job", async () => {
    await scheduleAutoUpscale("asset-1");

    expect(prismaMocks.updateAsset).toHaveBeenCalledWith({
      where: { id: "asset-1" },
      data: { upscaleStatus: "queued" },
    });
    expect(jobMocks.processUpscaleJob).toHaveBeenCalledWith("asset-1");
  });

  it("marks automatic jobs failed without rethrowing", async () => {
    jobMocks.processUpscaleJob.mockRejectedValue(new Error("binary failed"));

    await expect(scheduleAutoUpscale("asset-1")).resolves.toBeUndefined();

    expect(prismaMocks.updateAsset).toHaveBeenLastCalledWith({
      where: { id: "asset-1" },
      data: { upscaleStatus: "failed" },
    });
  });

  it("rejects manual upscale while an asset is already queued", async () => {
    prismaMocks.findAsset.mockResolvedValue({
      id: "asset-1",
      type: "IMAGE",
      upscaleStatus: "queued",
    });

    await expect(processManualUpscale("asset-1")).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(jobMocks.processUpscaleJob).not.toHaveBeenCalled();
  });

  it("forces manual upscale and marks failures", async () => {
    jobMocks.processUpscaleJob.mockRejectedValue(new Error("upscale failed"));

    await expect(processManualUpscale("asset-1")).rejects.toThrow(
      "upscale failed",
    );

    expect(jobMocks.processUpscaleJob).toHaveBeenCalledWith("asset-1", {
      force: true,
    });
    expect(prismaMocks.updateAsset).toHaveBeenLastCalledWith({
      where: { id: "asset-1" },
      data: { upscaleStatus: "failed" },
    });
  });
});
