"use client";

import { useEffect, useMemo, useState } from "react";
import { Asset, AssetType } from "@/src/lib/storyflow/types";
import { UploadZone } from "./upload-zone";
import { AssetGallery } from "./asset-gallery";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/src/lib/storyflow/utils";
import { MusicLibrary } from "./music-library";
import { MusicSettings } from "./music-settings";

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
  assets,
  selectedMusicAssetId,
  initialMusicVolume = 0.3,
}: Props) {
  const [activeTab, setActiveTab] = useState<AssetType | "ALL">("ALL");
  const [items, setItems] = useState<Asset[]>(assets);
  const [upscaling, setUpscaling] = useState<Set<string>>(new Set());
  const [selectedMusicId, setSelectedMusicId] = useState<string | null>(
    selectedMusicAssetId ?? null
  );
  const [musicVolume, setMusicVolume] = useState(initialMusicVolume);
  const toast = useToast();

  useEffect(() => {
    setSelectedMusicId(selectedMusicAssetId ?? null);
  }, [selectedMusicAssetId]);

  const filtered = useMemo(() => {
    if (activeTab === "ALL") return items;
    return items.filter((asset) => asset.type === activeTab);
  }, [items, activeTab]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Delete failed");
      }
      setItems((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Asset deleted", variant: "success" });
    } catch (error: any) {
      toast({
        title: "Delete error",
        description: error?.message || "Unable to delete asset",
        variant: "error",
      });
    }
  };

  const handleUploaded = (asset: Asset) => {
    setItems((prev) => [asset, ...prev]);
    if (activeTab !== "ALL" && activeTab !== asset.type) {
      setActiveTab("ALL");
    }
  };

  const uploadType: AssetType =
    activeTab === "ALL" ? "IMAGE" : activeTab; // default to images when "All"

  const handleUpscale = async (id: string) => {
    setUpscaling((prev) => new Set(prev).add(id));
    try {
      const res = await fetch("/api/assets/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: id }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Upscale failed");
      }

      const { asset } = await res.json();
      setItems((prev) => prev.map((item) => (item.id === id ? asset : item)));
      toast({
        title: "Image upscaled",
        description: "Replaced with 8K version",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Upscale error",
        description: error?.message || "Unable to upscale image",
        variant: "error",
      });
    } finally {
      setUpscaling((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleSelectMusicAsset = async (assetId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/music`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to set soundtrack");
      }
      setSelectedMusicId(assetId);
      toast({ title: "Soundtrack selected", variant: "success" });
    } catch (error: any) {
      toast({
        title: "Music selection error",
        description: error?.message || "Unable to set soundtrack",
        variant: "error",
      });
    }
  };

  const handleLibrarySelected = (asset: Asset) => {
    setItems((prev) => [asset, ...prev.filter((item) => item.id !== asset.id)]);
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
              upscalingIds={upscaling}
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
            upscalingIds={upscaling}
            onSelectMusic={handleSelectMusicAsset}
            selectedMusicId={selectedMusicId}
          />
        </>
      )}
    </div>
  );
}
