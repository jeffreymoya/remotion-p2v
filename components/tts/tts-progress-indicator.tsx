"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle, Volume2 } from "lucide-react";
import { cn } from "@/src/lib/storyflow/utils";

type ProgressEvent = {
  type: "progress" | "segment-start" | "segment-complete" | "complete" | "error";
  completed?: number;
  total?: number;
  message?: string;
  segmentIndex?: number;
  text?: string;
  audioUrl?: string;
  duration?: number;
};

type Props = {
  projectId: string;
  isGenerating: boolean;
  onComplete?: () => void;
  onError?: (error: string) => void;
};

export function TTSProgressIndicator({ projectId, isGenerating, onComplete, onError }: Props) {
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [currentSegment, setCurrentSegment] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "generating" | "complete" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isGenerating) {
      return;
    }

    setStatus("generating");
    setProgress({ completed: 0, total: 0 });
    setCurrentSegment(null);
    setMessage("Connecting...");

    const eventSource = new EventSource(
      `/api/tts/generate-all?projectId=${projectId}&stream=true`,
      {
        withCredentials: false,
      }
    );

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressEvent = JSON.parse(event.data);

        switch (data.type) {
          case "progress":
            if (data.completed !== undefined && data.total !== undefined) {
              setProgress({ completed: data.completed, total: data.total });
            }
            if (data.message) {
              setMessage(data.message);
            }
            break;

          case "segment-start":
            if (data.segmentIndex !== undefined) {
              setCurrentSegment(data.segmentIndex);
              setMessage(`Generating segment ${data.segmentIndex + 1}...`);
            }
            break;

          case "segment-complete":
            setCurrentSegment(null);
            break;

          case "complete":
            setStatus("complete");
            setMessage("TTS generation complete!");
            setCurrentSegment(null);
            eventSource.close();
            onComplete?.();
            break;

          case "error":
            setStatus("error");
            setMessage(data.message || "Generation failed");
            eventSource.close();
            onError?.(data.message || "Unknown error");
            break;
        }
      } catch (error) {
        console.error("[TTSProgressIndicator] Failed to parse SSE message:", error);
      }
    };

    eventSource.onerror = () => {
      setStatus("error");
      setMessage("Connection lost");
      eventSource.close();
      onError?.("Connection error");
    };

    return () => {
      eventSource.close();
    };
  }, [isGenerating, projectId, onComplete, onError]);

  if (!isGenerating && status === "idle") {
    return null;
  }

  const progressPercent =
    progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
      <div className="flex items-center gap-3">
        {status === "generating" && (
          <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
        )}
        {status === "complete" && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
        {status === "error" && <XCircle className="h-5 w-5 text-red-400" />}
        {status === "idle" && <Volume2 className="h-5 w-5 text-slate-400" />}

        <div className="flex-1">
          <p className="text-sm font-semibold text-white">TTS Generation</p>
          <p className="text-xs text-slate-400">{message}</p>
        </div>

        {status === "generating" && (
          <span className="font-mono text-sm text-brand-300">
            {progressPercent}%
          </span>
        )}
      </div>

      {status === "generating" && progress.total > 0 && (
        <div className="space-y-2">
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full bg-brand-500 transition-all duration-300",
                currentSegment !== null && "animate-pulse"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {progress.completed} of {progress.total} segments
            </span>
            {currentSegment !== null && (
              <span className="text-brand-400">Segment {currentSegment + 1}</span>
            )}
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-lg border border-red-600/50 bg-red-500/10 p-3 text-sm text-red-100">
          {message}
        </div>
      )}
    </div>
  );
}
