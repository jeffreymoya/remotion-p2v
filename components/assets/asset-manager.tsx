"use client";

import { useEffect, useMemo, useState } from "react";
import { Asset, AssetType } from "@/src/lib/storyflow/types";
import { UploadZone } from "./upload-zone";
import { AssetGallery } from "./asset-gallery";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/src/lib/storyflow/utils";
import { MusicLibrary } from "./music-library";
import { MusicSettings } from "./music-settings";
import {
  useAssets,
  useDeleteAsset,
  useUpscaleAsset,
  useSelectMusicAsset,
} from "@/src/hooks/queries/use-assets";

const TABS: { key: AssetType | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "IMAGE", label: "Images" },
  { key: "VIDEO", label: "Videos" },
  { key: "MUSIC", label: "Music" },
  { key: "AUDIO", label: "Audio" },
];

type Props = {
  projectId: string;
  assets: Asset[];
  selectedMusicAssetId?: string;
  initialMusicVolume?: number;
};

export function AssetManager({
  projectId,
  assets: initialAssets,
  selectedMusicAssetId,
  initialMusicVolume = 0.3,
}: Props) {
  const [activeTab, setActiveTab] = useState<AssetType | "ALL">("ALL");
  const [selectedMusicId, setSelectedMusicId] = useState<string | null>(
    selectedMusicAssetId ?? null
  );
  const [musicVolume, setMusicVolume] = useState(initialMusicVolume);
  const toast = useToast();

  // React Query hooks
  const { data: items = initialAssets } = useAssets(projectId);
  const deleteMutation = useDeleteAsset(projectId);
  const upscaleMutation = useUpscaleAsset(projectId);
  const selectMusicMutation = useSelectMusicAsset(projectId);

  useEffect(() => {
    setSelectedMusicId(selectedMusicAssetId ?? null);
  }, [selectedMusicAssetId]);

  const filtered = useMemo(() => {
    if (activeTab === "ALL") return items;
    return items.filter((asset) => asset.type === activeTab);
  }, [items, activeTab]);

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: "Asset deleted", variant: "success" });
      },
      onError: (error) => {
        toast({
          title: "Delete error",
          description: error.message || "Unable to delete asset",
          variant: "error",
        });
      },
    });
  };

  const handleUploaded = (asset: Asset) => {
    // Upload mutation already updates cache, just handle UI state
    if (activeTab !== "ALL" && activeTab !== asset.type) {
      setActiveTab("ALL");
    }
  };

  const uploadType: AssetType =
    activeTab === "ALL" ? "IMAGE" : activeTab; // default to images when "All"

  const handleUpscale = (id: string) => {
    upscaleMutation.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Image upscaled",
          description: "Replaced with 8K version",
          variant: "success",
        });
      },
      onError: (error) => {
        toast({
          title: "Upscale error",
          description: error.message || "Unable to upscale image",
          variant: "error",
        });
      },
    });
  };

  const handleSelectMusicAsset = (assetId: string) => {
    selectMusicMutation.mutate(assetId, {
      onSuccess: () => {
        setSelectedMusicId(assetId);
        toast({ title: "Soundtrack selected", variant: "success" });
      },
      onError: (error) => {
        toast({
          title: "Music selection error",
          description: error.message || "Unable to set soundtrack",
          variant: "error",
        });
      },
    });
  };

  const handleLibrarySelected = (asset: Asset) => {
    // Music library already handles asset creation and selection
    // Just update local UI state
    setSelectedMusicId(asset.id);
    if (activeTab !== "ALL" && activeTab !== "MUSIC") {
      setActiveTab("MUSIC");
    }
    toast({
      title: "Soundtrack selected",
      description: asset.filename,
      variant: "success",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as AssetType | "ALL")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              activeTab === tab.key
                ? "bg-brand-600 text-white shadow shadow-brand-600/30"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "MUSIC" ? (
        <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          <div className="space-y-4">
            <UploadZone projectId={projectId} assetType="MUSIC" onUploaded={handleUploaded} />
            <AssetGallery
              assets={filtered}
              onDelete={handleDelete}
              onUpscale={handleUpscale}
              upscalingIds={
                new Set(
                  upscaleMutation.isPending && upscaleMutation.variables
                    ? [upscaleMutation.variables]
                    : []
                )
              }
              onSelectMusic={handleSelectMusicAsset}
              selectedMusicId={selectedMusicId}
            />
          </div>
          <div className="space-y-4">
            <MusicLibrary
              projectId={projectId}
              selectedAssetId={selectedMusicId}
              onSelected={handleLibrarySelected}
            />
            <MusicSettings
              projectId={projectId}
              selectedAssetId={selectedMusicId}
              initialVolume={musicVolume}
              onVolumeChange={setMusicVolume}
            />
          </div>
        </div>
      ) : (
        <>
          <UploadZone
            projectId={projectId}
            assetType={uploadType}
            onUploaded={handleUploaded}
          />

          <AssetGallery
            assets={filtered}
            onDelete={handleDelete}
            onUpscale={handleUpscale}
            upscalingIds={
              new Set(
                upscaleMutation.isPending && upscaleMutation.variables
                  ? [upscaleMutation.variables]
                  : []
              )
            }
            onSelectMusic={handleSelectMusicAsset}
            selectedMusicId={selectedMusicId}
          />
        </>
      )}
    </div>
  );
}
