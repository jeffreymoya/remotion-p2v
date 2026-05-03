"use client";

import { AlertTriangle, Loader2, Sparkles, X } from "lucide-react";
import { Asset } from "@/src/lib/storyflow/types";
import { cn } from "@/src/lib/storyflow/utils";

type Props = {
  asset: Asset;
  onDelete?: () => void;
  onUpscale?: () => void;
  isUpscaling?: boolean;
  onSelectAsMusic?: () => void;
  isSelectedMusic?: boolean;
};

const typeLabels: Record<Asset["type"], string> = {
  IMAGE: "Image",
  VIDEO: "Video",
  AUDIO: "Audio",
  MUSIC: "Music",
};

function formatBytes(size?: number | null) {
  if (!size) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value = value / 1024;
    idx++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[idx]}`;
}

function formatDuration(seconds?: number | null) {
  if (seconds == null) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function AssetCard({
  asset,
  onDelete,
  onUpscale,
  isUpscaling,
  onSelectAsMusic,
  isSelectedMusic,
}: Props) {
  const meta = asset.metadata;
  const storedUpscaleStatus = asset.upscaleStatus ?? "none";
  const effectiveUpscaleStatus =
    storedUpscaleStatus !== "none"
      ? storedUpscaleStatus
      : asset.upscaled
        ? "done"
        : "none";
  const visibleUpscaleStatus = isUpscaling ? "queued" : effectiveUpscaleStatus;
  const showUpscaleBadge =
    asset.type === "IMAGE" &&
    ["done", "queued", "failed"].includes(visibleUpscaleStatus);
  const showUpscaleButton =
    asset.type === "IMAGE" &&
    !!onUpscale &&
    visibleUpscaleStatus !== "done" &&
    visibleUpscaleStatus !== "queued";
  const upscaleButtonLabel =
    visibleUpscaleStatus === "failed"
      ? "Retry upscale"
      : visibleUpscaleStatus === "skipped"
        ? "Upscale anyway"
        : "Upscale to 8K";

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-md">
      <div className="absolute left-2 top-2 z-10 rounded-full bg-slate-900/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-100">
        {typeLabels[asset.type]}
      </div>
      {showUpscaleBadge && (
        <div
          className={cn(
            "absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide shadow",
            visibleUpscaleStatus === "done" &&
              "bg-emerald-500/80 text-emerald-50",
            visibleUpscaleStatus === "queued" &&
              "bg-amber-500/80 text-amber-950",
            visibleUpscaleStatus === "failed" && "bg-rose-500/85 text-rose-50",
          )}
        >
          {visibleUpscaleStatus === "queued" ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Upscaling…
            </>
          ) : visibleUpscaleStatus === "failed" ? (
            <>
              <AlertTriangle className="h-3 w-3" />
              Upscale failed
            </>
          ) : (
            "Upscaled"
          )}
        </div>
      )}

      {onDelete && (
        <button
          onClick={onDelete}
          className={cn(
            "absolute right-2 z-20 rounded-full bg-slate-900/80 p-1 text-slate-200 opacity-0 shadow group-hover:opacity-100",
            showUpscaleBadge ? "top-9" : "top-2",
          )}
          title="Delete asset"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div
        className={cn(
          "aspect-video bg-slate-950/60",
          asset.type === "AUDIO" || asset.type === "MUSIC"
            ? "flex items-center"
            : "",
        )}
      >
        {asset.type === "IMAGE" ? (
          <img
            src={asset.upscaledPath || asset.path}
            alt={asset.filename}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : asset.type === "VIDEO" ? (
          <video
            src={asset.path}
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex w-full items-center gap-3 px-3">
            <div className="h-10 w-10 rounded-full bg-brand-600/20 text-brand-200 grid place-items-center">
              ♪
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white truncate">
                {asset.filename}
              </p>
              <p className="text-xs text-slate-400">
                {formatDuration(meta?.duration)}{" "}
                {meta?.bitrate
                  ? `• ${Math.round(meta.bitrate / 1000)} kbps`
                  : ""}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-800 px-3 py-2 text-xs text-slate-300">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-slate-100 truncate">
            {asset.filename}
          </span>
          <span className="text-slate-400">{formatBytes(meta?.size)}</span>
        </div>
        {asset.type === "IMAGE" && meta?.width && meta?.height ? (
          <p className="mt-1 text-slate-400">
            {meta.width}×{meta.height}{" "}
            {visibleUpscaleStatus === "done" ? "• upscaled" : ""}
          </p>
        ) : null}
        {asset.type === "VIDEO" && meta?.duration ? (
          <p className="mt-1 text-slate-400">
            {formatDuration(meta.duration)}{" "}
            {meta.width && meta.height ? `• ${meta.width}×${meta.height}` : ""}
          </p>
        ) : null}
        {showUpscaleButton ? (
          <div className="mt-2 flex items-center justify-end">
            <button
              onClick={onUpscale}
              disabled={isUpscaling}
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {isUpscaling ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Upscaling…
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  {upscaleButtonLabel}
                </>
              )}
            </button>
          </div>
        ) : null}
        {asset.type === "MUSIC" && onSelectAsMusic ? (
          <div className="mt-2 flex items-center justify-end">
            <button
              onClick={onSelectAsMusic}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold transition",
                isSelectedMusic
                  ? "bg-brand-600 text-white"
                  : "border border-slate-700 bg-slate-900 text-slate-100 hover:border-brand-500",
              )}
            >
              {isSelectedMusic ? "Soundtrack selected" : "Use as soundtrack"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
