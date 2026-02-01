import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@/src/test/utils";
import {
  createQueryWrapper,
  createTestQueryClient,
} from "@/src/test/utils";
import {
  projectKeys,
  useDeleteProject,
  useProject,
  useProjects,
  useUpdateProject,
} from "../use-projects";
import * as projectsApi from "@/src/lib/api/projects";
import { buildProject } from "@/src/test/factories";

describe("useProjects", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches projects successfully and exposes loading state", async () => {
    const mockProjects = [buildProject({ id: "proj-1" }), buildProject({ id: "proj-2" })];
    vi.spyOn(projectsApi, "fetchProjects").mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useProjects(), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.data).toEqual(mockProjects));
    expect(result.current.isSuccess).toBe(true);
    expect(projectsApi.fetchProjects).toHaveBeenCalledTimes(1);
  });

  it("surface errors from fetch", async () => {
    vi.spyOn(projectsApi, "fetchProjects").mockRejectedValue(new Error("Failed to fetch projects"));

    const { result } = renderHook(() => useProjects(), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Failed to fetch projects");
  });
});

describe("useProject", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches single project when id is provided", async () => {
    const mockProject = buildProject({ id: "123", name: "Test Project" });
    vi.spyOn(projectsApi, "fetchProject").mockResolvedValue(mockProject);

    const { result } = renderHook(() => useProject("123"), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });

    await waitFor(() => expect(result.current.data).toEqual(mockProject));
    expect(projectsApi.fetchProject).toHaveBeenCalledWith("123");
  });

  it("does not fetch when id is empty", () => {
    const fetchSpy = vi.spyOn(projectsApi, "fetchProject");

    const { result } = renderHook(() => useProject(""), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });

    expect(result.current.isLoading).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("mutations", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("updates project and refreshes caches", async () => {
    const queryClient = createTestQueryClient();
    const wrapper = createQueryWrapper(queryClient);
    const project = buildProject({ id: "proj-123", name: "Old" });
    queryClient.setQueryData(projectKeys.detail(project.id), project);
    const updated = { ...project, name: "Updated" };
    vi.spyOn(projectsApi, "updateProject").mockResolvedValue(updated);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateProject(), { wrapper });
    await result.current.mutateAsync({ id: project.id, data: { name: "Updated" } });

    expect(queryClient.getQueryData(projectKeys.detail(project.id))).toEqual(updated);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: projectKeys.all });
  });

  it("deletes project and removes caches", async () => {
    const queryClient = createTestQueryClient();
    const wrapper = createQueryWrapper(queryClient);
    const project = buildProject({ id: "proj-remove" });
    queryClient.setQueryData(projectKeys.detail(project.id), project);
    vi.spyOn(projectsApi, "deleteProject").mockResolvedValue();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const removeSpy = vi.spyOn(queryClient, "removeQueries");

    const { result } = renderHook(() => useDeleteProject(), { wrapper });
    await result.current.mutateAsync(project.id);

    expect(removeSpy).toHaveBeenCalledWith({ queryKey: projectKeys.detail(project.id) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: projectKeys.all });
  });
});
