import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH, DELETE } from "../[id]/route";
import { NextRequest } from "next/server";
import { Prisma, ProjectStatus } from "@/src/generated/storyflow";
import { NotFoundError } from "@/app/api/lib";

// Mock Prisma
vi.mock("@/src/lib/storyflow/prisma", () => ({
  storyflowPrisma: {
    project: {
      findByIdOrThrow: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock project directory deletion
vi.mock("@/src/lib/storyflow/projects", () => ({
  deleteProjectDirectory: vi.fn(),
}));

import { storyflowPrisma } from "@/src/lib/storyflow/prisma";
import { deleteProjectDirectory } from "@/src/lib/storyflow/projects";

type MockProject = {
  id: string;
  name: string;
  topic: string | null;
  status: ProjectStatus;
  aspectRatio: string;
  assetMappings: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

describe("Projects API - /api/projects/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/projects/[id]", () => {
    it("returns project when found", async () => {
      const mockProject = {
        id: "123",
        name: "Test Project",
        topic: null,
        status: "DRAFT",
        aspectRatio: "16:9",
        assetMappings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue(mockProject as MockProject);

      const request = new NextRequest("http://localhost:3000/api/projects/123");
      const response = await GET(request, { params: Promise.resolve({ id: "123" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.project.id).toBe("123");
      expect(data.project.name).toBe("Test Project");
      expect(data.project.status).toBe("DRAFT");
      expect(storyflowPrisma.project.findByIdOrThrow).toHaveBeenCalledWith("123");
    });

    it("returns 404 when project not found", async () => {
      vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockRejectedValue(new NotFoundError("Project", "999"));

      const request = new NextRequest("http://localhost:3000/api/projects/999");
      const response = await GET(request, { params: Promise.resolve({ id: "999" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Project not found: 999");
      expect(data.code).toBe("NOT_FOUND");
      expect(data.requestId).toBeDefined();
    });
  });

  describe("PATCH /api/projects/[id]", () => {
    it("updates project successfully", async () => {
      const mockProject = {
        id: "123",
        name: "Old Name",
        topic: null,
        status: "DRAFT",
        aspectRatio: "16:9",
        assetMappings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updatedProject = { ...mockProject, name: "New Name" };

      vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue(mockProject as MockProject);
      vi.mocked(storyflowPrisma.project.update).mockResolvedValue(updatedProject as MockProject);

      const request = new NextRequest("http://localhost:3000/api/projects/123", {
        method: "PATCH",
        body: JSON.stringify({ name: "New Name" }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.project.name).toBe("New Name");
      expect(storyflowPrisma.project.update).toHaveBeenCalledWith({
        where: { id: "123" },
        data: { name: "New Name" },
      });
    });

    it("returns 404 when project not found", async () => {
      vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockRejectedValue(new NotFoundError("Project", "999"));

      const request = new NextRequest("http://localhost:3000/api/projects/999", {
        method: "PATCH",
        body: JSON.stringify({ name: "New Name" }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "999" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Project not found: 999");
      expect(data.code).toBe("NOT_FOUND");
    });

    it("validates input and returns 400 on invalid data", async () => {
      const request = new NextRequest("http://localhost:3000/api/projects/123", {
        method: "PATCH",
        body: JSON.stringify({ name: "" }), // Empty name is invalid
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe("VALIDATION_ERROR");
      expect(data.details?.name?._errors?.[0]).toBe("Name is required");
    });

    it("rejects invalid characters in name", async () => {
      const request = new NextRequest("http://localhost:3000/api/projects/123", {
        method: "PATCH",
        body: JSON.stringify({ name: "Project<script>alert('xss')</script>" }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe("VALIDATION_ERROR");
      expect(data.details?.name?._errors?.length).toBeGreaterThan(0);
    });
  });

  describe("DELETE /api/projects/[id]", () => {
    it("deletes project successfully", async () => {
      const mockProject = {
        id: "123",
        name: "Test Project",
        topic: null,
        status: "DRAFT",
        aspectRatio: "16:9",
        assetMappings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockResolvedValue(mockProject as MockProject);
      vi.mocked(storyflowPrisma.project.delete).mockResolvedValue(mockProject as MockProject);
      vi.mocked(deleteProjectDirectory).mockResolvedValue(undefined);

      const request = new NextRequest("http://localhost:3000/api/projects/123", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: "123" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(storyflowPrisma.project.delete).toHaveBeenCalledWith({ where: { id: "123" } });
      expect(deleteProjectDirectory).toHaveBeenCalledWith("123");
    });

    it("returns 404 when project not found", async () => {
      vi.mocked(storyflowPrisma.project.findByIdOrThrow).mockRejectedValue(new NotFoundError("Project", "999"));

      const request = new NextRequest("http://localhost:3000/api/projects/999", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: "999" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Project not found: 999");
      expect(data.code).toBe("NOT_FOUND");
    });
  });
});
