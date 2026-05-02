"use client";

import { useEffect, useRef, useState } from "react";
import { clamp, viewportToTransform } from "@/src/lib/viewport-utils";
import type { SegmentKeyframe } from "@/src/lib/storyflow/types";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const WHEEL_ZOOM_STEP = 0.0015;
const CTRL_WHEEL_ZOOM_STEP = 0.0005;

type Props = {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  value: SegmentKeyframe;
  onChange: (next: SegmentKeyframe) => void;
  /** Render aspect ratio (width / height); 16/9 by default. */
  aspectRatio?: number;
};

/**
 * Drag-to-pan / wheel-to-zoom canvas. Renders the asset image inside a 16:9
 * framing box using the same `viewportToTransform()` math as the renderer,
 * so on-canvas behavior matches the final video frame.
 */
export function ViewportCanvas({
  imageUrl,
  imageWidth,
  imageHeight,
  value,
  onChange,
  aspectRatio = 16 / 9,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [dragging, setDragging] = useState(false);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startCenterX: number;
    startCenterY: number;
  } | null>(null);

  // Measure the framing box so transform math has real pixel sizes.
  useEffect(() => {
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setBox({ width: rect.width, height: rect.height });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startCenterX: value.centerX,
      startCenterY: value.centerY,
    };
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (box.width === 0 || box.height === 0) return;

    // Map screen-space drag delta back to normalized centerX/centerY.
    // The image is scaled by `transform.scale`; one pixel of drag corresponds
    // to (1 / scaledImageDimension) of normalized image space.
    const baseScale = Math.max(
      box.width / imageWidth,
      box.height / imageHeight
    );
    const scale = baseScale * value.zoom;
    const scaledW = imageWidth * scale;
    const scaledH = imageHeight * scale;
    if (scaledW <= 0 || scaledH <= 0) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    const nextCenterX = clamp(drag.startCenterX - dx / scaledW, 0, 1);
    const nextCenterY = clamp(drag.startCenterY - dy / scaledH, 0, 1);
    onChange({ ...value, centerX: nextCenterX, centerY: nextCenterY });
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag) return;
    if (e.currentTarget.hasPointerCapture(drag.pointerId)) {
      e.currentTarget.releasePointerCapture(drag.pointerId);
    }
    dragStateRef.current = null;
    setDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const step = e.ctrlKey ? CTRL_WHEEL_ZOOM_STEP : WHEEL_ZOOM_STEP;
    const next = clamp(value.zoom - e.deltaY * step, MIN_ZOOM, MAX_ZOOM);
    if (next === value.zoom) return;
    onChange({ ...value, zoom: next });
  };

  const transform =
    box.width > 0 && box.height > 0
      ? viewportToTransform(
          { centerX: value.centerX, centerY: value.centerY, zoom: value.zoom },
          imageWidth,
          imageHeight,
          box.width,
          box.height
        )
      : null;

  return (
    <div className="space-y-2">
      <div
        ref={wrapperRef}
        className="relative w-full overflow-hidden rounded border border-slate-800 bg-black select-none"
        style={{ aspectRatio: String(aspectRatio), cursor: dragging ? "grabbing" : "grab" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={handleWheel}
      >
        <img
          src={imageUrl}
          alt=""
          draggable={false}
          style={{
            width: imageWidth,
            height: imageHeight,
            position: "absolute",
            top: 0,
            left: 0,
            transformOrigin: "0 0",
            transform: transform
              ? `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`
              : undefined,
            pointerEvents: "none",
          }}
        />
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <label className="flex flex-1 items-center gap-2">
          Zoom
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.05}
            value={value.zoom}
            onChange={(e) =>
              onChange({ ...value, zoom: clamp(Number(e.target.value), MIN_ZOOM, MAX_ZOOM) })
            }
            className="w-full accent-brand-600"
          />
          <span className="w-10 text-right tabular-nums text-slate-300">
            {value.zoom.toFixed(2)}×
          </span>
        </label>
      </div>
    </div>
  );
}
