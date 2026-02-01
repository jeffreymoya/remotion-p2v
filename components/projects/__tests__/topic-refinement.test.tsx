import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/src/test/utils";
import userEvent from "@testing-library/user-event";

import { TopicRefinement } from "../topic-refinement";
import type { RefinementResponse } from "@/app/api/ai/refine/route";

const toastSpy = vi.fn();
const mutateAsync = vi.fn();
let refinePending = false;

vi.mock("@/components/ui/toast-provider", () => ({
  useToast: () => toastSpy,
}));

vi.mock("@/src/hooks/queries/use-ai", () => ({
  useRefineTopic: () => ({ mutateAsync, isPending: refinePending }),
}));

const refinement: RefinementResponse = {
  refinedTitle: "Refined Title",
  refinedDescription: "A better description",
  targetAudience: "designers",
  keyAngles: ["Angle 1", "Angle 2"],
  hooks: ["Hook A", "Hook B"],
  suggestedDuration: 140,
  reasoning: "Because concise messaging converts.",
};

describe("TopicRefinement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    refinePending = false;
  });

  it("submits refinement and renders results", async () => {
    mutateAsync.mockResolvedValueOnce(refinement);
    const user = userEvent.setup();

    renderWithProviders(<TopicRefinement projectId="p1" initialTopic="Original" />);

    await user.clear(screen.getByPlaceholderText(/enter your video topic/i));
    await user.type(screen.getByPlaceholderText(/enter your video topic/i), "New Topic");
    await user.type(
      screen.getByPlaceholderText(/brief description of what you want to cover/i),
      "desc"
    );
    const audienceInput = screen.getByPlaceholderText(
      /e\.g\., ages 20-40, tech enthusiasts/i
    );
    await user.clear(audienceInput);
    await user.type(audienceInput, "makers");

    await user.click(screen.getByRole("button", { name: /refine topic/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalledWith({
      projectId: "p1",
      title: "New Topic",
      description: "desc",
      targetAudience: "makers",
      minDuration: 60,
      maxDuration: 600,
    });

    expect(await screen.findByText(/refined topic analysis/i)).toBeInTheDocument();
    expect(screen.getAllByText(refinement.refinedTitle).length).toBeGreaterThan(0);
    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Topic refined successfully", variant: "success" })
    );
  });

  it("resets to initial state when clicking Start Over", async () => {
    mutateAsync.mockResolvedValueOnce(refinement);
    const user = userEvent.setup();

    renderWithProviders(<TopicRefinement projectId="p1" initialTopic="Initial" />);
    await user.click(screen.getByRole("button", { name: /refine topic/i }));
    await screen.findByText(/refined topic analysis/i);

    await user.click(screen.getByRole("button", { name: /start over/i }));

    expect(screen.queryByText(refinement.refinedTitle)).not.toBeInTheDocument();
    const titleInput = screen.getByPlaceholderText(
      /enter your video topic/i
    ) as HTMLInputElement;
    expect(titleInput.value).toBe("Initial");
    expect(
      (screen.getByPlaceholderText(
        /brief description of what you want to cover/i
      ) as HTMLTextAreaElement).value
    ).toBe("");
    expect(
      (screen.getByPlaceholderText(/e\.g\., ages 20-40, tech enthusiasts/i) as HTMLInputElement).value
    ).toBe("ages 20-40");
  });

  it("shows toast on error and keeps user input", async () => {
    mutateAsync.mockRejectedValueOnce(new Error("refine failed"));
    const user = userEvent.setup();

    renderWithProviders(<TopicRefinement projectId="p1" initialTopic="KeepMe" />);
    await user.click(screen.getByRole("button", { name: /refine topic/i }));

    await waitFor(() =>
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({ title: "refine failed", variant: "error" })
      )
    );

    expect(screen.queryByText(/refined topic analysis/i)).not.toBeInTheDocument();
    expect(
      (screen.getByPlaceholderText(/enter your video topic/i) as HTMLInputElement).value
    ).toBe("KeepMe");
  });

  it("disables refine when title is empty", async () => {
    renderWithProviders(<TopicRefinement projectId="p1" initialTopic="" />);

    const refineButton = screen.getByRole("button", { name: /refine topic/i });
    expect(refineButton).toBeDisabled();
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(toastSpy).not.toHaveBeenCalled();
  });

  it("disables inputs and shows pending state while refining", async () => {
    refinePending = true;

    renderWithProviders(<TopicRefinement projectId="p1" initialTopic="Busy" />);

    expect(screen.getByRole("button", { name: /refining/i })).toBeDisabled();
    expect(screen.getByPlaceholderText(/enter your video topic/i)).toBeDisabled();
    expect(screen.getByPlaceholderText(/brief description/i)).toBeDisabled();
    expect(screen.getByPlaceholderText(/e\.g\., ages 20-40/i)).toBeDisabled();
  });
});
