import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "../[id]/music/route";
import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { ensureProjectDirs, getProjectPaths, getPublicDir } from "@/src/lib/paths";
import { extractMetadata } from "@/src/lib/storyflow/assets";

const fsMocks = vi.hoisted(() => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  default: { mkdir: fsMocks.mkdir, writeFile: fsMocks.writeFile },
  mkdir: fsMocks.mkdir,
  writeFile: fsMocks.writeFile,
}));

vi.mock("@/src/lib/storyflow/assets", () => ({
  extractMetadata: vi.fn(),
}));

vi.mock("@/src/lib/paths", () => ({
  ensureProjectDirs: vi.fn(),
  getProjectPaths: vi.fn(() => ({
    assetsMusic: "/tmp/public/projects/test-id/assets/music",
  })),
  getPublicDir: vi.fn(() => "/tmp/public"),
}));

vi.mock("@/src/lib/storyflow/prisma", () => ({
  storyflowPrisma: {
    project: {
      findByIdOrThrow: vi.fn(),
    },
    asset: {
      findByIdOrThrow: vi.fn(),
      create: vi.fn(),
    },
    projectSettings: {
      upsert: vi.fn(),
    },
  },
}));

describe("POST /api/projects/[id]/music", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("selects an existing music asset", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({
      id: "project-1",
      status: "DRAFT",
      settings: { musicVolume: 0.4 },
    } as never);
    vi.mocked(storyflowPrisma.asset.findByIdOrThrow).mockResolvedValue({
      id: "asset-1",
      projectId: "project-1",
      type: "MUSIC",
    } as never);
    vi.mocked(storyflowPrisma.projectSettings.upsert).mockResolvedValue({} as never);

    const req = new NextRequest("http://localhost:3000/api/projects/project-1/music", {
      method: "POST",
      body: JSON.stringify({ assetId: "asset-1", volume: 0.7 }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "project-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.selectedAssetId).toBe("asset-1");
    expect(storyflowPrisma.projectSettings.upsert).toHaveBeenCalledWith({
      where: { projectId: "project-1" },
      create: { projectId: "project-1", musicTrackId: "asset-1", musicVolume: 0.7 },
      update: { musicTrackId: "asset-1", musicVolume: 0.7 },
    });
  });

  it("returns 400 when selected asset is not music", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({
      id: "project-1",
      status: "DRAFT",
      settings: null,
    } as never);
    vi.mocked(storyflowPrisma.asset.findByIdOrThrow).mockResolvedValue({
      id: "asset-1",
      projectId: "project-1",
      type: "IMAGE",
    } as never);

    const req = new NextRequest("http://localhost:3000/api/projects/project-1/music", {
      method: "POST",
      body: JSON.stringify({ assetId: "asset-1" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "project-1" }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
    expect(json.error).toBe("Only music assets can be selected as soundtrack");
  });

  it("returns 404 when asset belongs to a different project", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({
      id: "project-1",
      status: "SCRIPT_READY",
      settings: null,
    } as never);
    vi.mocked(storyflowPrisma.asset.findByIdOrThrow).mockResolvedValue({
      id: "asset-1",
      projectId: "other-project",
      type: "MUSIC",
    } as never);

    const req = new NextRequest("http://localhost:3000/api/projects/project-1/music", {
      method: "POST",
      body: JSON.stringify({ assetId: "asset-1" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "project-1" }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.code).toBe("NOT_FOUND");
    expect(json.error).toBe("Asset not found: asset-1");
  });

  it("downloads a pixabay track, saves asset, and reuses default volume", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({
      id: "project-1",
      status: "SCRIPT_READY",
      settings: { musicVolume: 0.6 },
    } as never);
    vi.mocked(storyflowPrisma.asset.create).mockResolvedValue({ id: "created-asset" } as never);
    vi.mocked(storyflowPrisma.projectSettings.upsert).mockResolvedValue({} as never);
    vi.mocked(extractMetadata).mockResolvedValue({ duration: 120 } as never);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3]).buffer),
      }) as never
    );

    const req = new NextRequest("http://localhost:3000/api/projects/project-1/music", {
      method: "POST",
      body: JSON.stringify({
        track: {
          id: "track123",
          source: "pixabay",
          title: "Calm Beats",
          downloadUrl: "https://cdn.pixabay.com/audio/track123.mp3",
          previewUrl: "https://cdn.pixabay.com/audio/preview.mp3",
          duration: 95,
          tags: "calm",
          author: "Pixabay Artist",
        },
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "project-1" }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.selectedAssetId).toBe("created-asset");
    expect(ensureProjectDirs).toHaveBeenCalledWith("project-1");
    expect(fsMocks.mkdir).toHaveBeenCalled();
    expect(fsMocks.writeFile).toHaveBeenCalled();
    expect(getProjectPaths).toHaveBeenCalledWith("project-1");
    expect(getPublicDir).toHaveBeenCalled();
    expect(storyflowPrisma.asset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: "project-1",
          type: "MUSIC",
          filename: "calm-beats-track123.mp3",
          path: "/projects/test-id/assets/music/calm-beats-track123.mp3",
          metadata: expect.objectContaining({
            trackId: "track123",
            source: "pixabay",
            title: "Calm Beats",
            duration: 120,
          }),
        }),
      })
    );
    expect(storyflowPrisma.projectSettings.upsert).toHaveBeenCalledWith({
      where: { projectId: "project-1" },
      create: { projectId: "project-1", musicTrackId: "created-asset", musicVolume: 0.6 },
      update: { musicTrackId: "created-asset", musicVolume: 0.6 },
    });
  });

  it("returns 500 when download host is not allowed", async () => {
    vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({
      id: "project-1",
      status: "SCRIPT_READY",
      settings: null,
    } as never);

    const req = new NextRequest("http://localhost:3000/api/projects/project-1/music", {
      method: "POST",
      body: JSON.stringify({
        track: {
          id: "track123",
          source: "pixabay",
          title: "Calm Beats",
          downloadUrl: "https://example.com/audio/track123.mp3",
        },
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "project-1" }) });
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.code).toBe("INTERNAL_ERROR");
    expect(json.error).toBeDefined();
  });

  it("returns 400 when request body is invalid", async () => {
    const req = new NextRequest("http://localhost:3000/api/projects/project-1/music", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "project-1" }) });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
    expect(json.details).toBeDefined();
  });
});
