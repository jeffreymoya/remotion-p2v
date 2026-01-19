"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Plus, Save, Sparkles } from "lucide-react";

import { Asset, DetectedRegion, Viewport, ViewportKeyframe } from "@/src/lib/storyflow/types";
import { calculateViewportState, viewportToTransform } from "@/src/lib/viewport-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";

type Props = {
  projectId: string;
  images: Asset[];
  initialViewport: Viewport | null;
};

const FPS = 30;

const DEFAULT_KEYFRAME: ViewportKeyframe = {
  frameStart: 0,
  frameEnd: 90,
  viewport: { centerX: 0.5, centerY: 0.5, zoom: 1 },
  easing: "easeInOut",
  transitionDurationMs: 800,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function sortKeyframes(list: ViewportKeyframe[]) {
  return [...list].sort((a, b) => a.frameStart - b.frameStart);
}

function computeViewportRect(state: { centerX: number; centerY: number; zoom: number }) {
  const width = clamp(1 / state.zoom, 0.1, 1);
  const height = clamp(1 / state.zoom, 0.1, 1);
  const x = clamp(state.centerX - width / 2, 0, 1 - width);
  const y = clamp(state.centerY - height / 2, 0, 1 - height);
  return { x, y, width, height };
}

function regionToKeyframe(region: DetectedRegion, frameStart: number, durationFrames: number): ViewportKeyframe {
  const centerX = clamp(region.bounds.x + region.bounds.width / 2, 0, 1);
  const centerY = clamp(region.bounds.y + region.bounds.height / 2, 0, 1);
  const size = Math.max(region.bounds.width, region.bounds.height);
  const zoom = clamp(1 / Math.max(size, 0.2), 1.1, 3.5);

  return {
    frameStart,
    frameEnd: frameStart + Math.max(durationFrames, 10),
    viewport: { centerX, centerY, zoom },
    easing: "easeInOut",
    transitionDurationMs: 700,
  };
}

export function SimpleViewportEditor({ projectId, images, initialViewport }: Props) {
  const toast = useToast();
  const previewRef = useRef<HTMLDivElement>(null);

  const [imageAssetId, setImageAssetId] = useState(initialViewport?.imageAssetId ?? images[0]?.id ?? "");
  const [keyframes, setKeyframes] = useState<ViewportKeyframe[]>(
    initialViewport?.keyframes?.length ? sortKeyframes(initialViewport.keyframes) : [DEFAULT_KEYFRAME]
  );
  const [regions, setRegions] = useState<DetectedRegion[]>(initialViewport?.regions ?? []);
  const [currentFrame, setCurrentFrame] = useState<number>(initialViewport?.keyframes?.[0]?.frameStart ?? 0);
  const [selectedKeyframeIndex, setSelectedKeyframeIndex] = useState(0);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [rawKeyframes, setRawKeyframes] = useState(() => JSON.stringify(initialViewport?.keyframes ?? [DEFAULT_KEYFRAME], null, 2));
  const [rawRegions, setRawRegions] = useState(() => JSON.stringify(initialViewport?.regions ?? [], null, 2));
  const [previewSize, setPreviewSize] = useState({ width: 960, height: 540 });

  const selectedImage = useMemo(
    () => images.find((img) => img.id === imageAssetId) ?? images[0],
    [imageAssetId, images]
  );

  const sortedKeyframes = useMemo(() => sortKeyframes(keyframes), [keyframes]);
  const totalFrames = useMemo(() => Math.max(180, ...sortedKeyframes.map((kf) => kf.frameEnd)), [sortedKeyframes]);

  const previewState = useMemo(
    () => calculateViewportState(currentFrame, sortedKeyframes, FPS),
    [currentFrame, sortedKeyframes]
  );

  const viewportRect = useMemo(() => computeViewportRect(previewState), [previewState]);

  const imageWidth = selectedImage?.metadata?.width ?? 1920;
  const imageHeight = selectedImage?.metadata?.height ?? 1080;

  const transform = useMemo(
    () => viewportToTransform(previewState, imageWidth, imageHeight, previewSize.width, previewSize.height),
    [previewState, imageHeight, imageWidth, previewSize.height, previewSize.width]
  );

  useEffect(() => {
    const node = previewRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setPreviewSize({ width: rect.width, height: rect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setCurrentFrame((frame) => {
        const next = frame + 1;
        if (next > totalFrames) return 0;
        return next;
      });
    }, Math.max(8, Math.round(1000 / FPS)));
    return () => clearInterval(id);
  }, [playing, totalFrames]);

  useEffect(() => {
    if (selectedKeyframeIndex >= sortedKeyframes.length) {
      setSelectedKeyframeIndex(Math.max(sortedKeyframes.length - 1, 0));
    }
  }, [selectedKeyframeIndex, sortedKeyframes.length]);

  useEffect(() => {
    setRawKeyframes(JSON.stringify(sortedKeyframes, null, 2));
  }, [sortedKeyframes]);

  useEffect(() => {
    setRawRegions(JSON.stringify(regions, null, 2));
  }, [regions]);

  const handleGenerate = async () => {
    if (!imageAssetId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/viewport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, imageAssetId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Generation failed");

      if (body.viewport?.keyframes) {
        setKeyframes(sortKeyframes(body.viewport.keyframes as ViewportKeyframe[]));
      }
      if (body.viewport?.regions) {
        setRegions(body.viewport.regions as DetectedRegion[]);
      }
      setSelectedKeyframeIndex(0);
      setCurrentFrame(0);

      toast({
        title: "Viewport generated",
        description:
          body.source === "fallback"
            ? "AI unavailable, used safe fallback keyframes."
            : "AI analyzed your image and script.",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Generation error",
        description: error?.message || "Unable to generate viewport",
        variant: "error",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/viewport`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageAssetId, keyframes: sortedKeyframes, regions }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Save failed");

      toast({ title: "Viewport saved", variant: "success" });
    } catch (error: any) {
      toast({
        title: "Save error",
        description: error?.message || "Unable to save viewport",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddKeyframe = () => {
    const lastEnd = sortedKeyframes[sortedKeyframes.length - 1]?.frameEnd ?? 0;
    const next = {
      ...DEFAULT_KEYFRAME,
      frameStart: lastEnd,
      frameEnd: lastEnd + 90,
    };
    setKeyframes(sortKeyframes([...sortedKeyframes, next]));
    setSelectedKeyframeIndex(sortedKeyframes.length);
    setCurrentFrame(lastEnd);
  };

  const handleRegionKeyframe = (region: DetectedRegion) => {
    const lastEnd = sortedKeyframes[sortedKeyframes.length - 1]?.frameEnd ?? 0;
    const newKeyframe = regionToKeyframe(region, lastEnd, 75);
    setKeyframes(sortKeyframes([...sortedKeyframes, newKeyframe]));
    setSelectedRegionId(region.id);
    setSelectedKeyframeIndex(sortedKeyframes.length);
    setCurrentFrame(newKeyframe.frameStart);
  };

  const handleKeyframeUpdate = (index: number, updated: Partial<ViewportKeyframe>) => {
    setKeyframes((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updated };
      if (updated.viewport) {
        next[index].viewport = { ...prev[index].viewport, ...updated.viewport };
      }
      return sortKeyframes(next);
    });
  };

  const handleDeleteKeyframe = (index: number) => {
    setKeyframes((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, idx) => idx !== index);
      return sortKeyframes(next);
    });
    setSelectedKeyframeIndex((prev) => clamp(prev - 1, 0, Math.max(keyframes.length - 2, 0)));
  };

  const applyRawJson = () => {
    try {
      const parsedKeyframes = JSON.parse(rawKeyframes) as ViewportKeyframe[];
      const parsedRegions = JSON.parse(rawRegions || "[]") as DetectedRegion[];
      setKeyframes(sortKeyframes(parsedKeyframes));
      setRegions(parsedRegions);
      toast({ title: "Applied raw JSON", description: "Viewport and regions updated.", variant: "success" });
    } catch (error: any) {
      toast({
        title: "Invalid JSON",
        description: error?.message || "Unable to parse JSON payloads",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs uppercase tracking-[0.15em] text-slate-400">Image</label>
          <Select value={imageAssetId} onValueChange={setImageAssetId}>
            <SelectTrigger>
              <SelectValue placeholder="Select image" />
            </SelectTrigger>
            <SelectContent>
              {images.map((img) => (
                <SelectItem key={img.id} value={img.id}>
                  {img.filename}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedImage && (
            <p className="text-xs text-slate-500">
              {selectedImage.filename} • {selectedImage.metadata?.width ?? "?"}×
              {selectedImage.metadata?.height ?? "?"}
            </p>
          )}
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={handleGenerate} disabled={!imageAssetId || generating} className="flex-1">
            <Sparkles className="h-4 w-4" />
            {generating ? "Generating…" : "Generate with AI"}
          </Button>
          <Button onClick={handleSave} disabled={saving || !imageAssetId} variant="secondary">
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div
            ref={previewRef}
            className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
          >
            {selectedImage ? (
              <>
                <img
                  src={selectedImage.upscaledPath || selectedImage.path}
                  alt={selectedImage.filename}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{
                    width: imageWidth,
                    height: imageHeight,
                    transformOrigin: "top left",
                    transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
                  }}
                />

                {regions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => handleRegionKeyframe(region)}
                    className="absolute rounded border border-amber-400/80 bg-amber-300/10 transition hover:border-amber-300 hover:bg-amber-200/20"
                    style={{
                      left: `${region.bounds.x * 100}%`,
                      top: `${region.bounds.y * 100}%`,
                      width: `${region.bounds.width * 100}%`,
                      height: `${region.bounds.height * 100}%`,
                    }}
                    title={`Add keyframe focusing ${region.label}`}
                  >
                    <span className="absolute left-1 top-1 rounded bg-amber-500/80 px-1 text-[10px] font-semibold text-slate-900">
                      {region.label}
                    </span>
                  </button>
                ))}

                <div
                  className="absolute rounded-md border-2 border-brand-400/90 bg-brand-300/10 shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
                  style={{
                    left: `${viewportRect.x * 100}%`,
                    top: `${viewportRect.y * 100}%`,
                    width: `${viewportRect.width * 100}%`,
                    height: `${viewportRect.height * 100}%`,
                  }}
                />
              </>
            ) : (
              <div className="grid h-full place-items-center text-sm text-slate-500">Upload an image to begin.</div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={totalFrames}
              value={currentFrame}
              onChange={(e) => setCurrentFrame(Number(e.target.value))}
              className="w-full accent-brand-400"
            />
            <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-200">
              <button
                className="rounded-md bg-slate-800 p-1 text-slate-200 transition hover:bg-slate-700"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <span className="font-mono text-sm">{currentFrame.toString().padStart(3, "0")}</span>
              <span className="text-slate-500">/ {totalFrames}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Detected Regions</p>
            {regions.length === 0 ? (
              <p className="text-sm text-slate-500">Generate viewport to see detected regions.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {regions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => handleRegionKeyframe(region)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      selectedRegionId === region.id
                        ? "border-brand-400 bg-brand-400/10 text-brand-50"
                        : "border-slate-700 bg-slate-900/60 text-slate-200 hover:border-brand-400/60"
                    }`}
                  >
                    {region.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Keyframes</p>
              <p className="text-sm text-slate-500">Click a region to add or tweak values below.</p>
            </div>
            <Button onClick={handleAddKeyframe} variant="outline" size="sm">
              <Plus className="h-4 w-4" />
              Add keyframe
            </Button>
          </div>

          <div className="space-y-3">
            {sortedKeyframes.map((kf, index) => (
              <div
                key={`${kf.frameStart}-${index}`}
                className={`rounded-lg border p-4 transition ${
                  index === selectedKeyframeIndex ? "border-brand-500/70 bg-brand-500/5" : "border-slate-800 bg-slate-900/60"
                }`}
                onClick={() => {
                  setSelectedKeyframeIndex(index);
                  setCurrentFrame(kf.frameStart);
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">Keyframe {index + 1}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>
                      {kf.frameStart}–{kf.frameEnd}f
                    </span>
                    <button
                      className="rounded-md px-2 py-1 text-rose-300 hover:bg-rose-900/40"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteKeyframe(index);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-xs text-slate-400">
                    <span>Frame Start</span>
                    <Input
                      type="number"
                      min={0}
                      value={kf.frameStart}
                      onChange={(e) =>
                        handleKeyframeUpdate(index, { frameStart: Number(e.target.value || "0") })
                      }
                    />
                  </label>
                  <label className="space-y-1 text-xs text-slate-400">
                    <span>Frame End</span>
                    <Input
                      type="number"
                      min={kf.frameStart + 1}
                      value={kf.frameEnd}
                      onChange={(e) =>
                        handleKeyframeUpdate(index, { frameEnd: Number(e.target.value || "0") })
                      }
                    />
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="space-y-1 text-xs text-slate-400">
                    <span>Center X</span>
                    <Input
                      type="number"
                      min={0}
                      max={1}
                      step={0.01}
                      value={kf.viewport.centerX}
                      onChange={(e) =>
                        handleKeyframeUpdate(index, {
                          viewport: { ...kf.viewport, centerX: clamp(Number(e.target.value || "0"), 0, 1) },
                        })
                      }
                    />
                  </label>
                  <label className="space-y-1 text-xs text-slate-400">
                    <span>Center Y</span>
                    <Input
                      type="number"
                      min={0}
                      max={1}
                      step={0.01}
                      value={kf.viewport.centerY}
                      onChange={(e) =>
                        handleKeyframeUpdate(index, {
                          viewport: { ...kf.viewport, centerY: clamp(Number(e.target.value || "0"), 0, 1) },
                        })
                      }
                    />
                  </label>
                  <label className="space-y-1 text-xs text-slate-400">
                    <span>Zoom</span>
                    <Input
                      type="number"
                      min={1}
                      max={4}
                      step={0.05}
                      value={kf.viewport.zoom}
                      onChange={(e) =>
                        handleKeyframeUpdate(index, {
                          viewport: { ...kf.viewport, zoom: clamp(Number(e.target.value || "1"), 1, 4) },
                        })
                      }
                    />
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-xs text-slate-400">
                    <span>Easing</span>
                    <Input
                      list={`easing-${index}`}
                      value={kf.easing}
                      onChange={(e) => handleKeyframeUpdate(index, { easing: e.target.value as ViewportKeyframe["easing"] })}
                    />
                    <datalist id={`easing-${index}`}>
                      <option value="linear" />
                      <option value="easeIn" />
                      <option value="easeOut" />
                      <option value="easeInOut" />
                      <option value="slowDramatic" />
                      <option value="fastAction" />
                    </datalist>
                  </label>
                  <label className="space-y-1 text-xs text-slate-400">
                    <span>Transition (ms)</span>
                    <Input
                      type="number"
                      min={0}
                      value={kf.transitionDurationMs}
                      onChange={(e) =>
                        handleKeyframeUpdate(index, { transitionDurationMs: Number(e.target.value || "0") })
                      }
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <details className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-200">
        <summary className="cursor-pointer text-sm font-semibold text-white">Advanced · Raw JSON</summary>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.1em] text-slate-400">Keyframes JSON</label>
            <Textarea
              className="min-h-[220px] font-mono text-xs"
              value={rawKeyframes}
              onChange={(e) => setRawKeyframes(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.1em] text-slate-400">Regions JSON</label>
            <Textarea
              className="min-h-[220px] font-mono text-xs"
              value={rawRegions}
              onChange={(e) => setRawRegions(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={applyRawJson}>
            Apply JSON
          </Button>
        </div>
      </details>
    </div>
  );
}
