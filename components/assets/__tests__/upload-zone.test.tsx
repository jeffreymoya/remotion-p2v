import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { UploadZone } from "../upload-zone";
import { Asset } from "@/src/lib/storyflow/types";

const toastSpy = vi.fn();
const axiosPost = vi.fn();

vi.mock("@/components/ui/toast-provider", () => ({
  useToast: () => toastSpy,
}));

vi.mock("axios", () => ({
  default: { post: (...args: unknown[]) => axiosPost(...args) },
}));

const uploadedAsset: Asset = {
  id: "asset-1",
  projectId: "proj-1",
  type: "IMAGE",
  filename: "file.jpg",
  path: "/projects/proj-1/assets/images/file.jpg",
  createdAt: new Date(),
};

describe("UploadZone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads a file, calls onUploaded, and shows success toast", async () => {
    axiosPost.mockResolvedValue({
      data: { asset: uploadedAsset },
    });
    const handleUploaded = vi.fn();
    render(<UploadZone projectId="proj-1" assetType="IMAGE" onUploaded={handleUploaded} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).toBeTruthy();
    const file = new File([new Uint8Array([1, 2])], "test.jpg", { type: "image/jpeg" });
    await userEvent.upload(fileInput!, file);

    await waitFor(() => expect(handleUploaded).toHaveBeenCalledWith(uploadedAsset));
    expect(axiosPost).toHaveBeenCalledWith(
      "/api/assets/upload",
      expect.any(FormData),
      expect.objectContaining({ onUploadProgress: expect.any(Function) })
    );
    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Upload complete", variant: "success" })
    );
  });

  it("shows error toast and does not call onUploaded when upload fails", async () => {
    axiosPost.mockRejectedValue(new Error("network down"));
    const handleUploaded = vi.fn();
    render(<UploadZone projectId="proj-1" assetType="IMAGE" onUploaded={handleUploaded} />);

    const fileInput = (document.querySelector('input[type=\"file\"]') as HTMLInputElement)!;
    const file = new File([new Uint8Array([1])], "bad.jpg", { type: "image/jpeg" });
    await userEvent.upload(fileInput, file);

    await waitFor(() => expect(toastSpy).toHaveBeenCalled());
    expect(handleUploaded).not.toHaveBeenCalled();
    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Upload error", variant: "error" })
    );
  });
});
