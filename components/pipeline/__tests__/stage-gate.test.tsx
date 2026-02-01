import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "@/src/test/utils";
import { StageGate } from "../stage-gate";

describe("StageGate", () => {
  it("shows locked message when locked", () => {
    renderWithProviders(<StageGate locked message="Complete media first">Secret</StageGate>);
    expect(screen.getByText(/complete media first/i)).toBeInTheDocument();
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("renders children when unlocked", () => {
    renderWithProviders(<StageGate locked={false}>Content</StageGate>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});
