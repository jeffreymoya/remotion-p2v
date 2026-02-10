import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  findByIdOrThrow: vi.fn(),
  update: vi.fn(),
  countAssets: vi.fn(),
}));

const fsMocks = vi.hoisted(() => ({
  readFile: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  default: { readFile: fsMocks.readFile },
  readFile: fsMocks.readFile,
}));

vi.mock("@/src/lib/paths", () => ({
  getProjectPaths: vi.fn(() => ({ boards: "/tmp/projects/p1/boards" })),
}));

vi.mock("@/src/lib/storyflow/prisma", () => ({
  storyflowPrisma: {
    project: {
      findByIdOrThrow: prismaMocks.findByIdOrThrow,
      update: prismaMocks.update,
    },
    asset: {
      count: prismaMocks.countAssets,
    },
  },
}));

import { registerGuard, transitionProjectStatus } from "../status-machine";

describe("status-machine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies valid transitions", async () => {
    prismaMocks.findByIdOrThrow.mockResolvedValue({ status: "DRAFT" });
    prismaMocks.update.mockResolvedValue({});

    await transitionProjectStatus("p1", "SCRIPT_READY");

    expect(prismaMocks.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { status: "SCRIPT_READY" },
    });
  });

  it("rejects invalid transitions", async () => {
    prismaMocks.findByIdOrThrow.mockResolvedValue({ status: "SCRIPT_READY" });

    await expect(transitionProjectStatus("p1", "RENDER_READY")).rejects.toThrow(
      "Cannot transition from SCRIPT_READY to RENDER_READY"
    );
    expect(prismaMocks.update).not.toHaveBeenCalled();
  });

  it("is a no-op when target status equals current status", async () => {
    prismaMocks.findByIdOrThrow.mockResolvedValue({ status: "ASSETS_READY" });

    await transitionProjectStatus("p1", "ASSETS_READY");

    expect(prismaMocks.update).not.toHaveBeenCalled();
  });

  it("enforces media guard when prompts are missing", async () => {
    prismaMocks.findByIdOrThrow.mockResolvedValue({ status: "SCRIPT_READY" });
    prismaMocks.countAssets.mockResolvedValue(1);
    fsMocks.readFile.mockRejectedValue(new Error("ENOENT"));

    await expect(transitionProjectStatus("p1", "ASSETS_READY")).rejects.toThrow(
      "Generate image prompts before marking Media complete."
    );
  });

  it("enforces media guard when assets are missing", async () => {
    prismaMocks.findByIdOrThrow.mockResolvedValue({ status: "SCRIPT_READY" });
    prismaMocks.countAssets.mockResolvedValue(0);
    fsMocks.readFile.mockResolvedValue(JSON.stringify({ prompts: [{ boardId: "b1" }] }));

    await expect(transitionProjectStatus("p1", "ASSETS_READY")).rejects.toThrow(
      "Upload at least one asset before marking Media complete."
    );
  });

  it("enforces media guard when prompts and assets are both missing", async () => {
    prismaMocks.findByIdOrThrow.mockResolvedValue({ status: "SCRIPT_READY" });
    prismaMocks.countAssets.mockResolvedValue(0);
    fsMocks.readFile.mockRejectedValue(new Error("ENOENT"));

    await expect(transitionProjectStatus("p1", "ASSETS_READY")).rejects.toThrow(
      "Generate image prompts and upload at least one asset before marking Media complete."
    );
  });

  it("runs custom guards for transitions", async () => {
    const customGuard = vi.fn(async () => undefined);
    registerGuard("DRAFT", "SCRIPT_READY", customGuard);

    prismaMocks.findByIdOrThrow.mockResolvedValue({ status: "DRAFT" });
    prismaMocks.update.mockResolvedValue({});

    await transitionProjectStatus("p1", "SCRIPT_READY");

    expect(customGuard).toHaveBeenCalledWith({ projectId: "p1" });
    expect(prismaMocks.update).toHaveBeenCalled();
  });
});
