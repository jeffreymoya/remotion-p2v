import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor } from "@/src/test/utils";
import { RenderPanel } from "../render-panel";
import * as renderHooks from "@/src/hooks/queries/use-render";
import * as renderApi from "@/src/lib/api/render";
import * as backgroundTask from "@/src/hooks/use-background-task";
import { Render } from "@/src/lib/storyflow/types";

const baseRender: Render = {
  id: "render-1",
  projectId: "proj-1",
  quality: "DRAFT",
  status: "PROCESSING",
  progress: 0.25,
  outputPath: null,
  error: null,
  createdAt: new Date().toISOString(),
  startedAt: new Date().toISOString(),
  completedAt: null,
};

describe("RenderPanel", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("shows existing render progress", () => {
    vi.spyOn(renderHooks, "useRenderStatus").mockReturnValue({ data: baseRender } as any);
    vi.spyOn(backgroundTask, "useBackgroundTask").mockReturnValue({
      runTask: vi.fn(),
      isTaskRunning: () => false,
    } as any);

    renderWithProviders(<RenderPanel projectId="proj-1" initialRender={baseRender} />);
    expect(screen.getByText("PROCESSING")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  it("starts draft render via background task", async () => {
    const mockRun = vi.fn((_, fn) => fn({ signal: new AbortController().signal }));
    vi.spyOn(backgroundTask, "useBackgroundTask").mockReturnValue({
      runTask: mockRun,
      isTaskRunning: () => false,
    } as any);
    vi.spyOn(renderHooks, "useRenderStatus").mockReturnValue({ data: null } as any);
    vi.spyOn(renderApi, "startRender").mockResolvedValue({ ...baseRender, id: "new-render" } as any);

    renderWithProviders(<RenderPanel projectId="proj-1" initialRender={null} />);
    await userEvent.click(screen.getByRole("button", { name: /render draft/i }));

    await waitFor(() => expect(renderApi.startRender).toHaveBeenCalledWith("proj-1", "DRAFT"));
  });

  it("disables buttons while processing", () => {
    vi.spyOn(renderHooks, "useRenderStatus").mockReturnValue({ data: { ...baseRender, status: "PROCESSING" } } as any);
    vi.spyOn(backgroundTask, "useBackgroundTask").mockReturnValue({
      runTask: vi.fn(),
      isTaskRunning: () => false,
    } as any);

    renderWithProviders(<RenderPanel projectId="proj-1" initialRender={baseRender} />);
    expect(screen.getByRole("button", { name: /render draft/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /production/i })).toBeDisabled();
  });

  it("disables buttons when a render task is already running", () => {
    vi.spyOn(renderHooks, "useRenderStatus").mockReturnValue({ data: null } as any);
    vi.spyOn(backgroundTask, "useBackgroundTask").mockReturnValue({
      runTask: vi.fn(),
      isTaskRunning: () => true,
    } as any);

    renderWithProviders(<RenderPanel projectId="proj-1" initialRender={null} />);
    expect(screen.getByRole("button", { name: /render draft/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /production/i })).toBeDisabled();
  });

  it("retries a failed render with the same quality", async () => {
    const failedRender: Render = {
      ...baseRender,
      status: "FAILED",
      quality: "PRODUCTION",
      error: "oops",
      progress: 0.6,
    };

    const mockRun = vi.fn((_, fn) => fn({ signal: new AbortController().signal }));
    vi.spyOn(backgroundTask, "useBackgroundTask").mockReturnValue({
      runTask: mockRun,
      isTaskRunning: () => false,
    } as any);
    vi.spyOn(renderHooks, "useRenderStatus").mockReturnValue({ data: failedRender } as any);
    vi.spyOn(renderApi, "startRender").mockResolvedValue({ ...failedRender, status: "PROCESSING" } as any);

    renderWithProviders(<RenderPanel projectId="proj-1" initialRender={failedRender} />);

    await userEvent.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => expect(renderApi.startRender).toHaveBeenCalledWith("proj-1", "PRODUCTION"));
  });
});
