import { Script, ScriptSegment } from "@/src/lib/storyflow/types";
import { cn } from "@/src/lib/storyflow/utils";

function formatSeconds(value?: number) {
  if (value === undefined || value === null) return "—";
  return value.toFixed(1).replace(/\.0$/, "");
}

function SegmentCard({ segment }: { segment: ScriptSegment }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Segment {segment.index}</span>
        {segment.estimatedDuration ? (
          <span>{segment.estimatedDuration}s</span>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-100">{segment.text}</p>
      {segment.wordCount ? (
        <div className="mt-2 text-xs text-slate-400">
          {segment.wordCount} words
        </div>
      ) : null}
      {segment.audioUrl ? (
        <div className="mt-3 space-y-1">
          <audio
            controls
            preload="none"
            src={segment.audioUrl}
            className="w-full rounded-md bg-black/40"
          />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Audio • {formatSeconds(segment.actualDuration)}s
            </span>
            <span>
              {segment.timestamps?.length ?? 0} timed words
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ScriptPreview({ script }: { script: Script }) {
  const totalWords = script.segments.reduce(
    (sum, seg) => sum + (seg.wordCount ?? 0),
    0
  );
  const totalDuration = script.segments.reduce(
    (sum, seg) => sum + (seg.estimatedDuration ?? 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{script.title}</h3>
          <p className="text-sm text-slate-400">
            {script.segments.length} segments · {totalWords} words · ~{totalDuration}s
          </p>
        </div>
      </div>

      <div className={cn("space-y-3")}>
        {script.segments.map((segment, idx) => (
          <SegmentCard key={`${segment.index}-${idx}`} segment={segment} />
        ))}
      </div>
    </div>
  );
}
