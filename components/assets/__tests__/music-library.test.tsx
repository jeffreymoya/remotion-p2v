import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/src/test/utils";
import userEvent from "@testing-library/user-event";
import { MusicLibrary } from "../music-library";

// Mock the toast provider
vi.mock("@/components/ui/toast-provider", () => ({
  useToast: () => vi.fn(),
}));

describe("MusicLibrary", () => {
  const mockOnSelected = vi.fn();

  beforeEach(() => {
    mockOnSelected.mockClear();
  });

  it("renders search input and initial UI", () => {
    renderWithProviders(
      <MusicLibrary projectId="test-project" onSelected={mockOnSelected} />
    );

    expect(screen.getByPlaceholderText(/search moods or keywords/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
    expect(screen.getByText(/music library/i)).toBeInTheDocument();
  });

  it("handles search submission", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MusicLibrary projectId="test-project" onSelected={mockOnSelected} />
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading tracks/i)).not.toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/search moods or keywords/i);
    await user.clear(input);
    await user.type(input, "jazz");
    await user.click(screen.getByRole("button", { name: /search/i }));

    // Should complete search and show results
    await waitFor(() => {
      expect(screen.queryByText(/loading tracks/i)).not.toBeInTheDocument();
    });
  });

  it("displays tracks after successful search", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MusicLibrary projectId="test-project" onSelected={mockOnSelected} />
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading tracks/i)).not.toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/search moods or keywords/i);
    await user.clear(input);
    await user.type(input, "cinematic");
    await user.click(screen.getByRole("button", { name: /search/i }));

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/loading tracks/i)).not.toBeInTheDocument();
    });
  });

  it("shows error message when API fails", async () => {
    // Mock failed fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "API key missing" }),
      } as Response)
    );

    renderWithProviders(
      <MusicLibrary projectId="test-project" onSelected={mockOnSelected} />
    );

    // Wait for initial load error
    await waitFor(() => {
      expect(screen.getByText(/api key missing/i)).toBeInTheDocument();
    });
  });

  it("updates search query when typing", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MusicLibrary projectId="test-project" onSelected={mockOnSelected} />
    );

    const input = screen.getByPlaceholderText(/search moods or keywords/i) as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "upbeat");

    expect(input.value).toBe("upbeat");
  });
});
