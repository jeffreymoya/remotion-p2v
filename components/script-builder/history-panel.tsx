"use client";

import { useMemo, useState } from "react";
import { cn } from "@/src/lib/storyflow/utils";
import { useBlueprintHistory, useDraftHistory } from "@/src/hooks/queries/use-execution-status";

type HistoryItem = {
  id: string;
  version: number;
  event: string;
  createdAt: string;
  snapshot: unknown;
};

interface HistoryPanelProps {
  blueprintId?: string | null;
  draftId?: string | null;
  className?: string;
}

type Tab = "blueprint" | "draft";

export function HistoryPanel({ blueprintId, draftId, className }: HistoryPanelProps) {
  const [tab, setTab] = useState<Tab>("blueprint");

  const {
    data: blueprintHistory = [],
    isLoading: blueprintLoading,
    refetch: refetchBlueprint,
  } = useBlueprintHistory(tab === "blueprint" ? blueprintId ?? null : null);

  const {
    data: draftHistory = [],
    isLoading: draftLoading,
    refetch: refetchDraft,
  } = useDraftHistory(tab === "draft" ? draftId ?? null : null);

  const activeHistory = tab === "blueprint" ? blueprintHistory : draftHistory;
  const loading = tab === "blueprint" ? blueprintLoading : draftLoading;
  const disabled = (tab === "blueprint" && !blueprintId) || (tab === "draft" && !draftId);

  const handleRefresh = () => {
    if (tab === "blueprint") {
      refetchBlueprint();
    } else {
      refetchDraft();
    }
  };

  const handleDownload = (item: HistoryItem) => {
    const blob = new Blob([JSON.stringify(item.snapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tab}-v${item.version}-${item.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const emptyState = useMemo(() => {
    if (loading) return "Loading history…";
    if (disabled) return "History available once this item exists.";
    return "No history captured yet.";
  }, [loading, disabled]);

  return (
    <div className={cn("rounded-lg border border-slate-800 bg-slate-900/50 p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("blueprint")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition",
              tab === "blueprint"
                ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-750"
            )}
          >
            Blueprint History
          </button>
          <button
            onClick={() => setTab("draft")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition",
              tab === "draft"
                ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-750"
            )}
          >
            Draft History
          </button>
        </div>
        <button
          onClick={handleRefresh}
          disabled={disabled || loading}
          className="text-xs font-semibold text-brand-300 hover:text-brand-200 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {activeHistory.length === 0 ? (
          <p className="text-sm text-slate-400">{emptyState}</p>
        ) : (
          activeHistory.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-md border border-slate-800 bg-slate-950/60 p-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-white">
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-200">
                    v{item.version}
                  </span>
                  <span className="text-brand-300">{item.event}</span>
                </div>
                <p className="text-xs text-slate-400">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(item)}
                  className="rounded-md border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-200 hover:border-brand-500 hover:text-brand-200"
                >
                  Download JSON
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
