"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import {
  Asset,
  AssetMapping,
  AssetMappings,
  ScriptSegment,
  SegmentViewport,
} from "@/src/lib/storyflow/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast-provider";
import { useSaveAssetMappings } from "@/src/hooks/queries/use-mappings";
import { normalizeAssetMappings } from "@/src/lib/storyflow/asset-mappings";
import { SegmentViewportEditor } from "@/components/editors/segment-viewport/segment-viewport-editor";

type Props = {
  projectId: string;
  segments: ScriptSegment[];
  assets: Asset[];
  initialMappings: AssetMappings | Record<number, string>;
};

type EditingState = {
  segment: ScriptSegment;
  asset: Asset;
};

export function SimpleAssetMapper({ projectId, segments, assets, initialMappings }: Props) {
  const toast = useToast();
  const [mappings, setMappings] = useState<AssetMappings>(() =>
    normalizeAssetMappings(initialMappings)
  );
  const [editing, setEditing] = useState<EditingState | null>(null);
  const saveMutation = useSaveAssetMappings(projectId);

  useEffect(() => {
    setMappings(normalizeAssetMappings(initialMappings));
  }, [initialMappings]);

  const assetById = useMemo(() => {
    const map = new Map<string, Asset>();
    assets.forEach((a) => map.set(a.id, a));
    return map;
  }, [assets]);

  const handleAssetChange = (index: number, assetId: string) => {
    setMappings((prev) => {
      const next: AssetMappings = { ...prev };
      const existing = next[index];
      if (!assetId) {
        delete next[index];
      } else if (existing && existing.assetId === assetId) {
        // No-op: same asset, preserve any viewport.
      } else {
        // Asset changed — drop any prior viewport since it was framed for a
        // different image.
        next[index] = { assetId };
      }
      return next;
    });
  };

  const handleSaveViewport = (index: number, viewport: SegmentViewport) => {
    setMappings((prev) => {
      const existing = prev[index];
      if (!existing) return prev;
      return { ...prev, [index]: { ...existing, viewport } };
    });
    setEditing(null);
  };

  const handleClearViewport = (index: number) => {
    setMappings((prev) => {
      const existing = prev[index];
      if (!existing) return prev;
      const { viewport: _drop, ...rest } = existing;
      void _drop;
      return { ...prev, [index]: rest };
    });
    setEditing(null);
  };

  const handleSave = () => {
    saveMutation.mutate(mappings, {
      onSuccess: () => {
        toast({ title: "Asset mappings saved", variant: "success" });
      },
      onError: (error: Error) => {
        toast({
          title: "Save error",
          description: error.message || "Unable to save mappings",
          variant: "error",
        });
      },
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-50">Asset-to-Segment Mapping</h3>
          <p className="text-sm text-slate-400">Choose which image backs each script segment.</p>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save Mappings"}
        </Button>
      </div>

      <div className="space-y-3">
        {segments.map((segment) => {
          const mapping: AssetMapping | undefined = mappings[segment.index];
          const selectedAsset = mapping ? assetById.get(mapping.assetId) : undefined;
          const hasViewport = Boolean(mapping?.viewport);

          return (
            <div
              key={segment.index}
              className="rounded border border-slate-800 bg-slate-950/70 p-3 shadow-sm shadow-black/20"
            >
              <div className="flex items-center gap-3">
                <div className="rounded bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-100">
                  #{segment.index + 1}
                </div>
                <div className="flex-1 text-sm text-slate-200 line-clamp-2">{segment.text}</div>
                {hasViewport && (
                  <span className="rounded bg-brand-600/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-200">
                    Custom viewport
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1">
                  <Select
                    value={mapping?.assetId ?? ""}
                    onValueChange={(value) => handleAssetChange(segment.index, value)}
                  >
                    <SelectTrigger className="bg-slate-900 text-slate-100">
                      <SelectValue placeholder="Select image" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.filename}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!selectedAsset}
                  onClick={() =>
                    selectedAsset && setEditing({ segment, asset: selectedAsset })
                  }
                  title={
                    selectedAsset
                      ? "Refine pan/zoom for this segment"
                      : "Select an image first"
                  }
                >
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  Refine viewport
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <SegmentViewportEditor
          open
          segment={editing.segment}
          asset={editing.asset}
          initialViewport={mappings[editing.segment.index]?.viewport}
          onSave={(viewport) => handleSaveViewport(editing.segment.index, viewport)}
          onClear={() => handleClearViewport(editing.segment.index)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
