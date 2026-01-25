/** @jsxImportSource react */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useProjects, useProject } from "../use-projects";
import * as projectsApi from "@/src/lib/api/projects";
import React from "react";

// Create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useProjects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches projects successfully", async () => {
    const mockProjects = [
      { id: "1", name: "Project 1", status: "DRAFT" },
      { id: "2", name: "Project 2", status: "COMPLETED" },
    ];

    vi.spyOn(projectsApi, "fetchProjects").mockResolvedValue(
      mockProjects as unknown as Awaited<ReturnType<typeof projectsApi.fetchProjects>>
    );

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProjects);
  });

  it("handles fetch error", async () => {
    vi.spyOn(projectsApi, "fetchProjects").mockRejectedValue(
      new Error("Failed to fetch projects")
    );

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Failed to fetch projects");
  });
});

describe("useProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches single project when id is provided", async () => {
    const mockProject = { id: "123", name: "Test Project", status: "DRAFT" };

    vi.spyOn(projectsApi, "fetchProject").mockResolvedValue(
      mockProject as unknown as Awaited<ReturnType<typeof projectsApi.fetchProject>>
    );

    const { result } = renderHook(() => useProject("123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProject);
    expect(projectsApi.fetchProject).toHaveBeenCalledWith("123");
  });

  it("does not fetch when id is empty", () => {
    vi.spyOn(projectsApi, "fetchProject");

    const { result } = renderHook(() => useProject(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(projectsApi.fetchProject).not.toHaveBeenCalled();
  });
});
