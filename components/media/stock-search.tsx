"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAssetSearch } from "@/src/hooks/queries/use-asset-search";
import { useImportAsset } from "@/src/hooks/queries/use-assets";
import type { AssetSearchResult } from "@/src/lib/api/assets";

export type StockResult = AssetSearchResult;

type Props = {
  projectId: string;
  onImported: (asset: any) => void;
};

export function StockSearch({ projectId, onImported }: Props) {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [importingId, setImportingId] = useState<string | null>(null);
  // Track import-specific errors separate from query errors
  const [importError, setImportError] = useState<string | null>(null);

  // React Query hook - only triggers when searchQuery is set
  const { data: results = [], isLoading, error } = useAssetSearch(searchQuery);
  const importMutation = useImportAsset(projectId);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchQuery(query.trim());
  };

  const handleImport = async (item: StockResult) => {
    setImportingId(item.id);
    setImportError(null);
    try {
      const asset = await importMutation.mutateAsync({
        projectId,
        url: item.downloadUrl,
        filename: `stock-${item.id}.jpg`,
        type: item.type,
        source: item.source,
      });
      onImported(asset);
      toast({ title: "Imported to library", description: asset.filename, variant: "success" });
    } catch (err: any) {
      setImportError(err?.message || "Import failed");
      toast({ title: "Import error", description: err?.message || "Import failed", variant: "error" });
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stock media (e.g. cinematic city night)"
          className="bg-slate-900 text-slate-100"
          aria-label="Search stock media"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </form>

      {(error || importError) && (
        <p className="text-sm text-amber-300">
          {error instanceof Error ? error.message : importError}
        </p>
      )}
      {searchQuery && results.length === 0 && !isLoading && !error && (
        <p className="text-sm text-amber-300">No results found. Try different keywords.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((item) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60 shadow-sm shadow-black/30"
          >
            <div className="relative aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt="Stock preview"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-300">
              <span className="truncate">{item.photographer ?? "Pexels"}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleImport(item)}
                disabled={importingId === item.id}
              >
                {importingId === item.id ? "Importing..." : "Add to Library"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
