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
    it("normalizes legacy string mappings on read", async () => {
      vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({
        id: "proj-1",
        assetMappings: { 0: "asset-a", 1: "asset-b" },
      } as never);

      const req = new NextRequest("http://localhost:3000/api/projects/proj-1/mappings");
      const res = await GET(req, { params: Promise.resolve({ id: "proj-1" }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.assetMappings).toEqual({
        0: { assetId: "asset-a" },
        1: { assetId: "asset-b" },
      });
      expect(storyflowPrisma.project.findByIdOrThrow).toHaveBeenCalledWith("proj-1");
    });

    it("returns object-shape mappings unchanged", async () => {
      vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({
        id: "proj-1",
        assetMappings: {
          0: {
            assetId: "asset-a",
            viewport: {
              start: { centerX: 0.2, centerY: 0.3, zoom: 1 },
              end: { centerX: 0.7, centerY: 0.5, zoom: 1.4 },
              easing: "easeInOut",
            },
          },
        },
      } as never);

      const req = new NextRequest("http://localhost:3000/api/projects/proj-1/mappings");
      const res = await GET(req, { params: Promise.resolve({ id: "proj-1" }) });
      const json = await res.json();

      expect(json.assetMappings[0].viewport.start).toEqual({
        centerX: 0.2,
        centerY: 0.3,
        zoom: 1,
      });
      expect(json.assetMappings[0].viewport.easing).toBe("easeInOut");
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
    it("normalizes legacy string payload to object shape", async () => {
      vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({
        id: "proj-2",
      } as never);
      vi.mocked(storyflowPrisma.project.update).mockResolvedValue({} as never);

      const req = new NextRequest("http://localhost:3000/api/projects/proj-2/mappings", {
        method: "POST",
        body: JSON.stringify({ mappings: { "0": "asset-a", "2": "asset-c" } }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: "proj-2" }) });
      const json = await res.json();

      const expected = {
        0: { assetId: "asset-a" },
        2: { assetId: "asset-c" },
      };

      expect(res.status).toBe(200);
      expect(json.assetMappings).toEqual(expected);
      expect(storyflowPrisma.project.update).toHaveBeenCalledWith({
        where: { id: "proj-2" },
        data: { assetMappings: expected },
      });
    });

    it("round-trips object payloads with viewport", async () => {
      vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue({
        id: "proj-2b",
      } as never);
      vi.mocked(storyflowPrisma.project.update).mockResolvedValue({} as never);

      const payload = {
        "0": {
          assetId: "asset-a",
          viewport: {
            start: { centerX: 0.1, centerY: 0.2, zoom: 1 },
            end: { centerX: 0.6, centerY: 0.4, zoom: 1.5 },
            easing: "easeInOut",
          },
        },
      };

      const req = new NextRequest("http://localhost:3000/api/projects/proj-2b/mappings", {
        method: "POST",
        body: JSON.stringify({ mappings: payload }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: "proj-2b" }) });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.assetMappings[0].viewport.end.zoom).toBe(1.5);
      expect(storyflowPrisma.project.update).toHaveBeenCalledWith({
        where: { id: "proj-2b" },
        data: {
          assetMappings: {
            0: {
              assetId: "asset-a",
              viewport: {
                start: { centerX: 0.1, centerY: 0.2, zoom: 1 },
                end: { centerX: 0.6, centerY: 0.4, zoom: 1.5 },
                easing: "easeInOut",
              },
            },
          },
        },
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
