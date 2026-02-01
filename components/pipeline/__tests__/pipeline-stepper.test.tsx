import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/src/test/utils";
import { PipelineStepper } from "../pipeline-stepper";

describe("PipelineStepper", () => {
  it("locks stages after current pipeline step", () => {
    renderWithProviders(<PipelineStepper projectId="proj-1" status="ASSETS_READY" />);

    // With ASSETS_READY, current stage is storyboard; build/render should be locked
    expect(screen.getByText("Storyboard").closest("a")).toHaveAttribute("aria-disabled", "false");
    expect(screen.getByText("Build").closest("a")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Render").closest("a")).toHaveAttribute("aria-disabled", "true");
  });

  it("shows needs review badge", () => {
    renderWithProviders(
      <PipelineStepper projectId="proj-1" status="ASSETS_READY" needsReview={{ storyboard: true }} />
    );

    expect(screen.getByText(/needs review/i)).toBeInTheDocument();
  });
});
