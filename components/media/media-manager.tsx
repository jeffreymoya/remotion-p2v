"use client";

import { useMemo, useState } from "react";
import { Asset, AssetType, Script, ScriptSegment } from "@/src/lib/storyflow/types";
import { UploadZone } from "@/components/assets/upload-zone";
import { AssetGallery } from "@/components/assets/asset-gallery";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/src/lib/storyflow/utils";
import { MusicLibrary } from "@/components/assets/music-library";
import { MusicSettings } from "@/components/assets/music-settings";
import { SimpleAssetMapper } from "@/components/editors/asset-mapper/simple-asset-mapper";
import { StockSearch } from "./stock-search";
import {
  useAssets,
  useDeleteAsset,
  useSelectMusicAsset,
  useUpscaleAsset,
} from "@/src/hooks/queries/use-assets";

type Props = {
  projectId: string;
  assets: Asset[];
  script: Script | null;
  initialMappings: Record<number, string>;
  selectedMusicAssetId?: string;
  initialMusicVolume?: number;
};

type MediaTab = "upload" | "stock" | "library" | "mapping";

const TYPE_FILTERS: { key: AssetType | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "IMAGE", label: "Images" },
  { key: "VIDEO", label: "Videos" },
  { key: "MUSIC", label: "Music" },
  { key: "AUDIO", label: "Audio" },
];

export function MediaManager({
  projectId,
  assets: initialAssets,
  script,
  initialMappings,
  selectedMusicAssetId,
  initialMusicVolume = 0.3,
}: Props) {
  const toast = useToast();
  const [tab, setTab] = useState<MediaTab>("upload");
  const [activeType, setActiveType] = useState<AssetType | "ALL">("ALL");
  const [selectedMusicId, setSelectedMusicId] = useState<string | null>(selectedMusicAssetId ?? null);
  const [musicVolume, setMusicVolume] = useState(initialMusicVolume);

  // Use React Query for assets with initialData from RSC
  const { data: assets = initialAssets } = useAssets(projectId);
  const deleteMutation = useDeleteAsset(projectId);
  const upscaleMutation = useUpscaleAsset(projectId);
  const selectMusicMutation = useSelectMusicAsset(projectId);

  const filteredAssets = useMemo(() => {
    if (activeType === "ALL") return assets;
    return assets.filter((asset) => asset.type === activeType);
  }, [assets, activeType]);

  const images = useMemo(() => assets.filter((a) => a.type === "IMAGE"), [assets]);

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
    // React Query cache automatically updated by useUploadAsset hook in UploadZone
    if (activeType !== "ALL" && activeType !== asset.type) {
      setActiveType("ALL");
    }
    if (asset.type === "MUSIC") {
      setSelectedMusicId(asset.id);
    }
  };

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

  const handleSelectMusicAsset = async (assetId: string) => {
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
    // Asset added to cache by MusicLibrary's useSelectMusicTrack mutation
    setSelectedMusicId(asset.id);
    if (activeType !== "ALL" && activeType !== "MUSIC") {
      setActiveType("MUSIC");
    }
    toast({
      title: "Soundtrack selected",
      description: asset.filename,
      variant: "success",
    });
  };

  const handleImportedFromStock = (asset: Asset) => {
    // Asset added to cache by StockSearch's import mutation
    setActiveType("ALL");
    toast({ title: "Added to library", description: asset.filename, variant: "success" });
    setTab("library");
  };

  const renderFilters = (
    <div className="flex flex-wrap items-center gap-2">
      {TYPE_FILTERS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveType(tab.key as AssetType | "ALL")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            activeType === tab.key
              ? "bg-brand-600 text-white shadow shadow-brand-600/30"
              : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const showMapping = tab === "mapping" && script && images.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {["upload", "stock", "library", "mapping"].map((key) => (
          <button
            key={key}
            onClick={() => setTab(key as MediaTab)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-semibold transition",
              tab === key
                ? "bg-brand-600 text-white shadow shadow-brand-600/30"
                : "bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800"
            )}
          >
            {key === "upload" && "Upload"}
            {key === "stock" && "Stock Search"}
            {key === "library" && "Library"}
            {key === "mapping" && "Mapping"}
          </button>
        ))}
      </div>

      {(tab === "upload" || tab === "library") && (
        <div className="space-y-4">
          {renderFilters}

          {tab === "upload" && (
            <>
              <UploadZone
                projectId={projectId}
                assetType={activeType === "ALL" ? "IMAGE" : activeType}
                onUploaded={handleUploaded}
              />
              <p className="text-xs text-slate-400">
                Upload images, video, music, or audio. Uploaded items appear in Library and can be mapped to segments.
              </p>
            </>
          )}

          {tab === "library" && (
            <p className="text-xs text-slate-400">
              Previously uploaded assets for this project. Select Music to set soundtrack.
            </p>
          )}

          {activeType === "MUSIC" ? (
            <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
              <div className="space-y-4">
                <AssetGallery
                  assets={filteredAssets}
                  onDelete={handleDelete}
                  onUpscale={handleUpscale}
                  upscalingIds={new Set(
                    upscaleMutation.isPending && upscaleMutation.variables
                      ? [upscaleMutation.variables]
                      : []
                  )}
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
            <AssetGallery
              assets={filteredAssets}
              onDelete={handleDelete}
              onUpscale={handleUpscale}
              upscalingIds={new Set(
                upscaleMutation.isPending && upscaleMutation.variables
                  ? [upscaleMutation.variables]
                  : []
              )}
              onSelectMusic={handleSelectMusicAsset}
              selectedMusicId={selectedMusicId}
            />
          )}
        </div>
      )}

      {tab === "stock" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Search Pexels for stock images. Add results directly to your project library.
          </p>
          <StockSearch projectId={projectId} onImported={handleImportedFromStock} />
        </div>
      )}

      {showMapping ? (
        <SimpleAssetMapper
          projectId={projectId}
          segments={script!.segments as ScriptSegment[]}
          assets={images}
          initialMappings={initialMappings}
        />
      ) : tab === "mapping" ? (
        <div className="rounded-md border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
          {(!script || images.length === 0) &&
            "Add a script with segments and at least one image to map assets to segments."}
        </div>
      ) : null}
    </div>
  );
}
