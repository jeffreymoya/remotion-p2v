import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AssetCard } from "../asset-card";
import { buildImageAsset } from "@/src/test/factories/asset";

describe("AssetCard upscale status", () => {
  it("renders done status without a manual button", () => {
    render(
      <AssetCard
        asset={buildImageAsset({ upscaleStatus: "done" })}
        onUpscale={vi.fn()}
      />,
    );

    expect(screen.getByText("Upscaled")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /upscale/i }),
    ).not.toBeInTheDocument();
  });

  it("falls back to the legacy upscaled boolean when status is none", () => {
    render(
      <AssetCard
        asset={buildImageAsset({ upscaled: true, upscaleStatus: "none" })}
        onUpscale={vi.fn()}
      />,
    );

    expect(screen.getByText("Upscaled")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /upscale/i }),
    ).not.toBeInTheDocument();
  });

  it("renders queued status without a manual button", () => {
    render(
      <AssetCard
        asset={buildImageAsset({ upscaleStatus: "queued" })}
        onUpscale={vi.fn()}
      />,
    );

    expect(screen.getByText("Upscaling…")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /upscale/i }),
    ).not.toBeInTheDocument();
  });

  it("renders failed status with retry action", async () => {
    const onUpscale = vi.fn();
    render(
      <AssetCard
        asset={buildImageAsset({ upscaleStatus: "failed" })}
        onUpscale={onUpscale}
      />,
    );

    expect(screen.getByText("Upscale failed")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: /retry upscale/i }),
    );
    expect(onUpscale).toHaveBeenCalled();
  });

  it("renders skipped status with force-upscale action and no badge", () => {
    render(
      <AssetCard
        asset={buildImageAsset({ upscaleStatus: "skipped" })}
        onUpscale={vi.fn()}
      />,
    );

    expect(screen.queryByText("Upscaled")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /upscale anyway/i }),
    ).toBeInTheDocument();
  });

  it("renders no status with the default upscale action", () => {
    render(
      <AssetCard
        asset={buildImageAsset({ upscaleStatus: "none" })}
        onUpscale={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /upscale to 8k/i }),
    ).toBeInTheDocument();
  });
});
