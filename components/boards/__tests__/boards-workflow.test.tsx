import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@/src/test/utils";
import userEvent from "@testing-library/user-event";

import { BoardsWorkflow } from "../BoardsWorkflow";

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

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe("BoardsWorkflow", () => {
  it("shows alert and editor even without boards", () => {
    renderWithProviders(<BoardsWorkflow projectId="p1" images={[]} initialBoards={[]} />);

    expect(screen.getByText(/prompts now live in media/i)).toBeInTheDocument();
    expect(screen.getByText(/simple-editor/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to media/i })).toHaveAttribute("href", "/projects/p1/media");
  });

  it("lists boards in selector and keeps actions disabled", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <BoardsWorkflow
        projectId="p1"
        images={[]}
        initialBoards={[
          { id: "b1", index: 0, plan: {}, layout: {}, projectId: "p1" } as any,
          { id: "b2", index: 1, plan: {}, layout: {}, projectId: "p1" } as any,
        ]}
      />
    );

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "b2");
    expect((select as HTMLSelectElement).value).toBe("b2");

    const buttons = screen.getAllByRole("button");
    expect(buttons.every((btn) => (btn as HTMLButtonElement).disabled)).toBe(true);
    expect(screen.getAllByText(/available after the image storage migration/i)).toHaveLength(3);
  });
});
