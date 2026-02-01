import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { POST as uploadPost } from "../upload/route";
import { POST as importPost } from "../import/route";
import { GET as searchGet } from "../search/route";
import { POST as upscalePost } from "../upscale/route";
import { DELETE as deleteAssetRoute } from "../[id]/route";
const prismaMocks = vi.hoisted(() => ({
  findProject: vi.fn(),
  createAsset: vi.fn(),
  updateProject: vi.fn(),
}));

const assetMocks = vi.hoisted(() => ({
  validateUpload: vi.fn(),
  saveAssetFile: vi.fn(),
  extractMetadata: vi.fn(),
  deleteAsset: vi.fn(),
  saveAssetBuffer: vi.fn(),
}));

const pathMocks = vi.hoisted(() => ({ ensureProjectDirs: vi.fn() }));
const upscaleMocks = vi.hoisted(() => ({ processUpscaleJob: vi.fn() }));

vi.mock("@/src/lib/storyflow/prisma", () => ({
  storyflowPrisma: {
    project: {
      findByIdOrThrow: prismaMocks.findProject,
      update: prismaMocks.updateProject,
    },
    asset: {
      create: prismaMocks.createAsset,
    },
  },
}));

vi.mock("@/src/lib/storyflow/file-validation", () => ({
  validateUpload: assetMocks.validateUpload,
}));

vi.mock("@/src/lib/storyflow/assets", () => ({
  saveAssetFile: assetMocks.saveAssetFile,
  extractMetadata: assetMocks.extractMetadata,
  deleteAsset: assetMocks.deleteAsset,
  saveAssetBuffer: assetMocks.saveAssetBuffer,
}));

vi.mock("@/src/lib/paths", () => ({
  ensureProjectDirs: pathMocks.ensureProjectDirs,
}));

vi.mock("@/src/lib/storyflow/upscale/job", () => ({
  processUpscaleJob: upscaleMocks.processUpscaleJob,
}));

