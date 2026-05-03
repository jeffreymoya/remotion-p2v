import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  findAsset: vi.fn(),
  updateAsset: vi.fn(),
}));

const settingsMocks = vi.hoisted(() => ({
  getSettings: vi.fn(),
}));

const assetMocks = vi.hoisted(() => ({
  extractMetadata: vi.fn(),
}));

const realesrganMocks = vi.hoisted(() => ({
  isAvailable: vi.fn(),
  upscale: vi.fn(),
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

vi.mock("@/src/lib/storyflow/assets", () => ({
  extractMetadata: assetMocks.extractMetadata,
}));

vi.mock("@/src/lib/storyflow/upscale/realesrgan", () => ({
  RealESRGANService: vi.fn().mockImplementation(function RealESRGANService() {
    return {
      isAvailable: realesrganMocks.isAvailable,
      upscale: realesrganMocks.upscale,
    };
  }),
}));

const { processUpscaleJob } = await import("@/src/lib/storyflow/upscale/job");

const baseAsset = {
  id: "asset-1",
  projectId: "proj-1",
  type: "IMAGE",
  filename: "image.jpg",
  path: "/projects/proj-1/assets/images/image.jpg",
  metadata: { width: 1920, height: 1080 },
  upscaled: false,
  upscaledPath: null,
  upscaleStatus: "queued",
  createdAt: new Date(),
};

describe("processUpscaleJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsMocks.getSettings.mockResolvedValue({
      upscale: { autoEnabled: true, skipIfWidthPx: 3840 },
    });
    realesrganMocks.isAvailable.mockReturnValue(true);
    realesrganMocks.upscale.mockResolvedValue(undefined);
    assetMocks.extractMetadata.mockResolvedValue({ width: 7680, height: 4320 });
    prismaMocks.updateAsset.mockImplementation(({ data }) =>
      Promise.resolve({ ...baseAsset, ...data }),
    );
  });

  it("upscales images below the skip threshold and marks them done", async () => {
    prismaMocks.findAsset.mockResolvedValue(baseAsset);

    const result = await processUpscaleJob("asset-1");

    expect(realesrganMocks.upscale).toHaveBeenCalledWith(
      expect.stringContaining("assets/images/image.jpg"),
      expect.stringContaining("assets/images/image_8k.jpg"),
    );
    expect(prismaMocks.updateAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "asset-1" },
        data: expect.objectContaining({
          upscaled: true,
          upscaledPath: "/projects/proj-1/assets/images/image_8k.jpg",
          upscaleStatus: "done",
        }),
      }),
    );
    expect(result.upscaleStatus).toBe("done");
  });

  it("skips images at or above the configured width threshold", async () => {
    prismaMocks.findAsset.mockResolvedValue({
      ...baseAsset,
      metadata: { width: 4096, height: 2160 },
    });

    const result = await processUpscaleJob("asset-1");

    expect(realesrganMocks.upscale).not.toHaveBeenCalled();
    expect(prismaMocks.updateAsset).toHaveBeenCalledWith({
      where: { id: "asset-1" },
      data: { upscaleStatus: "skipped" },
    });
    expect(result.upscaleStatus).toBe("skipped");
  });

  it("throws when Real-ESRGAN is unavailable", async () => {
    prismaMocks.findAsset.mockResolvedValue(baseAsset);
    realesrganMocks.isAvailable.mockReturnValue(false);

    await expect(processUpscaleJob("asset-1")).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
    expect(prismaMocks.updateAsset).not.toHaveBeenCalled();
  });

  it("forces upscale even when the image meets the skip threshold", async () => {
    prismaMocks.findAsset.mockResolvedValue({
      ...baseAsset,
      metadata: { width: 4096, height: 2160 },
    });

    await processUpscaleJob("asset-1", { force: true });

    expect(realesrganMocks.upscale).toHaveBeenCalled();
    expect(prismaMocks.updateAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ upscaleStatus: "done" }),
      }),
    );
  });

  it("normalizes legacy upscaled assets to done", async () => {
    prismaMocks.findAsset.mockResolvedValue({
      ...baseAsset,
      upscaled: true,
      upscaleStatus: "none",
    });

    const result = await processUpscaleJob("asset-1");

    expect(realesrganMocks.upscale).not.toHaveBeenCalled();
    expect(prismaMocks.updateAsset).toHaveBeenCalledWith({
      where: { id: "asset-1" },
      data: { upscaleStatus: "done" },
    });
    expect(result.upscaleStatus).toBe("done");
  });
});
