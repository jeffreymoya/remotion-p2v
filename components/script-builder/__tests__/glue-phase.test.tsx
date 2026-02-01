import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/src/test/utils";
import userEvent from "@testing-library/user-event";

import { GluePhase } from "../glue-phase";
import { GlueIssue, ScriptDraft } from "@/src/lib/storyflow/script-builder-types";

const toastMock = vi.fn();
const analyzeMutate = vi.fn();
const saveMutate = vi.fn();
const isTaskRunning = vi.fn();

vi.mock("@/components/ui/toast-provider", () => ({
  useToast: () => toastMock,
}));

vi.mock("@/src/hooks/queries/use-execution-status", () => ({
  useAnalyzeGlue: () => ({ mutate: analyzeMutate, isPending: false }),
  useSavePolishedText: () => ({ mutate: saveMutate, isPending: false }),
}));

vi.mock("@/components/ui/background-activity-provider", () => ({
  useBackgroundActivity: () => ({ isTaskRunning }),
}));

const baseDraft: ScriptDraft = {
  id: "draft-1",
  blueprintId: "bp-1",
  version: 1,
  status: "GLUING",
  currentBeatIndex: 0,
  beatDrafts: [
    {
      id: "beat-1",
      scriptDraftId: "draft-1",
      beatId: "beat-1",
      beatIndex: 0,
      text: "Hello robot world",
      wordCount: 3,
      styleModifiersUsed: [],
      checkpoint: "first_draft",
      guidanceApplied: null,
      regeneratedFromId: null,
    },
  ],
  glueIssues: [],
  polishedText: "Hello robot world",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const robotIssue: GlueIssue = {
  id: "issue-robot",
  type: "robot_word",
  severity: "warning",
  location: { beatIndex: 0, charStart: 6, charEnd: 11 },
  text: "robot",
  suggestion: "Remove filler",
};

function makeDraft(overrides: Partial<ScriptDraft> = {}): ScriptDraft {
  return { ...baseDraft, ...overrides };
}

describe("GluePhase", () => {
  beforeEach(() => {
    toastMock.mockReset();
    analyzeMutate.mockReset();
    saveMutate.mockReset();
    isTaskRunning.mockReturnValue(false);
  });

  it("auto-runs glue analysis when no issues and applies returned text", async () => {
    analyzeMutate.mockImplementation((_id, options) => {
      options?.onSuccess?.({
        polishedText: "Polished draft text",
        issues: [robotIssue],
      });
    });

    renderWithProviders(
      <GluePhase
        projectId="proj-1"
        scriptDraft={makeDraft({ glueIssues: [], polishedText: null })}
        onDraftUpdated={vi.fn()}
        onSegment={vi.fn()}
      />
    );

    await waitFor(() => expect(analyzeMutate).toHaveBeenCalledWith("draft-1", expect.any(Object)));
    await waitFor(() => expect(screen.getByText(/^Robot word$/i)).toBeInTheDocument());

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.value).toBe("Polished draft text");
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Glue analysis complete" }));
  });

  it("marks issues resolved and saves before continuing to segmentation", async () => {
    const user = userEvent.setup();
    const onSegment = vi.fn().mockResolvedValue(undefined);
    const onDraftUpdated = vi.fn();

    saveMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.({
        message: "Saved",
        draft: makeDraft({ polishedText: "Updated draft" }),
      });
    });

    renderWithProviders(
      <GluePhase
        projectId="proj-1"
        scriptDraft={makeDraft({ glueIssues: [robotIssue] })}
        onDraftUpdated={onDraftUpdated}
        onSegment={onSegment}
      />
    );

    await user.click(screen.getByText(/^Robot word$/i));
    await user.click(screen.getByRole("button", { name: /save & continue/i }));

    expect(saveMutate).toHaveBeenCalledWith(
      {
        draftId: "draft-1",
        polishedText: "Hello robot world",
        resolvedIssues: ["issue-robot"],
      },
      expect.any(Object)
    );

    await waitFor(() => expect(onDraftUpdated).toHaveBeenCalled());
    await waitFor(() => expect(onSegment).toHaveBeenCalledTimes(1));
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Saved" }));
  });

  it("removes robot words and marks them resolved", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <GluePhase
        projectId="proj-1"
        scriptDraft={makeDraft({ glueIssues: [robotIssue] })}
        onDraftUpdated={vi.fn()}
        onSegment={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /remove robot words/i }));

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.value).toBe("Hello world");
    expect(screen.getByText(/marked resolved/i)).toBeInTheDocument();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Robot words removed" }));
  });

  it("lets a user re-run glue analysis manually", async () => {
    const user = userEvent.setup();
    analyzeMutate.mockImplementation((_id, options) =>
      options?.onSuccess?.({ polishedText: "Manual run", issues: [robotIssue] })
    );

    renderWithProviders(
      <GluePhase
        projectId="proj-1"
        scriptDraft={makeDraft({ glueIssues: [robotIssue] })}
        onDraftUpdated={vi.fn()}
        onSegment={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /re-run analysis/i }));
    expect(analyzeMutate).toHaveBeenCalledTimes(1);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Glue analysis complete" }));
  });
});
