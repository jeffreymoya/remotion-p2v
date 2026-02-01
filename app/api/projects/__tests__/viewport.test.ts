import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { NotFoundError } from "@/app/api/lib";
import { GET, POST } from "../[id]/viewport/route";

vi.mock("@/src/lib/storyflow/prisma", () => ({
  storyflowPrisma: {
    viewport: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    project: {
      findByIdOrThrow: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

describe("Projects API - /api/projects/[id]/viewport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns viewport when present", async () => {
      const viewport = {
        projectId: "proj-1",
        imageAssetId: "asset-1",
        keyframes: [{ time: 0, elements: [] }],
        regions: [{ id: "r1" }],
      };
      vi.mocked(storyflowPrisma.viewport.findUnique).mockResolvedValue(viewport as never);

      const req = new NextRequest("http://localhost:3000/api/projects/proj-1/viewport");
      const res = await GET(req, { params: Promise.resolve({ id: "proj-1" }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.viewport).toEqual(viewport);
      expect(storyflowPrisma.viewport.findUnique).toHaveBeenCalledWith({
        where: { projectId: "proj-1" },
      });
    });

    it("returns null when viewport missing", async () => {
      vi.mocked(storyflowPrisma.viewport.findUnique).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/projects/proj-2/viewport");
      const res = await GET(req, { params: Promise.resolve({ id: "proj-2" }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.viewport).toBeNull();
    });
  });

  describe("POST", () => {
    const body = {
      imageAssetId: "asset-1",
      keyframes: [{ time: 0, elements: [] }],
      regions: [{ id: "r1" }],
    };

    it("creates or updates viewport and advances project status", async () => {
      vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({
        id: "proj-3",
        status: "ASSETS_READY",
      } as never);
      vi.mocked(storyflowPrisma.viewport.upsert).mockResolvedValue({
        projectId: "proj-3",
        ...body,
      } as never);
      vi.mocked(storyflowPrisma.project.update).mockResolvedValue({
        id: "proj-3",
        status: "RENDER_READY",
      } as never);

      const req = new NextRequest("http://localhost:3000/api/projects/proj-3/viewport", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const res = await POST(req, { params: Promise.resolve({ id: "proj-3" }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.viewport).toMatchObject(body);
      expect(storyflowPrisma.viewport.upsert).toHaveBeenCalledWith({
        where: { projectId: "proj-3" },
        update: body,
        create: { projectId: "proj-3", ...body },
      });
      expect(storyflowPrisma.project.update).toHaveBeenCalledWith({
        where: { id: "proj-3" },
        data: { status: "RENDER_READY" },
      });
    });

    it("does not update status when already render-ready", async () => {
      vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({
        id: "proj-5",
        status: "RENDER_READY",
      } as never);
      vi.mocked(storyflowPrisma.viewport.upsert).mockResolvedValue({
        projectId: "proj-5",
        ...body,
      } as never);

      const req = new NextRequest("http://localhost:3000/api/projects/proj-5/viewport", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const res = await POST(req, { params: Promise.resolve({ id: "proj-5" }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.viewport).toMatchObject(body);
      expect(storyflowPrisma.project.update).not.toHaveBeenCalled();
    });

    it("returns 400 on invalid body", async () => {
      const req = new NextRequest("http://localhost:3000/api/projects/proj-4/viewport", {
        method: "POST",
        body: JSON.stringify({}), // missing required keyframes array
      });

      const res = await POST(req, { params: Promise.resolve({ id: "proj-4" }) });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.code).toBe("VALIDATION_ERROR");
      expect(json.details?.keyframes?._errors?.[0]).toBeDefined();
      expect(storyflowPrisma.viewport.upsert).not.toHaveBeenCalled();
    });

    it("returns 404 when project not found", async () => {
      vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockRejectedValue(
        new NotFoundError("Project", "missing-id")
      );

      const req = new NextRequest("http://localhost:3000/api/projects/missing-id/viewport", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const res = await POST(req, { params: Promise.resolve({ id: "missing-id" }) });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.code).toBe("NOT_FOUND");
      expect(json.error).toBe("Project not found: missing-id");
    });
  });
});
