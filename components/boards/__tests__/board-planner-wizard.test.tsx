import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent } from "@testing-library/react";
import { renderWithProviders, screen, waitFor } from "@/src/test/utils";
import userEvent from "@testing-library/user-event";

import { BoardPlannerWizard } from "../BoardPlannerWizard";
import { buildScript } from "@/src/test/factories";

const toastSpy = vi.fn();
const runTask = vi.fn(async (_meta, fn) =>
  fn({ signal: { aborted: false }, updateProgress: vi.fn() })
);
const isTaskRunning = vi.fn(() => false);

const planBoardsMutation = { mutateAsync: vi.fn(), isPending: false };
const promptsMutation = { mutateAsync: vi.fn(), isPending: false };
const regionsMutation = { mutateAsync: vi.fn(), isPending: false };
const triggersMutation = { mutateAsync: vi.fn(), isPending: false };
const viewportMutation = { mutateAsync: vi.fn(), isPending: false };
const boardPlanQuery = { data: undefined, isFetching: false };
const boardPromptsQuery = { data: undefined, isFetching: false };
const updateProjectMutation = { mutate: vi.fn() };
const projectQuery = { data: { wizardProgress: null } };

vi.mock("@/components/ui/toast-provider", () => ({
  useToast: () => toastSpy,
}));

vi.mock("@/src/hooks/use-background-task", () => ({
  useBackgroundTask: () => ({ runTask, isTaskRunning }),
}));

vi.mock("@/src/hooks/queries/use-boards", () => ({
  usePlanBoards: () => planBoardsMutation,
  useBoardPlan: () => boardPlanQuery,
  useBoardPrompts: () => boardPromptsQuery,
  useGenerateBoardPrompts: () => promptsMutation,
  useDetectBoardRegions: () => regionsMutation,
  useGenerateBoardTriggers: () => triggersMutation,
  useBuildViewport: () => viewportMutation,
}));

