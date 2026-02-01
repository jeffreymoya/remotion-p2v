import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor } from "@/src/test/utils";
import { StockSearch } from "../stock-search";
import * as useAssetSearchHook from "@/src/hooks/queries/use-asset-search";
import * as useAssetsHook from "@/src/hooks/queries/use-assets";
import * as toastProvider from "@/components/ui/toast-provider";

function renderComponent({
  results = [],
  isLoading = false,
  error = undefined,
}: {
  results?: any[];
  isLoading?: boolean;
  error?: Error | undefined;
} = {}) {
  vi.spyOn(useAssetSearchHook, "useAssetSearch").mockReturnValue({
    data: results,
    isLoading,
    error,
  } as any);

  const mutateAsync = vi.fn().mockResolvedValue({ id: "asset-1", filename: "stock-1.jpg" });
  vi.spyOn(useAssetsHook, "useImportAsset").mockReturnValue({
    mutateAsync,
  } as any);

  const toast = vi.fn();
  vi.spyOn(toastProvider, "useToast").mockReturnValue(toast);

  renderWithProviders(<StockSearch projectId="proj-1" onImported={vi.fn()} />);

  return { mutateAsync, toast };
}

describe("StockSearch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("triggers search and shows results", async () => {
    renderComponent({
      results: [
        {
          id: "res-1",
          previewUrl: "/img.jpg",
          downloadUrl: "/dl.jpg",
          type: "IMAGE",
          source: "pixabay",
        },
      ],
    });

    await userEvent.type(screen.getByLabelText(/search stock media/i), "city");
    await userEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(await screen.findByText("Add to Library")).toBeInTheDocument();
  });

  it("shows validation when empty search", async () => {
    renderComponent();
    await userEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(useAssetSearchHook.useAssetSearch).toHaveBeenLastCalledWith("");
  });

  it("imports and shows toast", async () => {
    const { mutateAsync, toast } = renderComponent({
      results: [
        { id: "res-2", previewUrl: "/p.jpg", downloadUrl: "/d.jpg", type: "IMAGE", source: "pixabay" },
      ],
    });

    await userEvent.click(screen.getByRole("button", { name: /add to library/i }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(toast).toHaveBeenCalled();
  });

  it("shows error message from hook", async () => {
    renderComponent({ error: new Error("boom") });
    await userEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(await screen.findByText("boom")).toBeInTheDocument();
  });
});
