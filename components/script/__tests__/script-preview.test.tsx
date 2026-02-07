import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@/src/test/utils";
import { buildScript, buildSegment } from "@/src/test/factories";
import { ScriptPreview } from "../script-preview";

describe("ScriptPreview", () => {
  it("renders segments even when indices repeat without key warnings", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const duplicateIndexScript = buildScript({
        title: "Duplicate Index Script",
        segments: [
          buildSegment({ index: 0, text: "First segment" }),
          buildSegment({ index: 0, text: "Second segment" }),
        ],
      });

      renderWithProviders(<ScriptPreview script={duplicateIndexScript} />);

      expect(screen.getByText("Duplicate Index Script")).toBeInTheDocument();
      expect(screen.getByText("First segment")).toBeInTheDocument();
      expect(screen.getByText("Second segment")).toBeInTheDocument();
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("Each child in a list should have a unique \"key\" prop")
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
