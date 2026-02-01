import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, fireEvent, waitFor } from "@/src/test/utils";
import userEvent from "@testing-library/user-event";

import { MusicSettings } from "../music-settings";

const toastSpy = vi.fn();
const mutateAsync = vi.fn();
const onVolumeChange = vi.fn();

vi.mock("@/components/ui/toast-provider", () => ({
  useToast: () => toastSpy,
}));

vi.mock("@/src/hooks/queries/use-music-library", () => ({
  useUpdateMusicVolume: () => ({ mutateAsync, isPending: false }),
}));

describe("MusicSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates volume and calls mutation when a track is selected", async () => {
    mutateAsync.mockResolvedValueOnce({});
    const user = userEvent.setup();

    renderWithProviders(
      <MusicSettings
        projectId="p1"
        selectedAssetId="asset-1"
        initialVolume={0.3}
        onVolumeChange={onVolumeChange}
      />
    );

    const slider = screen.getByRole("slider") as HTMLInputElement;
    expect(slider.value).toBe("30");

    fireEvent.change(slider, { target: { value: "50" } });

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ assetId: "asset-1", volume: 0.5 })
    );
    expect(onVolumeChange).toHaveBeenCalledWith(0.5);
    expect(screen.getAllByText("50%").length).toBeGreaterThan(0);
  });

  it("keeps slider disabled when no track selected", () => {
    renderWithProviders(<MusicSettings projectId="p1" selectedAssetId={null} />);

    const slider = screen.getByRole("slider");
    expect(slider).toBeDisabled();
  });

  it("shows toast when mutation fails but retains new volume state", async () => {
    mutateAsync.mockRejectedValueOnce(new Error("update failed"));
    const user = userEvent.setup();

    renderWithProviders(
      <MusicSettings projectId="p1" selectedAssetId="asset-2" initialVolume={0.4} />
    );

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "60" } });

    await waitFor(() =>
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({ title: "update failed", variant: "error" })
      )
    );

    expect(screen.getByText("60%")).toBeInTheDocument();
  });
});
