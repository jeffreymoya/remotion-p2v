import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/src/test/utils";
import userEvent from "@testing-library/user-event";

import { BoardsWorkflow } from "../BoardsWorkflow";

const hooks = vi.hoisted(() => ({
  useBoardPrompts: vi.fn(),
  useDetectBoardRegions: vi.fn(),
  useGenerateBoardTriggers: vi.fn(),
  useBuildViewport: vi.fn(),
}));

const backgroundTaskMocks = vi.hoisted(() => ({
  runTask: vi.fn(),
  isTaskRunning: vi.fn(),
}));

const mutationMocks = vi.hoisted(() => ({
  detectRegions: { mutateAsync: vi.fn(), isPending: false },
  generateTriggers: { mutateAsync: vi.fn(), isPending: false },
  buildViewport: { mutateAsync: vi.fn(), isPending: false },
}));

const toastMock = vi.hoisted(() => vi.fn());

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange, defaultValue, ...props }: any) => (
    <select
      value={value}
      defaultValue={defaultValue}
      onChange={(e) => onValueChange?.(e.target.value)}
      {...props}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ placeholder }: any) => <option value="">{placeholder}</option>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/editors/boards/simple-boards-editor", () => ({
  SimpleBoardsEditor: () => <div>simple-editor</div>,
}));

vi.mock("@/src/hooks/queries/use-boards", () => ({
  useBoardPrompts: hooks.useBoardPrompts,
  useDetectBoardRegions: hooks.useDetectBoardRegions,
  useGenerateBoardTriggers: hooks.useGenerateBoardTriggers,
  useBuildViewport: hooks.useBuildViewport,
}));

vi.mock("@/src/hooks/use-background-task", () => ({
  useBackgroundTask: () => ({
    runTask: backgroundTaskMocks.runTask,
    isTaskRunning: backgroundTaskMocks.isTaskRunning,
  }),
}));

