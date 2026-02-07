"use client";

import { useState, useRef, useEffect } from "react";
import { BoardRegion, RegionBounds } from "@/src/lib/boards-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/src/lib/storyflow/utils";

interface RegionEditorProps {
  projectId: string;
  imagePath: string;
  regions: BoardRegion[];
  imageMetadata: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  onRegionsChange: (regions: BoardRegion[]) => void;
  className?: string;
}

export function RegionEditor({
  projectId,
  imagePath,
  regions,
  imageMetadata,
  onRegionsChange,
  className,
}: RegionEditorProps) {
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [editedRegions, setEditedRegions] = useState<BoardRegion[]>(regions);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Load and display the image
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = `/projects/${projectId}/${imagePath}`;

    img.onload = () => {
      // Calculate canvas size to fit container while maintaining aspect ratio
      const containerWidth = container.clientWidth;
      const maxHeight = 600;
      const scale = Math.min(containerWidth / img.width, maxHeight / img.height);

      const displayWidth = img.width * scale;
      const displayHeight = img.height * scale;

      canvas.width = displayWidth;
      canvas.height = displayHeight;
      setCanvasSize({ width: displayWidth, height: displayHeight });

      // Draw image
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

      // Draw regions
      drawRegions(ctx, editedRegions, displayWidth, displayHeight);
    };
  }, [projectId, imagePath, editedRegions]);

  const drawRegions = (
    ctx: CanvasRenderingContext2D,
    regions: BoardRegion[],
    canvasWidth: number,
    canvasHeight: number
  ) => {
    regions.forEach((region) => {
      const isSelected = region.id === selectedRegionId;
      const x = region.bounds.x * canvasWidth;
      const y = region.bounds.y * canvasHeight;
      const width = region.bounds.width * canvasWidth;
      const height = region.bounds.height * canvasHeight;

      // Draw bounding box
      ctx.strokeStyle = isSelected ? "#60a5fa" : "#22d3ee";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(x, y, width, height);

      // Draw semi-transparent fill
      ctx.fillStyle = isSelected ? "rgba(96, 165, 250, 0.15)" : "rgba(34, 211, 238, 0.1)";
      ctx.fillRect(x, y, width, height);

      // Draw label
      ctx.font = "12px monospace";
      ctx.fillStyle = isSelected ? "#60a5fa" : "#22d3ee";
      ctx.fillText(region.label, x + 4, y + 16);
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvasSize.width;
    const y = (e.clientY - rect.top) / canvasSize.height;

    // Find clicked region
    const clickedRegion = editedRegions.find((region) => {
      const bounds = region.bounds;
      return (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
      );
    });

    setSelectedRegionId(clickedRegion?.id || null);
  };

  const updateRegionBounds = (regionId: string, updates: Partial<RegionBounds>) => {
    const updated = editedRegions.map((region) =>
      region.id === regionId
        ? {
            ...region,
            bounds: {
              ...region.bounds,
              ...updates,
            },
          }
        : region
    );
    setEditedRegions(updated);
  };

  const updateRegionSalience = (regionId: string, salience: number) => {
    const updated = editedRegions.map((region) =>
      region.id === regionId ? { ...region, salience } : region
    );
    setEditedRegions(updated);
  };

  const handleSave = () => {
    onRegionsChange(editedRegions);
  };

  const handleReset = () => {
    setEditedRegions(regions);
    setSelectedRegionId(null);
  };

  const selectedRegion = editedRegions.find((r) => r.id === selectedRegionId);

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h3 className="mb-2 text-lg font-semibold text-slate-100">Region Editor</h3>
        <p className="text-sm text-slate-400">
          Click regions to select and adjust their bounds. Changes are saved when you click "Save Changes".
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Canvas */}
        <div className="lg:col-span-2">
          <div
            ref={containerRef}
            className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900"
          >
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="cursor-crosshair"
              style={{ width: "100%", height: "auto" }}
            />
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded border-2 border-cyan-400" />
              <span>Region</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded border-2 border-blue-400" />
              <span>Selected</span>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-200">Region Properties</h4>

            {selectedRegion ? (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Label</label>
                  <div className="rounded bg-slate-900 px-2 py-1 font-mono text-xs text-slate-300">
                    {selectedRegion.label}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Element ID</label>
                  <div className="rounded bg-slate-900 px-2 py-1 font-mono text-xs text-brand-400">
                    {selectedRegion.elementId}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Salience (0-1)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={selectedRegion.salience}
                    onChange={(e) =>
                      updateRegionSalience(selectedRegion.id, parseFloat(e.target.value))
                    }
                    className="text-xs"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Higher values = more camera focus
                  </p>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <label className="mb-2 block text-xs font-semibold text-slate-300">
                    Bounds (Normalized)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">X</label>
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={selectedRegion.bounds.x.toFixed(3)}
                        onChange={(e) =>
                          updateRegionBounds(selectedRegion.id, { x: parseFloat(e.target.value) })
                        }
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Y</label>
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={selectedRegion.bounds.y.toFixed(3)}
                        onChange={(e) =>
                          updateRegionBounds(selectedRegion.id, { y: parseFloat(e.target.value) })
                        }
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Width</label>
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={selectedRegion.bounds.width.toFixed(3)}
                        onChange={(e) =>
                          updateRegionBounds(selectedRegion.id, {
                            width: parseFloat(e.target.value),
                          })
                        }
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Height</label>
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={selectedRegion.bounds.height.toFixed(3)}
                        onChange={(e) =>
                          updateRegionBounds(selectedRegion.id, {
                            height: parseFloat(e.target.value),
                          })
                        }
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Click a region on the canvas to edit its properties</p>
            )}
          </div>

          {/* Regions List */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-200">
              Regions ({editedRegions.length})
            </h4>
            <div className="space-y-1">
              {editedRegions.map((region) => (
                <button
                  key={region.id}
                  onClick={() => setSelectedRegionId(region.id)}
                  className={cn(
                    "w-full rounded px-2 py-1.5 text-left text-xs transition",
                    region.id === selectedRegionId
                      ? "bg-brand-900/60 text-brand-200"
                      : "bg-slate-900/50 text-slate-400 hover:bg-slate-800/50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{region.label}</span>
                    <span className="font-mono text-xs opacity-60">{region.salience.toFixed(1)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
