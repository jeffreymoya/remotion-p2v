import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH, DELETE } from "../[id]/route";
import { NextRequest } from "next/server";

// Mock Prisma
vi.mock("@/src/lib/storyflow/prisma", () => ({
  storyflowPrisma: {
    project: {
      findUnique: vi.fn(),
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
  status: string;
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
        status: "DRAFT",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(storyflowPrisma.project.findUnique).mockResolvedValue(mockProject as MockProject);

      const request = new NextRequest("http://localhost:3000/api/projects/123");
      const response = await GET(request, { params: Promise.resolve({ id: "123" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.project.id).toBe("123");
      expect(data.project.name).toBe("Test Project");
      expect(data.project.status).toBe("DRAFT");
      expect(storyflowPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: "123" },
      });
    });

    it("returns 404 when project not found", async () => {
      vi.mocked(storyflowPrisma.project.findUnique).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/projects/999");
      const response = await GET(request, { params: Promise.resolve({ id: "999" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Not found");
    });
  });

  describe("PATCH /api/projects/[id]", () => {
    it("updates project successfully", async () => {
      const mockProject = {
        id: "123",
        name: "Old Name",
        status: "DRAFT",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updatedProject = { ...mockProject, name: "New Name" };

      vi.mocked(storyflowPrisma.project.findUnique).mockResolvedValue(mockProject as MockProject);
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
      vi.mocked(storyflowPrisma.project.findUnique).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/projects/999", {
        method: "PATCH",
        body: JSON.stringify({ name: "New Name" }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "999" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Not found");
    });

    it("validates input and returns 400 on invalid data", async () => {
      const request = new NextRequest("http://localhost:3000/api/projects/123", {
        method: "PATCH",
        body: JSON.stringify({ name: "" }), // Empty name is invalid
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.name).toContain("Name is required");
    });

    it("rejects invalid characters in name", async () => {
      const request = new NextRequest("http://localhost:3000/api/projects/123", {
        method: "PATCH",
        body: JSON.stringify({ name: "Project<script>alert('xss')</script>" }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe("DELETE /api/projects/[id]", () => {
    it("deletes project successfully", async () => {
      const mockProject = {
        id: "123",
        name: "Test Project",
        status: "DRAFT",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(storyflowPrisma.project.findUnique).mockResolvedValue(mockProject as MockProject);
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
      vi.mocked(storyflowPrisma.project.findUnique).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/projects/999", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: "999" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Not found");
    });
  });
});
