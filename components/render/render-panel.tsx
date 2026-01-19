"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, PlayCircle, RefreshCcw, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Render, RenderQuality } from "@/src/lib/storyflow/types";

type Props = {
  projectId: string;
  initialRender: Render | null;
};

const POLL_MS = 2000;

export function RenderPanel({ projectId, initialRender }: Props) {
  const [render, setRender] = useState<Render | null>(initialRender);
  const [isStarting, setIsStarting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isProcessing = render?.status === "PROCESSING";

  useEffect(() => {
    if (!isProcessing) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/render/${render!.id}/status`);
      if (res.ok) {
        const json = await res.json();
        setRender(json);
      }
    }, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isProcessing, render]);

  const startRender = async (quality: RenderQuality) => {
    setIsStarting(true);
    try {
      const res = await fetch("/api/render/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, quality }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to start render");
      setRender(json);
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    } finally {
      setIsStarting(false);
    }
  };

  const progressPct = useMemo(() => Math.round((render?.progress ?? 0) * 100), [render]);

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Step 6 · Render</p>
          <h2 className="text-lg font-semibold text-white">Render & Export</h2>
          <p className="text-sm text-slate-400">Start a server render and monitor progress.</p>
        </div>
        <div className="flex gap-2">
          <Button disabled={isStarting || isProcessing} onClick={() => startRender("DRAFT")}>
            {isStarting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
            Render Draft
          </Button>
          <Button variant="secondary" disabled={isStarting || isProcessing} onClick={() => startRender("PRODUCTION")}>
            <PlayCircle className="mr-2 h-4 w-4" />
            Production
          </Button>
        </div>
      </div>

      {render ? (
        <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <div className="flex items-center gap-2">
              {render.status === "PROCESSING" && <Loader2 className="h-4 w-4 animate-spin text-brand-300" />}
              {render.status === "COMPLETED" && <Download className="h-4 w-4 text-emerald-300" />}
              <span className="font-medium">{render.status}</span>
              <span className="text-xs text-slate-500">{render.quality}</span>
            </div>
            <span className="text-xs text-slate-400">{new Date(render.createdAt).toLocaleString()}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-brand-400 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{progressPct}%</span>
            {render.outputPath && render.status === "COMPLETED" && (
              <a className="text-brand-300 underline" href={`/${render.outputPath}`} download>
                Download MP4
              </a>
            )}
          </div>
          {render.error && <p className="text-xs text-red-400">Error: {render.error}</p>}
          {render.status === "FAILED" && (
            <Button size="sm" variant="outline" onClick={() => startRender(render.quality)}>
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