describe("Assets API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("POST /api/assets/upload", () => {
    it("uploads file, saves asset, and bumps status", async () => {
      prismaMocks.findProject.mockResolvedValue({ id: "proj-1", status: "DRAFT" });
      assetMocks.validateUpload.mockResolvedValue({ valid: true, ext: "jpg" });
      assetMocks.saveAssetFile.mockResolvedValue({
        absolutePath: "/tmp/abs.jpg",
        relativePath: "projects/proj-1/assets/images/img.jpg",
        filename: "img.jpg",
      });
      assetMocks.extractMetadata.mockResolvedValue({ width: 100 });
      prismaMocks.createAsset.mockResolvedValue({ id: "asset-1" });
      prismaMocks.updateProject.mockResolvedValue({});

      class FakeFile extends Blob {
        name: string;
        lastModified: number;
        constructor(parts: BlobPart[], name: string, options?: BlobPropertyBag) {
          super(parts, options);
          this.name = name;
          this.lastModified = 0;
        }
      }
      vi.stubGlobal("File", FakeFile as unknown as typeof File);

      const file = new File([new Uint8Array([1, 2, 3])], "img.jpg", { type: "image/jpeg" });
      (file as any).arrayBuffer = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
      const req = {
        url: "http://localhost:3000/api/assets/upload",
        method: "POST",
        formData: () =>
          Promise.resolve({
            get: (key: string) => {
              if (key === "file") return file;
              if (key === "projectId") return "proj-1";
              if (key === "type") return "IMAGE";
              return null;
            },
          } as unknown as FormData),
      } as unknown as Request;

      const res = await uploadPost(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.asset.id).toBe("asset-1");
      expect(assetMocks.validateUpload).toHaveBeenCalled();
      expect(assetMocks.saveAssetFile).toHaveBeenCalled();
      expect(prismaMocks.updateProject).toHaveBeenCalledWith({ where: { id: "proj-1" }, data: { status: "ASSETS_READY" } });
    });

    it("rejects invalid asset type", async () => {
      const form = new FormData();
      form.append("file", new File([new Uint8Array([1])], "img.jpg", { type: "image/jpeg" }));
      form.append("projectId", "proj-1");
      form.append("type", "WRONG");

      const res = await uploadPost(new NextRequest("http://localhost:3000/api/assets/upload", { method: "POST", body: form }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when file missing", async () => {
      const form = new FormData();
      form.append("projectId", "proj-1");
      form.append("type", "IMAGE");

      const res = await uploadPost(new NextRequest("http://localhost:3000/api/assets/upload", { method: "POST", body: form }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/assets/import", () => {
    it("imports remote asset and stores metadata", async () => {
      prismaMocks.findProject.mockResolvedValue({ id: "proj-1", status: "SCRIPT_READY" });
      pathMocks.ensureProjectDirs.mockResolvedValue(undefined);
      assetMocks.saveAssetBuffer.mockResolvedValue({
        absolutePath: "/tmp/abs.png",
        relativePath: "projects/proj-1/assets/images/img.png",
        filename: "img.png",
      });
      assetMocks.extractMetadata.mockResolvedValue({ width: 100 });
      prismaMocks.createAsset.mockResolvedValue({ id: "asset-import" });
      prismaMocks.updateProject.mockResolvedValue({});

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          arrayBuffer: () => Promise.resolve(new Uint8Array([9]).buffer),
          headers: new Headers({ "content-type": "image/png" }),
        }) as never
      );

      const req = new NextRequest("http://localhost:3000/api/assets/import", {
        method: "POST",
        body: JSON.stringify({
          projectId: "proj-1",
          url: "https://example.com/image.png",
          filename: "image",
          type: "IMAGE",
          source: "stock",
        }),
      });

      const res = await importPost(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.asset.id).toBe("asset-import");
      expect(pathMocks.ensureProjectDirs).toHaveBeenCalledWith("proj-1");
      expect(assetMocks.saveAssetBuffer).toHaveBeenCalled();
      expect(prismaMocks.updateProject).toHaveBeenCalledWith({ where: { id: "proj-1" }, data: { status: "ASSETS_READY" } });
    });

    it("returns 400 when download fails", async () => {
      prismaMocks.findProject.mockResolvedValue({ id: "proj-1", status: "DRAFT" });
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 404 }) as never
      );

      const req = new NextRequest("http://localhost:3000/api/assets/import", {
        method: "POST",
        body: JSON.stringify({ projectId: "proj-1", url: "https://bad", filename: "bad", type: "IMAGE" }),
      });

      const res = await importPost(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/assets/upscale", () => {
    it("validates request body", async () => {
      const req = new NextRequest("http://localhost:3000/api/assets/upscale", { method: "POST", body: JSON.stringify({}) });
      const res = await upscalePost(req);
      expect(res.status).toBe(400);
    });

    it("processes upscale job", async () => {
      upscaleMocks.processUpscaleJob.mockResolvedValue({ id: "asset-123", path: "/path" });
      const req = new NextRequest("http://localhost:3000/api/assets/upscale", {
        method: "POST",
        body: JSON.stringify({ assetId: "asset-123" }),
      });

      const res = await upscalePost(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.asset.id).toBe("asset-123");
      expect(upscaleMocks.processUpscaleJob).toHaveBeenCalledWith("asset-123");
    });
  });

  describe("DELETE /api/assets/[id]", () => {
    it("returns 404 when asset missing", async () => {
      assetMocks.deleteAsset.mockResolvedValue(false);
      const req = new NextRequest("http://localhost:3000/api/assets/missing", { method: "DELETE" });
      const res = await deleteAssetRoute(req, { params: Promise.resolve({ id: "missing" }) });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.code).toBe("NOT_FOUND");
    });

    it("deletes asset successfully", async () => {
      assetMocks.deleteAsset.mockResolvedValue(true);
      const req = new NextRequest("http://localhost:3000/api/assets/ok", { method: "DELETE" });
      const res = await deleteAssetRoute(req, { params: Promise.resolve({ id: "ok" }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe("GET /api/assets/search", () => {
    it("returns 410 gone", async () => {
      const res = await searchGet(new NextRequest("http://localhost:3000/api/assets/search"));
      const json = await res.json();

      expect(res.status).toBe(410);
      expect(json.error).toContain("deprecated");
    });
  });
});
