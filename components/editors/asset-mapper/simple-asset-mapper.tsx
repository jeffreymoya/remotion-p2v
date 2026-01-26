"use client";

import { useEffect, useState } from "react";
import { Asset, ScriptSegment } from "@/src/lib/storyflow/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast-provider";
import { useSaveAssetMappings } from "@/src/hooks/queries/use-mappings";

type Props = {
  projectId: string;
  segments: ScriptSegment[];
  assets: Asset[];
  initialMappings: Record<number, string>;
};

export function SimpleAssetMapper({ projectId, segments, assets, initialMappings }: Props) {
  const toast = useToast();
  const [mappings, setMappings] = useState<Record<number, string>>(initialMappings ?? {});
  const saveMutation = useSaveAssetMappings(projectId);

  useEffect(() => {
    setMappings(initialMappings ?? {});
  }, [initialMappings]);

  const handleChange = (index: number, assetId: string) => {
    setMappings((prev) => ({ ...prev, [index]: assetId }));
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
        {segments.map((segment) => (
          <div
            key={segment.index}
            className="rounded border border-slate-800 bg-slate-950/70 p-3 shadow-sm shadow-black/20"
          >
            <div className="flex items-center gap-3">
              <div className="rounded bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-100">
                #{segment.index + 1}
              </div>
              <div className="flex-1 text-sm text-slate-200 line-clamp-2">{segment.text}</div>
            </div>

            <div className="mt-3">
              <Select
                value={mappings[segment.index] ?? ""}
                onValueChange={(value) => handleChange(segment.index, value)}
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
          </div>
        ))}
      </div>
    </div>
  );
}
