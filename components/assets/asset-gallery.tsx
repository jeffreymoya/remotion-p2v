"use client";

import { Asset } from "@/src/lib/storyflow/types";
import { AssetCard } from "./asset-card";

type Props = {
  assets: Asset[];
  onDelete?: (id: string) => void;
  onUpscale?: (id: string) => void;
  upscalingIds?: Set<string>;
  onSelectMusic?: (id: string) => void;
  selectedMusicId?: string | null;
};

export function AssetGallery({
  assets,
  onDelete,
  onUpscale,
  upscalingIds,
  onSelectMusic,
  selectedMusicId,
}: Props) {
  if (assets.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
        No assets yet. Upload media to get started.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          onDelete={onDelete ? () => onDelete(asset.id) : undefined}
          onUpscale={onUpscale ? () => onUpscale(asset.id) : undefined}
          isUpscaling={upscalingIds?.has(asset.id)}
          onSelectAsMusic={
            onSelectMusic && asset.type === "MUSIC"
              ? () => onSelectMusic(asset.id)
              : undefined
          }
          isSelectedMusic={selectedMusicId === asset.id}
        />
      ))}
    </div>
  );
}
