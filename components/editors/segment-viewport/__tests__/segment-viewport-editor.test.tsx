import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/src/test/utils";
import userEvent from "@testing-library/user-event";

import { SegmentViewportEditor } from "../segment-viewport-editor";
import type { Asset, ScriptSegment, SegmentViewport } from "@/src/lib/storyflow/types";
import { sec } from "@/src/lib/types/units";

const segment: ScriptSegment = {
  index: 2,
  text: "A long narration about the autumn skyline.",
  estimatedDuration: sec(6),
};

const asset: Asset = {
  id: "asset-1",
  projectId: "proj-1",
  type: "IMAGE",
  filename: "skyline.jpg",
  path: "/images/skyline.jpg",
  metadata: { width: 1920, height: 1080 },
  createdAt: new Date(),
};

beforeEach(() => {
  // ResizeObserver is not implemented in jsdom.
  if (!("ResizeObserver" in globalThis)) {
    (globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      } as unknown as typeof ResizeObserver;
  }
});

describe("SegmentViewportEditor", () => {
  it("renders segment label and saves the current keyframes", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const initial: SegmentViewport = {
      start: { centerX: 0.2, centerY: 0.3, zoom: 1.1 },
      end: { centerX: 0.7, centerY: 0.4, zoom: 1.6 },
      easing: "easeOut",
    };

    renderWithProviders(
      <SegmentViewportEditor
        open
        segment={segment}
        asset={asset}
        initialViewport={initial}
        onSave={onSave}
        onClear={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/segment #3/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /save viewport/i }));

    expect(onSave).toHaveBeenCalledWith(initial);
  });

  it("emits clear when the user clicks Clear viewport", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();

    renderWithProviders(
      <SegmentViewportEditor
        open
        segment={segment}
        asset={asset}
        onSave={vi.fn()}
        onClear={onClear}
        onClose={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /clear viewport/i }));
    expect(onClear).toHaveBeenCalled();
  });
});