vi.mock("@/components/ui/toast-provider", () => ({
  useToast: () => toastMock,
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe("BoardsWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.useBoardPrompts.mockReturnValue({ data: null });
    hooks.useDetectBoardRegions.mockReturnValue(mutationMocks.detectRegions);
    hooks.useGenerateBoardTriggers.mockReturnValue(mutationMocks.generateTriggers);
    hooks.useBuildViewport.mockReturnValue(mutationMocks.buildViewport);
    backgroundTaskMocks.isTaskRunning.mockReturnValue(false);
    backgroundTaskMocks.runTask.mockImplementation(async (_config: any, fn: any) =>
      fn({ signal: new AbortController().signal, updateProgress: vi.fn() })
    );
    mutationMocks.detectRegions.mutateAsync.mockResolvedValue({
      boardId: "board-1",
      assetId: "asset-1",
      regions: [],
      warnings: [],
      imageMetadata: { width: 10, height: 10, aspectRatio: 1 },
    });
    mutationMocks.generateTriggers.mutateAsync.mockResolvedValue({
      totalTriggers: 3,
      totalWords: 25,
      triggers: [],
    });
    mutationMocks.buildViewport.mutateAsync.mockResolvedValue({
      viewportJson: { keyframes: [] },
    });
  });

  it("shows alert and editor even without boards", () => {
    renderWithProviders(<BoardsWorkflow projectId="p1" images={[]} initialBoards={[]} />);

    expect(screen.getByText(/prompts now live in media/i)).toBeInTheDocument();
    expect(screen.getByText(/simple-editor/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to media/i })).toHaveAttribute("href", "/projects/p1/media");
    expect(screen.getByRole("button", { name: /detect regions/i })).toBeDisabled();
  });

  it("runs standalone storyboard operations with selected board context", async () => {
    const user = userEvent.setup();
    hooks.useBoardPrompts.mockReturnValue({
      data: {
        version: "1.0",
        generatedAt: new Date().toISOString(),
        prompts: [
          {
            boardId: "board-1",
            gridLayout: { rows: 2, cols: 2 },
            styleGuide: "style",
            elements: [{ id: "e1", type: "photo", gridPosition: { row: 0, col: 0 }, description: "d1" }],
            segmentContexts: [],
            fullPromptText: "prompt-1",
          },
          {
            boardId: "board-2",
            gridLayout: { rows: 2, cols: 2 },
            styleGuide: "style",
            elements: [{ id: "e2", type: "photo", gridPosition: { row: 0, col: 0 }, description: "d2" }],
            segmentContexts: [],
            fullPromptText: "prompt-2",
          },
        ],
      },
    });

    renderWithProviders(
      <BoardsWorkflow
        projectId="p1"
        images={[
          {
            id: "asset-2",
            filename: "board-2.png",
            type: "IMAGE",
            path: "/projects/p1/assets/images/board-2.png",
            projectId: "p1",
            createdAt: new Date(),
            metadata: {},
          } as any,
        ]}
        initialBoards={[
          { id: "b1", index: 0, plan: { boardId: "board-1" }, layout: {}, regions: [], projectId: "p1" } as any,
          {
            id: "b2",
            index: 1,
            plan: { boardId: "board-2" },
            layout: {},
            regions: [],
            projectId: "p1",
            assetId: "asset-2",
          } as any,
        ]}
      />
    );

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "b2");
    expect((select as HTMLSelectElement).value).toBe("b2");

    await user.click(screen.getByRole("button", { name: /detect regions/i }));
    await waitFor(() => {
      expect(mutationMocks.detectRegions.mutateAsync).toHaveBeenCalledWith({
        payload: {
          boardId: "board-2",
          assetId: "asset-2",
          elements: [{ id: "e2", type: "photo", gridPosition: { row: 0, col: 0 }, description: "d2" }],
          gridLayout: { rows: 2, cols: 2 },
        },
        signal: expect.any(Object),
      });
    });

    await user.click(screen.getByRole("button", { name: /generate triggers/i }));
    await waitFor(() => {
      expect(mutationMocks.generateTriggers.mutateAsync).toHaveBeenCalledWith({
        payload: {},
        signal: expect.any(Object),
      });
    });

    await user.click(screen.getByRole("button", { name: /build viewport/i }));
    await waitFor(() => {
      expect(mutationMocks.buildViewport.mutateAsync).toHaveBeenCalledWith({
        payload: { fps: 30 },
        signal: expect.any(Object),
      });
    });
  });

  it("blocks region detection when selected board has no linked assetId", () => {
    hooks.useBoardPrompts.mockReturnValue({
      data: {
        version: "1.0",
        generatedAt: new Date().toISOString(),
        prompts: [
          {
            boardId: "board-1",
            gridLayout: { rows: 2, cols: 2 },
            styleGuide: "style",
            elements: [{ id: "e1", type: "photo", gridPosition: { row: 0, col: 0 }, description: "d1" }],
            segmentContexts: [],
            fullPromptText: "prompt-1",
          },
        ],
      },
    });

    renderWithProviders(
      <BoardsWorkflow
        projectId="p1"
        images={[
          {
            id: "asset-1",
            filename: "board-1.png",
            type: "IMAGE",
            path: "/projects/p1/assets/images/board-1.png",
            projectId: "p1",
            createdAt: new Date(),
            metadata: {},
          } as any,
        ]}
        initialBoards={[
          { id: "b1", index: 0, plan: { boardId: "board-1" }, layout: {}, regions: [], projectId: "p1" } as any,
        ]}
      />
    );

    expect(screen.getByRole("button", { name: /detect regions/i })).toBeDisabled();
    expect(screen.getAllByText(/upload a linked board image in media before detecting regions/i).length).toBeGreaterThan(
      0
    );
    expect(mutationMocks.detectRegions.mutateAsync).not.toHaveBeenCalled();
  });
});
