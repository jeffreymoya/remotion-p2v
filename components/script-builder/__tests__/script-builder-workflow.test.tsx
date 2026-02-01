import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/src/test/utils";
import userEvent from "@testing-library/user-event";

import { ScriptBuilderWorkflow } from "../script-builder-workflow";
import { buildBlueprint, buildScript, buildScriptDraft } from "@/src/test/factories";

const toastSpy = vi.fn();
const runTask = vi.fn(async (_meta, fn) =>
  fn({ signal: { aborted: false }, updateProgress: vi.fn() })
);
const isTaskRunning = vi.fn(() => false);
const updateProject = { mutateAsync: vi.fn() };

const generateBlueprint = vi.fn();
const regenerateBlueprint = vi.fn();
const segmentScript = vi.fn();
const generateTTS = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/ui/toast-provider", () => ({
  useToast: () => toastSpy,
}));

vi.mock("@/src/hooks/use-background-task", () => ({
  useBackgroundTask: () => ({ runTask, isTaskRunning }),
}));

vi.mock("@/src/hooks/use-auto-save", () => ({
  useAutoSave: () => ({ status: "idle", lastSavedAt: null, error: null }),
}));

vi.mock("@/components/pipeline/stage-invalidation-context", () => ({
  useStageInvalidation: () => ({
    registerScriptChange: vi.fn(),
    registerEdit: vi.fn(),
  }),
}));

vi.mock("@/src/hooks/queries/use-projects", () => ({
  useUpdateProject: () => updateProject,
}));

vi.mock("@/src/lib/api/script-builder", () => ({
  segmentScript: (...args: unknown[]) => segmentScript(...args),
  generateBlueprint: (...args: unknown[]) => generateBlueprint(...args),
  regenerateBlueprint: (...args: unknown[]) => regenerateBlueprint(...args),
}));

vi.mock("@/src/lib/api/tts", () => ({
  generateTTS: (...args: unknown[]) => generateTTS(...args),
}));

// Mock child components to simple triggers — always use @/ absolute paths
// to avoid vi.mock resolving from __tests__/ instead of the component directory
vi.mock("@/components/script-builder/duration-picker", () => ({
  DurationPicker: ({ onChange }: { onChange: (v: number) => void }) => (
    <button onClick={() => onChange(120000)}>duration-picker</button>
  ),
}));

vi.mock("@/components/script-builder/blueprint-review", () => ({
  BlueprintReview: ({ onApproved, onRegenerate }: any) => (
    <div>
      <button onClick={onApproved}>approve</button>
      <button onClick={onRegenerate}>regenerate</button>
    </div>
  ),
}));

vi.mock("@/components/script-builder/execution-progress", () => ({
  ExecutionProgress: ({ onComplete }: any) => (
    <button onClick={() => onComplete(buildScriptDraft())}>complete-execution</button>
  ),
}));

vi.mock("@/components/script-builder/glue-phase", () => ({
  GluePhase: ({ onSegment, onSkip }: any) => (
    <div>
      <button onClick={onSegment}>segment</button>
      <button onClick={onSkip}>skip</button>
    </div>
  ),
}));

vi.mock("@/components/script-builder/beat-regeneration", () => ({
  BeatRegeneration: () => <div>beat-regeneration</div>,
}));

vi.mock("@/components/script-builder/history-panel", () => ({
  HistoryPanel: () => <div>history-panel</div>,
}));

vi.mock("@/components/script/script-preview", () => ({
  ScriptPreview: () => <div>script-preview</div>,
}));

vi.mock("@/components/ui/save-indicator", () => ({
  SaveIndicator: () => <div>save-indicator</div>,
}));

describe("ScriptBuilderWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runTask.mockClear();
  });

  it("generates blueprint and advances to blueprint phase", async () => {
    const blueprint = buildBlueprint();
    generateBlueprint.mockResolvedValueOnce({ blueprint });
    const user = userEvent.setup();

    renderWithProviders(
      <ScriptBuilderWorkflow
        projectId="p1"
        initialTopic="Original"
        initialState={{
          phase: "input",
          blueprint: null,
          scriptDraft: null,
          script: null,
          error: null,
        }}
      />
    );

    await user.type(
      screen.getByPlaceholderText(/fandom goes too far/i),
      "New topic headline"
    );
    await user.click(screen.getByRole("button", { name: /generate blueprint/i }));

    await waitFor(() => expect(generateBlueprint).toHaveBeenCalled());
    expect(runTask).toHaveBeenCalled();
    expect(await screen.findByRole("button", { name: /approve/i })).toBeInTheDocument();
  });

  it("walks through blueprint -> execution -> glue -> preview phases", async () => {
    const blueprint = buildBlueprint();
    const draft = buildScriptDraft({ blueprintId: blueprint.id });
    const script = buildScript({ blueprintId: blueprint.id });

    regenerateBlueprint.mockResolvedValue({ blueprint });
    segmentScript.mockResolvedValue({ script });
    generateTTS.mockResolvedValue({ segment: script.segments[0] });

    const user = userEvent.setup();
    renderWithProviders(
      <ScriptBuilderWorkflow
        projectId="p1"
        initialTopic="Initial"
        initialState={{
          phase: "blueprint",
          blueprint,
          scriptDraft: null,
          script: null,
          error: null,
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: /approve/i }));
    await user.click(screen.getByRole("button", { name: /complete-execution/i }));
    await waitFor(() => screen.getByRole("button", { name: /segment/i }));
    await user.click(screen.getByRole("button", { name: /segment/i }));

    await waitFor(() => expect(segmentScript).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /start new script/i })).toBeInTheDocument()
    );
    expect(toastSpy).toHaveBeenCalled();
  });
});
