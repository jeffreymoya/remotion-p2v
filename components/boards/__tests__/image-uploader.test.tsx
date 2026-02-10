import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor } from "@/src/test/utils";
import { ImageUploader } from "../ImageUploader";
import * as assetHooks from "@/src/hooks/queries/use-assets";

const toastMock = vi.fn();
vi.mock("@/components/ui/toast-provider", () => ({
  useToast: () => toastMock,
}));

describe("ImageUploader", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Mock createImageBitmap for dimension validation
    (global as any).createImageBitmap = vi.fn().mockResolvedValue({ width: 3000, height: 3000 });
    toastMock.mockReset();
  });

  it("uploads valid image and shows success", async () => {
    const mutate = vi.fn((_payload, opts) =>
      opts?.onSuccess?.({ id: "asset-1", path: "/projects/proj-1/assets/images/board-1.png" })
    );
    vi.spyOn(assetHooks, "useUploadAsset").mockReturnValue({ mutate } as any);

    renderWithProviders(
      <ImageUploader projectId="proj-1" boardId="board-1" onUploadComplete={vi.fn()} />
    );

    const file = new File([new Uint8Array([1, 2, 3])], "board.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 1024 * 1024 * 2 }); // 2MB

    const input = screen.getByLabelText(/browse files/i) as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => expect(mutate).toHaveBeenCalled());
    expect(toastMock).toHaveBeenCalled();
  });

  it("rejects unsupported file types", async () => {
    const mutate = vi.fn();
    vi.spyOn(assetHooks, "useUploadAsset").mockReturnValue({ mutate } as any);

    renderWithProviders(
      <ImageUploader projectId="proj-1" boardId="board-1" onUploadComplete={vi.fn()} />
    );

    const file = new File([new Uint8Array([1, 2])], "doc.pdf", { type: "application/pdf" });
    const input = screen.getByLabelText(/browse files/i) as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(mutate).not.toHaveBeenCalled();
    });
  });
});
