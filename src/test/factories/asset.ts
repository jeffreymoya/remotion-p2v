import type { Asset, AssetMetadata } from "@/src/lib/storyflow/types";

import { createId, mergeFactory, now } from "./base";

function baseAsset(
  type: Asset["type"],
  overrides: Partial<Asset>,
  metadata: AssetMetadata
): Asset {
  const projectId = overrides.projectId ?? createId("project");

  const defaults: Asset = {
    id: overrides.id ?? createId("asset"),
    projectId,
    type,
    filename: overrides.filename ?? `${type.toLowerCase()}-sample`,
    path:
      overrides.path ??
      `/projects/${projectId}/assets/${type.toLowerCase()}-sample`,
    metadata: overrides.metadata ?? metadata,
    upscaled: overrides.upscaled ?? false,
    upscaledPath: overrides.upscaledPath ?? null,
    createdAt: overrides.createdAt ?? now(),
  };

  return mergeFactory(defaults, overrides);
}

export function buildAsset(overrides: Partial<Asset> = {}): Asset {
  return baseAsset(
    overrides.type ?? "IMAGE",
    overrides,
    overrides.metadata ?? { width: 1920, height: 1080 }
  );
}

export function buildAudioAsset(overrides: Partial<Asset> = {}): Asset {
  return baseAsset(
    "AUDIO",
    { filename: "audio-sample.mp3", ...overrides },
    overrides.metadata ?? { duration: 3.2, format: "mp3" }
  );
}

export function buildImageAsset(overrides: Partial<Asset> = {}): Asset {
  return baseAsset(
    "IMAGE",
    { filename: "image-sample.jpg", ...overrides },
    overrides.metadata ?? { width: 800, height: 600, format: "jpg" }
  );
}
