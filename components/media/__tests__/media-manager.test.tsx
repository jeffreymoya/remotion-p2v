import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/src/test/utils";
import userEvent from "@testing-library/user-event";
import { BackgroundActivityProvider } from "@/components/ui/background-activity-provider";

import { MediaManager } from "../media-manager";
import { Asset, Script, Board } from "@/src/lib/storyflow/types";

const toastMock = vi.fn();
const mockUseAssets = vi.fn();
const deleteMutate = vi.fn();
const upscaleMutate = vi.fn();
const selectMusicMutate = vi.fn();

let upscalePending = false;
let upscaleVariables: string | undefined;

vi.mock("@/components/ui/toast-provider", () => ({
  useToast: () => toastMock,
}));

vi.mock("@/src/hooks/queries/use-assets", () => ({
  useAssets: (projectId: string) => mockUseAssets(projectId),
  useDeleteAsset: () => ({ mutate: deleteMutate }),
  useUpscaleAsset: () => ({ mutate: upscaleMutate, isPending: upscalePending, variables: upscaleVariables }),
  useSelectMusicAsset: () => ({ mutate: selectMusicMutate, isPending: false }),
}));

const uploadedAsset: Asset = {
  id: "music-upload",
  projectId: "proj-1",
  type: "MUSIC",
  filename: "upload.mp3",
  path: "/music/upload.mp3",
  createdAt: new Date(),
};

const libraryAsset: Asset = {
  id: "library-music",
  projectId: "proj-1",
  type: "MUSIC",
  filename: "library.mp3",
  path: "/music/library.mp3",
  createdAt: new Date(),
};

vi.mock("@/components/assets/upload-zone", () => ({
  UploadZone: ({ onUploaded, assetType }: { onUploaded: (asset: Asset) => void; assetType: string }) => (
    <div data-testid="upload-zone" data-asset-type={assetType}>
      <button data-testid="simulate-upload" onClick={() => onUploaded(uploadedAsset)}>
        Simulate upload
      </button>
    </div>
  ),
}));

vi.mock("@/components/assets/asset-gallery", () => ({
  AssetGallery: ({
    assets,
    onDelete,
    onUpscale,
    onSelectMusic,
    selectedMusicId,
    upscalingIds,
  }: {
    assets: Asset[];
    onDelete: (id: string) => void;
    onUpscale: (id: string) => void;
    onSelectMusic: (id: string) => void;
    selectedMusicId?: string | null;
    upscalingIds: Set<string>;
  }) => {
    if (!assets.length) return <div data-testid="asset-gallery">empty</div>;
    return (
      <div
        data-testid="asset-gallery"
        data-selected={selectedMusicId ?? "none"}
        data-upscale-count={upscalingIds.size}
      >
        <button data-testid="delete-asset" onClick={() => assets[0] && onDelete(assets[0].id)}>
          Delete first
        </button>
        <button data-testid="upscale-asset" onClick={() => assets[0] && onUpscale(assets[0].id)}>
          Upscale first
        </button>
        <button data-testid="select-music" onClick={() => assets[0] && onSelectMusic(assets[0].id)}>
          Select first music
        </button>
      </div>
    );
  },
}));

vi.mock("@/components/assets/music-library", () => ({
  MusicLibrary: ({ onSelected }: { onSelected: (asset: Asset) => void }) => (
    <div data-testid="music-library">
      <button data-testid="choose-library-track" onClick={() => onSelected(libraryAsset)}>
        Choose library track
      </button>
    </div>
  ),
}));

vi.mock("@/components/assets/music-settings", () => ({
  MusicSettings: ({ onVolumeChange }: { onVolumeChange?: (value: number) => void }) => (
    <div data-testid="music-settings">
      <button data-testid="volume-bump" onClick={() => onVolumeChange?.(0.6)}>
        Volume Up
      </button>
    </div>
  ),
}));

vi.mock("@/components/editors/asset-mapper/simple-asset-mapper", () => ({
  SimpleAssetMapper: () => <div data-testid="asset-mapper">Mapper</div>,
}));

vi.mock("@/components/boards/BoardPlannerWizard", () => ({
  BoardPlannerWizard: () => <div data-testid="board-planner-wizard">Board planner</div>,
}));