vi.mock("@/src/hooks/queries/use-projects", () => ({
  useProject: () => projectQuery,
  useUpdateProject: () => updateProjectMutation,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock("@/components/boards/BoardPlanView", () => ({
  BoardPlanView: () => <div>plan-view</div>,
}));

vi.mock("@/components/boards/PromptDisplay", () => ({
  PromptDisplay: () => <div>prompt-display</div>,
}));

vi.mock("@/components/boards/ImageUploader", () => ({
  ImageUploader: ({ onUploadComplete }: { onUploadComplete: (payload: { assetId: string; path?: string }) => void }) => (
    <button onClick={() => onUploadComplete({ assetId: "asset-b1", path: "boards/b1.png" })}>mock-upload</button>
  ),
}));

vi.mock("@/components/boards/RegionEditor", () => ({
  RegionEditor: () => <div>region-editor</div>,
}));

vi.mock("@/components/boards/ViewportPreview", () => ({
  ViewportPreview: () => <div>viewport-preview</div>,
}));

describe("BoardPlannerWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runTask.mockClear();
    planBoardsMutation.mutateAsync.mockReset();
    promptsMutation.mutateAsync.mockReset();
    regionsMutation.mutateAsync.mockReset();
    triggersMutation.mutateAsync.mockReset();
    viewportMutation.mutateAsync.mockReset();
    updateProjectMutation.mutate.mockReset();
    boardPlanQuery.data = undefined;
    boardPromptsQuery.data = undefined;
    boardPlanQuery.isFetching = false;
    boardPromptsQuery.isFetching = false;
    projectQuery.data = { wizardProgress: null };
  });

  it("advances through all steps when actions succeed (storyboard mode)", async () => {
    planBoardsMutation.mutateAsync.mockResolvedValue({
      plan: { boards: [{ boardId: "b1", segments: [], summary: "", title: "Board 1" }], totalDurationMs: 1000 },
    });
    promptsMutation.mutateAsync.mockResolvedValue({
      prompts: [{ boardId: "b1", elements: [], gridLayout: { rows: 2, cols: 2 } }],
    });
    regionsMutation.mutateAsync.mockResolvedValue({
      regions: [{ id: "r1", x: 0, y: 0, width: 10, height: 10, salience: 0.5 }],
      imageMetadata: { width: 100, height: 100, aspectRatio: 1 },
    });
    triggersMutation.mutateAsync.mockResolvedValue({
      totalTriggers: 1,
      totalWords: 1,
      triggers: [{ word: "hello", timestampMs: 0, transitionMs: 100 }],
    });
    viewportMutation.mutateAsync.mockResolvedValue({
      viewportJson: { keyframes: [] },
    });

    const user = userEvent.setup();
    const script = buildScript();

    renderWithProviders(<BoardPlannerWizard projectId="p1" script={script} />);

    await user.click(screen.getByRole("button", { name: /generate board plan/i }));
    await waitFor(() => expect(planBoardsMutation.mutateAsync).toHaveBeenCalled());
    expect(await screen.findByText(/board plan generated/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /generate image prompts/i }));
    await waitFor(() => expect(promptsMutation.mutateAsync).toHaveBeenCalled());
    expect(promptsMutation.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          gridLayout: { rows: 2, cols: 3 },
          styleGuide: "Detective investigation board",
        }),
      })
    );
    expect(await screen.findByText(/image prompts ready/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /continue to upload/i }));
    await user.click(screen.getByRole("button", { name: /mock-upload/i }));
    await user.click(screen.getByRole("button", { name: /detect regions/i }));
    await waitFor(() => expect(regionsMutation.mutateAsync).toHaveBeenCalled());
    expect(await screen.findByText(/edit regions/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /generate triggers/i }));
    await waitFor(() => expect(triggersMutation.mutateAsync).toHaveBeenCalled());
    expect(await screen.findByText(/triggers generated/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /build viewport/i }));
    await waitFor(() => expect(viewportMutation.mutateAsync).toHaveBeenCalled());
    expect(await screen.findByText(/viewport complete/i)).toBeInTheDocument();
  });

  it("sends configured style guide and grid layout to prompt generation", async () => {
    planBoardsMutation.mutateAsync.mockResolvedValue({
      plan: { boards: [{ boardId: "b1", segments: [], summary: "", title: "Board 1" }], totalDurationMs: 1000 },
    });
    promptsMutation.mutateAsync.mockResolvedValue({
      prompts: [{ boardId: "b1", elements: [], gridLayout: { rows: 3, cols: 2 }, styleGuide: "Noir collage wall" }],
    });

    const user = userEvent.setup();
    const script = buildScript();

    renderWithProviders(<BoardPlannerWizard projectId="p1" script={script} />);
  
    await user.clear(screen.getByLabelText(/style guide/i));
    await user.type(screen.getByLabelText(/style guide/i), "Noir collage wall");
    fireEvent.change(screen.getByLabelText(/rows/i), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText(/columns/i), { target: { value: "2" } });

    await user.click(screen.getByRole("button", { name: /generate board plan/i }));
    await waitFor(() => expect(planBoardsMutation.mutateAsync).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /generate image prompts/i }));
    await waitFor(() => expect(promptsMutation.mutateAsync).toHaveBeenCalled());

    expect(promptsMutation.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          gridLayout: { rows: 3, cols: 2 },
          styleGuide: "Noir collage wall",
        }),
      })
    );
  });

  it("hydrates from persisted wizardProgress and artifact signals", async () => {
    const script = buildScript();
    boardPlanQuery.data = {
      plan: {
        version: "1.0",
        scriptPath: "projects/p1/script.json",
        totalSegments: 1,
        totalDurationMs: 1000,
        boards: [{ boardId: "b1", segmentIndices: [0], totalDurationMs: 1000, topicSummary: "sum" }],
        generatedAt: new Date().toISOString(),
      },
    };
    boardPromptsQuery.data = {
      version: "1.0",
      prompts: [{ boardId: "b1", elements: [], gridLayout: { rows: 2, cols: 3 } }],
      generatedAt: new Date().toISOString(),
    };
    projectQuery.data = {
      wizardProgress: {
        boardPlanner: {
          currentStep: "upload",
          styleGuide: "Noir collage wall",
          gridRows: 3,
          gridCols: 2,
          maxBoardDuration: 45000,
        },
      },
    };

    renderWithProviders(<BoardPlannerWizard projectId="p1" script={script} mode="media" />);

    expect(await screen.findByText(/upload board images/i)).toBeInTheDocument();
  });
});
