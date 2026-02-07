"use client";

import { useState, useRef, useEffect } from "react";
import { ViewportAnimation } from "@/src/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/src/lib/storyflow/utils";
import { FPS } from "@/src/lib/constants";

interface ViewportPreviewProps {
  projectId: string;
  imagePath: string;
  viewportAnimation: ViewportAnimation;
  totalDurationMs: number;
  className?: string;
}

export function ViewportPreview({
  projectId,
  imagePath,
  viewportAnimation,
  totalDurationMs,
  className,
}: ViewportPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const imageRef = useRef<HTMLImageElement | undefined>(undefined);
  const startTimeRef = useRef<number>(0);

  // Load the board image
  useEffect(() => {
    const img = new Image();
    img.src = `/projects/${projectId}/${imagePath}`;
    img.onload = () => {
      imageRef.current = img;
      renderFrame(0);
    };
  }, [projectId, imagePath]);

  // Helper to convert frame to time in ms
  const frameToMs = (frame: number) => (frame / FPS) * 1000;

  // Calculate viewport position at a given time
  const calculateViewport = (timeMs: number) => {
    if (!viewportAnimation || !viewportAnimation.keyframes || viewportAnimation.keyframes.length === 0) {
      return { x: 0.5, y: 0.5, scale: 1 };
    }

    const keyframes = viewportAnimation.keyframes;

    // Find the two keyframes to interpolate between
    let beforeIdx = 0;
    let afterIdx = 0;

    for (let i = 0; i < keyframes.length; i++) {
      const kfTimeMs = frameToMs(keyframes[i].frameStart);
      if (kfTimeMs <= timeMs) {
        beforeIdx = i;
      }
      if (kfTimeMs >= timeMs) {
        afterIdx = i;
        break;
      }
    }

    if (beforeIdx === afterIdx) {
      // Exact match or at boundary
      const kf = keyframes[beforeIdx];
      return {
        x: kf.viewport.centerX,
        y: kf.viewport.centerY,
        scale: kf.viewport.zoom,
      };
    }

    // Interpolate between keyframes
    const before = keyframes[beforeIdx];
    const after = keyframes[afterIdx];
    const beforeTimeMs = frameToMs(before.frameStart);
    const afterTimeMs = frameToMs(after.frameStart);
    const timeDelta = afterTimeMs - beforeTimeMs;
    const progress = timeDelta > 0 ? (timeMs - beforeTimeMs) / timeDelta : 0;

    // Apply easing (simple ease-in-out)
    const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    return {
      x: before.viewport.centerX + (after.viewport.centerX - before.viewport.centerX) * eased,
      y: before.viewport.centerY + (after.viewport.centerY - before.viewport.centerY) * eased,
      scale: before.viewport.zoom + (after.viewport.zoom - before.viewport.zoom) * eased,
    };
  };

  const renderFrame = (timeMs: number) => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas dimensions (16:9 aspect ratio)
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear canvas
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Get viewport position
    const viewport = calculateViewport(timeMs);

    // Calculate source rectangle on the image
    const viewportWidth = 1 / viewport.scale;
    const viewportHeight = (canvasHeight / canvasWidth) * viewportWidth;

    // Center the viewport on the target point
    const srcX = (viewport.x - viewportWidth / 2) * img.width;
    const srcY = (viewport.y - viewportHeight / 2) * img.height;
    const srcWidth = viewportWidth * img.width;
    const srcHeight = viewportHeight * img.height;

    // Draw the cropped/scaled portion of the image
    ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, canvasWidth, canvasHeight);

    // Draw viewport indicator (crosshair at focal point)
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    ctx.strokeStyle = "rgba(96, 165, 250, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 20, centerY);
    ctx.lineTo(centerX + 20, centerY);
    ctx.moveTo(centerX, centerY - 20);
    ctx.lineTo(centerX, centerY + 20);
    ctx.stroke();

    // Draw scale indicator
    ctx.fillStyle = "rgba(96, 165, 250, 0.9)";
    ctx.font = "12px monospace";
    ctx.fillText(`Scale: ${viewport.scale.toFixed(2)}x`, 10, 20);
    ctx.fillText(`Time: ${(timeMs / 1000).toFixed(1)}s`, 10, 40);
  };

  const animate = (timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const newTime = Math.min(elapsed, totalDurationMs);

    setCurrentTime(newTime);
    renderFrame(newTime);

    if (newTime < totalDurationMs) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      setIsPlaying(false);
      startTimeRef.current = 0;
    }
  };

  const handlePlay = () => {
    if (isPlaying) {
      // Pause
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsPlaying(false);
      startTimeRef.current = 0;
    } else {
      // Play
      setIsPlaying(true);
      startTimeRef.current = 0;
      setCurrentTime(0);
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    renderFrame(newTime);
  };

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Calculate average zoom from keyframes
  const avgZoom = viewportAnimation?.keyframes?.length
    ? viewportAnimation.keyframes.reduce((sum, kf) => sum + kf.viewport.zoom, 0) /
      viewportAnimation.keyframes.length
    : 1;

  // Get easing from first keyframe
  const easingStyle = viewportAnimation?.keyframes?.[0]?.easing || "ease-in-out";

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="mb-2 text-lg font-semibold text-slate-100">Viewport Preview</h3>
        <p className="text-sm text-slate-400">
          Preview the camera path animation with {viewportAnimation?.keyframes?.length ?? 0} keyframes
        </p>
      </div>

      {/* Canvas */}
      <div className="overflow-hidden rounded-lg border border-slate-700 bg-black">
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className="h-auto w-full"
          style={{ aspectRatio: "16/9" }}
        />
      </div>

      {/* Controls */}
      <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handlePlay} className="gap-2">
            {isPlaying ? (
              <>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                Play
              </>
            )}
          </Button>

          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={totalDurationMs}
              step={100}
              value={currentTime}
              onChange={handleSeek}
              disabled={isPlaying}
              className="w-full"
            />
          </div>

          <div className="min-w-[80px] text-right font-mono text-sm text-slate-400">
            {(currentTime / 1000).toFixed(1)}s / {(totalDurationMs / 1000).toFixed(1)}s
          </div>
        </div>

        {/* Keyframes Info */}
        <div className="border-t border-slate-800 pt-3">
          <h4 className="mb-2 text-xs font-semibold uppercase text-slate-400">Keyframes</h4>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div className="rounded bg-slate-900/50 px-2 py-1">
              <div className="text-slate-500">Total</div>
              <div className="font-semibold text-slate-300">{viewportAnimation?.keyframes?.length ?? 0}</div>
            </div>
            <div className="rounded bg-slate-900/50 px-2 py-1">
              <div className="text-slate-500">Duration</div>
              <div className="font-semibold text-slate-300">
                {(totalDurationMs / 1000).toFixed(1)}s
              </div>
            </div>
            <div className="rounded bg-slate-900/50 px-2 py-1">
              <div className="text-slate-500">Avg Zoom</div>
              <div className="font-semibold text-slate-300">
                {avgZoom.toFixed(2)}x
              </div>
            </div>
            <div className="rounded bg-slate-900/50 px-2 py-1">
              <div className="text-slate-500">Easing</div>
              <div className="font-semibold text-slate-300">
                {easingStyle}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