const baseAssets: Asset[] = [
  {
    id: "img-1",
    projectId: "proj-1",
    type: "IMAGE",
    filename: "img-1.jpg",
    path: "/images/img-1.jpg",
    createdAt: new Date(),
  },
  {
    id: "music-1",
    projectId: "proj-1",
    type: "MUSIC",
    filename: "song.mp3",
    path: "/music/song.mp3",
    createdAt: new Date(),
  },
];

const script: Script = {
  id: "script-1",
  projectId: "proj-1",
  title: "Demo script",
  segments: [{ index: 0, text: "Hello world" }],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("MediaManager", () => {
  beforeEach(() => {
    toastMock.mockReset();
    deleteMutate.mockReset();
    upscaleMutate.mockReset();
    selectMusicMutate.mockReset();
    mockUseAssets.mockReturnValue({ data: baseAssets });
    upscalePending = false;
    upscaleVariables = undefined;
  });

  it("respects type filter on upload and resets after mismatched upload", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <BackgroundActivityProvider>
        <MediaManager
          projectId="proj-1"
          assets={baseAssets}
          images={baseAssets.filter((asset) => asset.type === "IMAGE")}
          script={script}
          initialMappings={{}}
          selectedMusicAssetId={null}
        />
      </BackgroundActivityProvider>
    );

    expect(screen.getByTestId("upload-zone")).toHaveAttribute("data-asset-type", "IMAGE");

    await user.click(screen.getByRole("button", { name: /videos/i }));
    expect(screen.getByTestId("upload-zone")).toHaveAttribute("data-asset-type", "VIDEO");

    await user.click(screen.getByTestId("simulate-upload"));
    await waitFor(() => expect(screen.getByTestId("upload-zone")).toHaveAttribute("data-asset-type", "IMAGE"));
    await user.click(screen.getByRole("button", { name: /library/i }));
    expect(screen.getByTestId("asset-gallery")).toHaveAttribute("data-selected", uploadedAsset.id);
  });

  it("triggers delete and upscale mutations with success toasts", async () => {
    deleteMutate.mockImplementation((_id, options) => options?.onSuccess?.());
    upscaleMutate.mockImplementation((_id, options) => options?.onSuccess?.());
    upscalePending = true;
    upscaleVariables = "img-1";

    renderWithProviders(
      <BackgroundActivityProvider>
        <MediaManager
          projectId="proj-1"
          assets={baseAssets}
          images={baseAssets.filter((asset) => asset.type === "IMAGE")}
          script={script}
          initialMappings={{}}
          selectedMusicAssetId={null}
        />
      </BackgroundActivityProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: /library/i }));
    await userEvent.click(screen.getByTestId("delete-asset"));
    await userEvent.click(screen.getByTestId("upscale-asset"));

    expect(deleteMutate).toHaveBeenCalledWith("img-1", expect.any(Object));
    expect(upscaleMutate).toHaveBeenCalledWith("img-1", expect.any(Object));
    expect(screen.getByTestId("asset-gallery")).toHaveAttribute("data-upscale-count", "1");
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Asset deleted" }));
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Image upscaled" }));
  });

  it("shows mapper when mapping tab selected with script and images", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <BackgroundActivityProvider>
        <MediaManager
          projectId="proj-1"
          assets={baseAssets}
          images={baseAssets.filter((asset) => asset.type === "IMAGE")}
          script={script}
          initialMappings={{}}
          selectedMusicAssetId={null}
        />
      </BackgroundActivityProvider>
    );

    await user.click(screen.getByRole("button", { name: /mapping/i }));
    expect(screen.getByTestId("asset-mapper")).toBeInTheDocument();
  });

  it("shows create tab with wizard in media mode", async () => {
    renderWithProviders(
      <BackgroundActivityProvider>
        <MediaManager
          projectId="proj-1"
          assets={baseAssets}
          images={baseAssets.filter((asset) => asset.type === "IMAGE")}
          script={script}
          initialMappings={{}}
          selectedMusicAssetId={null}
          initialBoards={[] as Board[]}
        />
      </BackgroundActivityProvider>
    );

    expect(screen.getByRole("button", { name: /create & upload/i })).toBeInTheDocument();
    expect(screen.getByTestId("upload-zone")).toBeInTheDocument();
  });
});
