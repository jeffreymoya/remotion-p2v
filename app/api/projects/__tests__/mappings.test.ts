import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { NotFoundError } from "@/app/api/lib";
import { GET, POST } from "../[id]/mappings/route";

vi.mock("@/src/lib/storyflow/prisma", () => ({
  storyflowPrisma: {
    project: {
      findByIdOrThrow: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { storyflowPrisma } from "@/src/lib/storyflow/prisma";

describe("Projects API - /api/projects/[id]/mappings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns asset mappings when project exists", async () => {
      vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({
        id: "proj-1",
        assetMappings: { 0: "asset-a", 1: "asset-b" },
      } as never);

      const req = new NextRequest("http://localhost:3000/api/projects/proj-1/mappings");
      const res = await GET(req, { params: Promise.resolve({ id: "proj-1" }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.assetMappings).toEqual({ 0: "asset-a", 1: "asset-b" });
      expect(storyflowPrisma.project.findByIdOrThrow).toHaveBeenCalledWith("proj-1");
    });

    it("returns 404 when project not found", async () => {
      vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockRejectedValue(
        new NotFoundError("Project", "missing")
      );

      const req = new NextRequest("http://localhost:3000/api/projects/missing/mappings");
      const res = await GET(req, { params: Promise.resolve({ id: "missing" }) });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.code).toBe("NOT_FOUND");
      expect(json.error).toBe("Project not found: missing");
    });
  });

  describe("POST", () => {
    it("saves mappings with numeric keys", async () => {
      vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({
        id: "proj-2",
      } as never);
      vi.mocked(storyflowPrisma.project.update).mockResolvedValue({
        id: "proj-2",
        assetMappings: { 0: "asset-a", 2: "asset-c" },
      } as never);

      const req = new NextRequest("http://localhost:3000/api/projects/proj-2/mappings", {
        method: "POST",
        body: JSON.stringify({ mappings: { "0": "asset-a", "2": "asset-c" } }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: "proj-2" }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.assetMappings).toEqual({ 0: "asset-a", 2: "asset-c" });
      expect(storyflowPrisma.project.update).toHaveBeenCalledWith({
        where: { id: "proj-2" },
        data: { assetMappings: { 0: "asset-a", 2: "asset-c" } },
      });
    });

    it("returns 400 on invalid body", async () => {
      const req = new NextRequest("http://localhost:3000/api/projects/proj-3/mappings", {
        method: "POST",
        body: JSON.stringify({ wrong: "shape" }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: "proj-3" }) });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.code).toBe("VALIDATION_ERROR");
      expect(json.details?.mappings?._errors?.length).toBeGreaterThan(0);
      expect(storyflowPrisma.project.update).not.toHaveBeenCalled();
    });

    it("returns 404 when project not found", async () => {
      vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockRejectedValue(
        new NotFoundError("Project", "proj-4")
      );

      const req = new NextRequest("http://localhost:3000/api/projects/proj-4/mappings", {
        method: "POST",
        body: JSON.stringify({ mappings: { "0": "asset-a" } }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: "proj-4" }) });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.code).toBe("NOT_FOUND");
      expect(json.error).toBe("Project not found: proj-4");
      expect(storyflowPrisma.project.update).not.toHaveBeenCalled();
    });
  });
});
