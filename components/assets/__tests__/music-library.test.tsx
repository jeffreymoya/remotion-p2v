import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/src/test/utils";
import userEvent from "@testing-library/user-event";

import { MusicLibrary } from "../music-library";
import { MusicTrack } from "@/src/lib/storyflow/music/types";
import { Asset } from "@/src/lib/storyflow/types";

const toastMock = vi.fn();
const searchSpy = vi.fn();
const refetchSpy = vi.fn();
const selectMutate = vi.fn();

let searchResult: { data: MusicTrack[]; isLoading: boolean; error: Error | null; refetch: () => void } = {
  data: [],
  isLoading: false,
  error: null,
  refetch: refetchSpy,
};

vi.mock("@/components/ui/toast-provider", () => ({
  useToast: () => toastMock,
}));

vi.mock("@/src/hooks/queries/use-music-library", () => ({
  useMusicSearch: (query: string) => {
    searchSpy(query);
    return searchResult;
  },
  useSelectMusicTrack: () => ({ mutate: selectMutate, isPending: false, variables: undefined }),
}));

vi.mock("../music-track-card", () => ({
  MusicTrackCard: ({
    track,
    isSelected,
    isPlaying,
    onPlay,
    onPause,
    onSelect,
    isSelecting,
  }: {
    track: MusicTrack;
    isSelected: boolean;
    isPlaying: boolean;
    onPlay: () => void;
    onPause: () => void;
    onSelect: () => void;
    isSelecting: boolean;
  }) => (
    <div data-testid={`track-${track.id}`}>
      <span>{track.title}</span>
      <span data-testid={`selected-${track.id}`}>{isSelected ? "selected" : "not-selected"}</span>
      <button data-testid={`play-${track.id}`} onClick={isPlaying ? onPause : onPlay}>
        {isPlaying ? "Pause" : "Play"}
      </button>
      <button data-testid={`select-${track.id}`} disabled={isSelecting} onClick={onSelect}>
        Select
      </button>
    </div>
  ),
}));

const tracks: MusicTrack[] = [
  { id: "track-1", title: "Cinematic Rise", previewUrl: "/preview-1.mp3", downloadUrl: "/dl-1.mp3", source: "pixabay" },
  { id: "track-2", title: "Upbeat Energy", previewUrl: "/preview-2.mp3", downloadUrl: "/dl-2.mp3", source: "pixabay" },
];

const selectedAsset: Asset = {
  id: "track-2",
  projectId: "proj-1",
  type: "MUSIC",
  filename: "selected.mp3",
  path: "/music/selected.mp3",
  createdAt: new Date(),
};

describe("MusicLibrary", () => {
  const mockOnSelected = vi.fn();

  beforeEach(() => {
    mockOnSelected.mockReset();
    toastMock.mockReset();
    searchSpy.mockReset();
    refetchSpy.mockReset();
    selectMutate.mockReset();
    searchResult = { data: tracks, isLoading: false, error: null, refetch: refetchSpy };
  });

  it("submits searches and refreshes the query", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MusicLibrary projectId="proj-1" onSelected={mockOnSelected} />);

    expect(searchSpy).toHaveBeenCalledWith("cinematic");

    const input = screen.getByPlaceholderText(/search moods or keywords/i);
    await user.clear(input);
    await user.type(input, "jazz");
    await user.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => expect(searchSpy.mock.calls.at(-1)?.[0]).toBe("jazz"));

    await user.click(screen.getByRole("button", { name: /refresh/i }));
    expect(refetchSpy).toHaveBeenCalled();
  });

  it("toggles preview play state", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MusicLibrary projectId="proj-1" onSelected={mockOnSelected} />);

    const playBtn = screen.getByTestId("play-track-1");
    expect(playBtn).toHaveTextContent("Play");

    await user.click(playBtn);
    await waitFor(() => expect(screen.getByTestId("play-track-1")).toHaveTextContent("Pause"));

    await user.click(screen.getByTestId("play-track-1"));
    await waitFor(() => expect(screen.getByTestId("play-track-1")).toHaveTextContent("Play"));
  });

  it("selects a track, returns asset, and marks it selected", async () => {
    const user = userEvent.setup();
    selectMutate.mockImplementation((_track, options) =>
      options?.onSuccess?.({ asset: selectedAsset })
    );

    renderWithProviders(<MusicLibrary projectId="proj-1" onSelected={mockOnSelected} />);

    await user.click(screen.getByTestId("select-track-2"));

    expect(selectMutate).toHaveBeenCalledWith(tracks[1], expect.any(Object));
    expect(mockOnSelected).toHaveBeenCalledWith(selectedAsset);
    await waitFor(() => expect(screen.getByTestId("selected-track-2")).toHaveTextContent("selected"));
  });

  it("surfaces selection errors via toast", async () => {
    const user = userEvent.setup();
    selectMutate.mockImplementation((_track, options) => options?.onError?.(new Error("failure")));

    renderWithProviders(<MusicLibrary projectId="proj-1" onSelected={mockOnSelected} />);
    await user.click(screen.getByTestId("select-track-1"));

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Music selection failed", description: "failure" })
    );
  });

  it("preserves selected track when provided via props", () => {
    renderWithProviders(
      <MusicLibrary projectId="proj-1" onSelected={mockOnSelected} selectedAssetId="track-2" />
    );

    expect(screen.getByTestId("selected-track-2")).toHaveTextContent("selected");
  });

  it("shows error message when the search hook errors", async () => {
    searchResult = { data: [], isLoading: false, error: new Error("API key missing"), refetch: refetchSpy };

    renderWithProviders(<MusicLibrary projectId="proj-1" onSelected={mockOnSelected} />);

    await waitFor(() => expect(screen.getByText(/api key missing/i)).toBeInTheDocument());
  });
});
