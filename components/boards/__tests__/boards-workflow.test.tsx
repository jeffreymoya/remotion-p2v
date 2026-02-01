import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@/src/test/utils";
import userEvent from "@testing-library/user-event";

import { BoardsWorkflow } from "../BoardsWorkflow";
import { buildScript } from "@/src/test/factories";

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/editors/boards/simple-boards-editor", () => ({
  SimpleBoardsEditor: () => <div>simple-editor</div>,
}));

vi.mock("@/components/boards/BoardPlannerWizard", () => ({
  BoardPlannerWizard: () => <div>planner</div>,
}));

vi.mock("@/components/ui/toast-provider", () => ({
  useToast: () => vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe("BoardsWorkflow", () => {
  it("shows script required notice when no script segments", () => {
    renderWithProviders(
      <BoardsWorkflow projectId="p1" script={null} images={[]} initialBoards={[]} />
    );

    expect(screen.getByText(/script required/i)).toBeInTheDocument();
  });

  it("toggles to manual mode and renders editor", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <BoardsWorkflow
        projectId="p1"
        script={buildScript()}
        images={[]}
        initialBoards={[]}
      />
    );

    expect(screen.getByText(/ai workflow/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /manual editor/i }));
    expect(screen.getByText(/simple-editor/i)).toBeInTheDocument();
  });
});
