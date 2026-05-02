"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ViewportCanvas } from "./viewport-canvas";
import {
  EASING_FUNCTIONS,
  clamp,
  type EasingFunctionName,
} from "@/src/lib/viewport-utils";
import type {
  Asset,
  ScriptSegment,
  SegmentKeyframe,
  SegmentViewport,
  SegmentViewportEasing,
} from "@/src/lib/storyflow/types";

const DEFAULT_KEYFRAME: SegmentKeyframe = { centerX: 0.5, centerY: 0.5, zoom: 1 };
const DEFAULT_EASING: SegmentViewportEasing = "easeInOut";
const PREVIEW_DURATION_MS = 3000;

const EASING_OPTIONS: { value: SegmentViewportEasing; label: string }[] = [
  { value: "linear", label: "Linear" },
  { value: "easeIn", label: "Ease In" },
  { value: "easeOut", label: "Ease Out" },
  { value: "easeInOut", label: "Ease In/Out" },
];

type Slot = "start" | "end";

type Props = {
  open: boolean;
  segment: ScriptSegment;
  asset: Asset;
  initialViewport?: SegmentViewport;
  onSave: (viewport: SegmentViewport) => void;
  onClear: () => void;
  onClose: () => void;
};

export function SegmentViewportEditor({
  open,
  segment,
  asset,
  initialViewport,
  onSave,
  onClear,
  onClose,
}: Props) {
  const [start, setStart] = useState<SegmentKeyframe>(
    initialViewport?.start ?? DEFAULT_KEYFRAME
  );
  const [end, setEnd] = useState<SegmentKeyframe>(
    initialViewport?.end ?? DEFAULT_KEYFRAME
  );
  const [easing, setEasing] = useState<SegmentViewportEasing>(
    initialViewport?.easing ?? DEFAULT_EASING
  );
  const [activeSlot, setActiveSlot] = useState<Slot>("start");
  const [previewProgress, setPreviewProgress] = useState<number | null>(null);
  const previewRafRef = useRef<number | null>(null);

  // Reset local state when the dialog reopens against a fresh segment/asset.
  useEffect(() => {
    if (!open) return;
    setStart(initialViewport?.start ?? DEFAULT_KEYFRAME);
    setEnd(initialViewport?.end ?? DEFAULT_KEYFRAME);
    setEasing(initialViewport?.easing ?? DEFAULT_EASING);
    setActiveSlot("start");
    setPreviewProgress(null);
  }, [open, initialViewport, segment.index, asset.id]);

  useEffect(
    () => () => {
      if (previewRafRef.current !== null) {
        cancelAnimationFrame(previewRafRef.current);
      }
    },
    []
  );

  const imageWidth = asset.metadata?.width ?? 1920;
  const imageHeight = asset.metadata?.height ?? 1080;
  const imageUrl = asset.path;

  const activeValue = activeSlot === "start" ? start : end;
  const setActiveValue = (next: SegmentKeyframe) => {
    if (previewProgress !== null) return; // disable edits during preview playback
    if (activeSlot === "start") setStart(next);
    else setEnd(next);
  };

  const startPreview = () => {
    if (previewRafRef.current !== null) {
      cancelAnimationFrame(previewRafRef.current);
    }
    const startedAt = performance.now();
    const easingFn =
      EASING_FUNCTIONS[easing as EasingFunctionName] ?? EASING_FUNCTIONS.easeInOut;
    const tick = () => {
      const elapsed = performance.now() - startedAt;
      const t = clamp(elapsed / PREVIEW_DURATION_MS, 0, 1);
      setPreviewProgress(t);
      if (t < 1) {
        previewRafRef.current = requestAnimationFrame(tick);
      } else {
        previewRafRef.current = null;
        // Hold last frame briefly then exit preview mode.
        setTimeout(() => setPreviewProgress(null), 150);
      }
    };
    previewRafRef.current = requestAnimationFrame(tick);
    void easingFn; // referenced inside displayValue derivation below
  };

  const displayValue: SegmentKeyframe = (() => {
    if (previewProgress === null) return activeValue;
    const easingFn =
      EASING_FUNCTIONS[easing as EasingFunctionName] ?? EASING_FUNCTIONS.easeInOut;
    const t = easingFn(previewProgress);
    return {
      centerX: start.centerX + (end.centerX - start.centerX) * t,
      centerY: start.centerY + (end.centerY - start.centerY) * t,
      zoom: start.zoom + (end.zoom - start.zoom) * t,
    };
  })();

  const handleSave = () => {
    onSave({ start, end, easing });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Refine viewport — segment #{segment.index + 1}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr,220px]">
          <div className="space-y-3">
            <ViewportCanvas
              imageUrl={imageUrl}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              value={displayValue}
              onChange={setActiveValue}
            />
            <p className="line-clamp-3 text-xs text-slate-400">{segment.text}</p>
          </div>

          <div className="space-y-3">
            <SlotPicker
              activeSlot={activeSlot}
              onChange={setActiveSlot}
              start={start}
              end={end}
              disabled={previewProgress !== null}
            />

            <label className="block text-xs text-slate-400">
              Easing
              <select
                value={easing}
                onChange={(e) =>
                  setEasing(e.target.value as SegmentViewportEasing)
                }
                disabled={previewProgress !== null}
                className="mt-1 w-full rounded border border-slate-800 bg-slate-900 px-2 py-1 text-sm text-slate-100 disabled:opacity-50"
              >
                {EASING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <Button
              type="button"
              variant="secondary"
              onClick={startPreview}
              disabled={previewProgress !== null}
              className="w-full"
            >
              {previewProgress !== null ? "Previewing…" : "Preview animation"}
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="ghost" onClick={onClear}>
            Clear viewport
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save viewport
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SlotPicker({
  activeSlot,
  onChange,
  start,
  end,
  disabled,
}: {
  activeSlot: Slot;
  onChange: (slot: Slot) => void;
  start: SegmentKeyframe;
  end: SegmentKeyframe;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <SlotButton
        label="Start"
        keyframe={start}
        active={activeSlot === "start"}
        onClick={() => !disabled && onChange("start")}
      />
      <SlotButton
        label="End"
        keyframe={end}
        active={activeSlot === "end"}
        onClick={() => !disabled && onChange("end")}
      />
    </div>
  );
}

function SlotButton({
  label,
  keyframe,
  active,
  onClick,
}: {
  label: string;
  keyframe: SegmentKeyframe;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-2 py-2 text-left text-xs transition ${
        active
          ? "border-brand-500 bg-brand-600/20 text-slate-50"
          : "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 tabular-nums text-slate-200">
        ({keyframe.centerX.toFixed(2)}, {keyframe.centerY.toFixed(2)}) ·{" "}
        {keyframe.zoom.toFixed(2)}×
      </div>
    </button>
  );
}
