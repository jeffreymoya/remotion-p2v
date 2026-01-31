"use client";

import { useMemo, useState } from "react";
import { PlayCircle, Download, RefreshCcw, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Render, RenderQuality } from "@/src/lib/storyflow/types";
import { useRenderStatus } from "@/src/hooks/queries/use-render";
import { startRender } from "@/src/lib/api/render";
import { useBackgroundTask } from "@/src/hooks/use-background-task";

type Props = {
  projectId: string;
  initialRender: Render | null;
};

export function RenderPanel({ projectId, initialRender }: Props) {
  const [renderId, setRenderId] = useState<string | null>(initialRender?.id ?? null);
  const { runTask, isTaskRunning } = useBackgroundTask();

  // React Query hooks
  const { data: render } = useRenderStatus(renderId);

  const isProcessing = render?.status === "PROCESSING";
  const displayRender = render ?? initialRender;

  const handleStartRender = async (quality: RenderQuality) => {
    await runTask(
      { projectId, category: "video-rendering", name: `Rendering ${quality.toLowerCase()} video`, icon: "film" },
      async ({ signal }) => {
        if (signal.aborted) throw new Error("Cancelled");

        const data = await startRender(projectId, quality);

        if (signal.aborted) throw new Error("Cancelled");

        setRenderId(data.id);
        return data;
      }
    );
  };

  const progressPct = useMemo(
    () => Math.round((displayRender?.progress ?? 0) * 100),
    [displayRender]
  );

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Step 5 · Render</p>
          <h2 className="text-lg font-semibold text-white">Render & Export</h2>
          <p className="text-sm text-slate-400">
            Kick off a server render, monitor progress, and download outputs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            disabled={isProcessing || isTaskRunning("video-rendering", projectId)}
            onClick={() => handleStartRender("DRAFT")}
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            Render Draft
          </Button>
          <Button
            variant="secondary"
            disabled={isProcessing || isTaskRunning("video-rendering", projectId)}
            onClick={() => handleStartRender("PRODUCTION")}
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            Production
          </Button>
        </div>
      </div>

      {displayRender ? (
        <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <div className="flex items-center gap-2">
              {displayRender.status === "PROCESSING" && <Loader2 className="h-4 w-4 animate-spin text-brand-300" />}
              {displayRender.status === "COMPLETED" && <Download className="h-4 w-4 text-emerald-300" />}
              <span className="font-medium">{displayRender.status}</span>
              <span className="text-xs text-slate-500">{displayRender.quality}</span>
            </div>
            <span className="text-xs text-slate-400">{new Date(displayRender.createdAt).toLocaleString()}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-brand-400 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{progressPct}%</span>
            {displayRender.outputPath && displayRender.status === "COMPLETED" && (
              <a className="text-brand-300 underline" href={`/${displayRender.outputPath}`} download>
                Download MP4
              </a>
            )}
          </div>
          {render?.error && <p className="text-xs text-red-400">Error: {render.error}</p>}
          {render?.status === "FAILED" && (
            <Button size="sm" variant="outline" onClick={() => handleStartRender(render.quality)}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Retry
            </Button>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No render has been started yet.</p>
      )}
    </div>
  );
}
