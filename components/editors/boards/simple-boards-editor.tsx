"use client";

import { useEffect, useMemo, useState } from "react";
import { Asset, Board, BoardRegion } from "@/src/lib/storyflow/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/src/lib/utils";

type Props = {
  projectId: string;
  images: Asset[];
  initialBoards: Board[];
};

const MIN_DIMENSION = 1;
const MAX_DIMENSION = 6;

function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max);
}

function computeCellBounds(columns: number, rows: number, row: number, col: number) {
  const width = 1 / Math.max(columns, 1);
  const height = 1 / Math.max(rows, 1);
  return {
    x: col * width,
    y: row * height,
    width,
    height,
  };
}

function normalizeBoards(boards: Board[]): Board[] {
  return boards.map((b) => ({
    ...b,
    layout: b.layout ?? { columns: 2, rows: 2 },
    regions: b.regions ?? [],
  }));
}

function createRegionId(row: number, col: number) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `region-${row}-${col}-${crypto.randomUUID()}`;
  return `region-${row}-${col}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function SimpleBoardsEditor({ projectId, images, initialBoards }: Props) {
  const toast = useToast();
  const [boards, setBoards] = useState<Board[]>(normalizeBoards(initialBoards));
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(initialBoards[0]?.id ?? null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [layoutDraft, setLayoutDraft] = useState<{ columns: number; rows: number }>({ columns: 2, rows: 2 });
  const [rawRegions, setRawRegions] = useState<string>("[]");

  const selectedBoard = useMemo(
    () => boards.find((b) => b.id === selectedBoardId) ?? null,
    [boards, selectedBoardId]
  );

  const selectedRegion = useMemo(() => {
    if (!selectedBoard || !selectedRegionId) return null;
    return selectedBoard.regions.find((r) => r.id === selectedRegionId) ?? null;
  }, [selectedBoard, selectedRegionId]);

  useEffect(() => {
    if (selectedBoard) {
      setLayoutDraft(selectedBoard.layout);
      setRawRegions(JSON.stringify(selectedBoard.regions, null, 2));
      if (selectedBoard.regions[0]) {
        setSelectedRegionId(selectedBoard.regions[0].id);
      }
    }
  }, [selectedBoardId, selectedBoard]);

  const refreshBoards = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/boards`);
      const data = await res.json();
      setBoards(normalizeBoards(data.boards ?? []));
      if (!selectedBoardId && data.boards?.[0]) setSelectedBoardId(data.boards[0].id);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout: layoutDraft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Create failed");
      toast({ title: "Board created", variant: "success" });
      await refreshBoards();
    } catch (error: any) {
      toast({ title: "Create error", description: error?.message, variant: "error" });
    }
  };

  const upsertRegion = (boardId: string, row: number, col: number, assetId: string) => {
    setBoards((prev) =>
      prev.map((board) => {
        if (board.id !== boardId) return board;
        const { columns, rows } = board.layout;
        const bounds = computeCellBounds(columns, rows, row, col);
        const existing = board.regions.find((r) => r.position.row === row && r.position.col === col);
        const region: BoardRegion = {
          id: existing?.id ?? createRegionId(row, col),
          position: { row, col },
          assetId,
          bounds,
          animation: existing?.animation,
        } as BoardRegion;

        const filtered = board.regions.filter((r) => !(r.position.row === row && r.position.col === col));
        return { ...board, regions: [...filtered, region] };
      })
    );
    setSelectedRegionId((prev) => prev ?? createRegionId(row, col));
  };

  const clearRegion = (boardId: string, row: number, col: number) => {
    setBoards((prev) =>
      prev.map((board) => {
        if (board.id !== boardId) return board;
        const regions = board.regions.filter((r) => !(r.position.row === row && r.position.col === col));
        return { ...board, regions };
      })
    );
    setSelectedRegionId((prev) => {
      const match = selectedBoard?.regions.find(
        (r) => r.position.row === row && r.position.col === col
      );
      if (match && prev === match.id) return null;
      return prev;
    });
  };

  const handleLayoutChange = (field: "columns" | "rows", value: number) => {
    const next = clamp(value, MIN_DIMENSION, MAX_DIMENSION);
    const updatedLayout = { ...layoutDraft, [field]: next } as { columns: number; rows: number };
    setLayoutDraft(updatedLayout);

    if (!selectedBoard) return;
    setBoards((prev) =>
      prev.map((board) => {
        if (board.id !== selectedBoard.id) return board;
        const filteredRegions = (board.regions || []).filter(
          (r) => r.position.col < updatedLayout.columns && r.position.row < updatedLayout.rows
        );
        const resizedRegions = filteredRegions.map((r) => ({
          ...r,
          bounds: computeCellBounds(updatedLayout.columns, updatedLayout.rows, r.position.row, r.position.col),
        }));
        return { ...board, layout: updatedLayout, regions: resizedRegions };
      })
    );
  };

  const handleRegionChange = (regionId: string, partial: Partial<BoardRegion["bounds"]>) => {
    if (!selectedBoard) return;
    setBoards((prev) =>
      prev.map((board) => {
        if (board.id !== selectedBoard.id) return board;
        const regions = board.regions.map((r) => {
          if (r.id !== regionId) return r;
          const nextBounds = {
            x: clamp(partial.x ?? r.bounds.x, 0, 1),
            y: clamp(partial.y ?? r.bounds.y, 0, 1),
            width: clamp(partial.width ?? r.bounds.width, 0.05, 1),
            height: clamp(partial.height ?? r.bounds.height, 0.05, 1),
          };
          return {
            ...r,
            bounds: {
              ...nextBounds,
              x: clamp(nextBounds.x, 0, 1 - nextBounds.width),
              y: clamp(nextBounds.y, 0, 1 - nextBounds.height),
            },
          };
        });
        return { ...board, regions };
      })
    );
  };

  const handleSaveBoard = async () => {
    if (!selectedBoard) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/boards/${selectedBoard.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout: selectedBoard.layout, regions: selectedBoard.regions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");
      toast({ title: "Board saved", description: "Layout and regions updated", variant: "success" });
      await refreshBoards();
    } catch (error: any) {
      toast({ title: "Save error", description: error?.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleApplyRaw = () => {
    if (!selectedBoard) return;
    const parsed = safeJson<BoardRegion[]>(rawRegions, selectedBoard.regions);
    setBoards((prev) =>
      prev.map((board) => (board.id === selectedBoard.id ? { ...board, regions: parsed } : board))
    );
    toast({ title: "Applied regions JSON", variant: "success" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {boards.map((board) => (
          <Button
            key={board.id}
            size="sm"
            variant={board.id === selectedBoardId ? "default" : "outline"}
            onClick={() => setSelectedBoardId(board.id)}
          >
            Board {board.index + 1}
          </Button>
        ))}
        <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
          <label className="flex items-center gap-2">
            <span>Cols</span>
            <Input
              type="number"
              min={MIN_DIMENSION}
              max={MAX_DIMENSION}
              value={layoutDraft.columns}
              onChange={(e) => handleLayoutChange("columns", Number(e.target.value || "1"))}
              className="h-8 w-16 bg-slate-950 text-xs"
            />
          </label>
          <label className="flex items-center gap-2">
            <span>Rows</span>
            <Input
              type="number"
              min={MIN_DIMENSION}
              max={MAX_DIMENSION}
              value={layoutDraft.rows}
              onChange={(e) => handleLayoutChange("rows", Number(e.target.value || "1"))}
              className="h-8 w-16 bg-slate-950 text-xs"
            />
          </label>
          <Button size="sm" variant="secondary" onClick={handleCreateBoard} disabled={loading}>
            New Board
          </Button>
          <Button size="sm" onClick={handleSaveBoard} disabled={!selectedBoard || saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {selectedBoard ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 shadow-inner shadow-black/40">
              <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
                <span>
                  Layout {selectedBoard.layout.columns} × {selectedBoard.layout.rows} · Regions {selectedBoard.regions.length}
                </span>
                {loading && <span className="text-xs text-slate-500">Refreshing…</span>}
              </div>

              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${selectedBoard.layout.columns}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${selectedBoard.layout.rows}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: selectedBoard.layout.columns * selectedBoard.layout.rows }).map((_, index) => {
                  const row = Math.floor(index / selectedBoard.layout.columns);
                  const col = index % selectedBoard.layout.columns;
                  const region = selectedBoard.regions.find(
                    (r) => r.position.row === row && r.position.col === col
                  );
                  const asset = region ? images.find((img) => img.id === region.assetId) : null;

                  return (
                    <div
                      key={`${row}-${col}`}
                      className={cn(
                        "relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-slate-900/80 text-xs text-slate-400 transition",
                        region ? "border-brand-500/70" : "border-slate-800",
                        selectedRegionId === region?.id && "ring-2 ring-brand-400/70"
                      )}
                      onClick={() => region && setSelectedRegionId(region.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const assetId = e.dataTransfer.getData("assetId");
                        if (!assetId) return;
                        upsertRegion(selectedBoard.id, row, col, assetId);
                      }}
                    >
                      {asset ? (
                        <>
                          <img
                            src={asset.upscaledPath || asset.path}
                            alt={asset.filename}
                            className="h-full w-full object-cover"
                            style={{
                              objectPosition: region
                                ? `${region.bounds.x * 100}% ${region.bounds.y * 100}%`
                                : "center",
                            }}
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent px-2 py-1 text-[11px] text-slate-100">
                            {asset.filename}
                          </div>
                          <div className="absolute right-2 top-2 flex items-center gap-1 text-[11px] text-slate-200">
                            <button
                              className="rounded bg-slate-950/70 px-2 py-1 text-amber-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRegionId(region?.id ?? null);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="rounded bg-slate-950/70 px-2 py-1 text-rose-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearRegion(selectedBoard.id, row, col);
                              }}
                            >
                              Clear
                            </button>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs">Drop image here</span>
                      )}
                      <div className="pointer-events-none absolute left-2 top-2 rounded bg-slate-950/60 px-2 py-1 text-[10px] text-slate-200">
                        Cell {row + 1},{col + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <AssetPalette images={images} />

            <BoardPreviewStrip boards={boards} images={images} onSelect={(id) => setSelectedBoardId(id)} />
          </div>

          <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4 shadow-inner shadow-black/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Selected Region</p>
                <p className="text-sm text-slate-200">
                  {selectedRegion ? `${selectedRegion.position.row + 1},${selectedRegion.position.col + 1}` : "Pick a cell"}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={handleSaveBoard} disabled={!selectedBoard || saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>

            {selectedRegion ? (
              <div className="space-y-3 text-sm text-slate-200">
                <div className="rounded border border-slate-800 bg-slate-900/70 p-3">
                  <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Bounds</p>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center gap-3 text-xs text-slate-300">
                      <span className="w-14">X</span>
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={selectedRegion.bounds.x}
                        onChange={(e) => handleRegionChange(selectedRegion.id, { x: Number(e.target.value || 0) })}
                      />
                    </label>
                    <label className="flex items-center gap-3 text-xs text-slate-300">
                      <span className="w-14">Y</span>
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={selectedRegion.bounds.y}
                        onChange={(e) => handleRegionChange(selectedRegion.id, { y: Number(e.target.value || 0) })}
                      />
                    </label>
                    <label className="flex items-center gap-3 text-xs text-slate-300">
                      <span className="w-14">Width</span>
                      <Input
                        type="number"
                        min={0.05}
                        max={1}
                        step={0.01}
                        value={selectedRegion.bounds.width}
                        onChange={(e) =>
                          handleRegionChange(selectedRegion.id, { width: Number(e.target.value || 0.05) })
                        }
                      />
                    </label>
                    <label className="flex items-center gap-3 text-xs text-slate-300">
                      <span className="w-14">Height</span>
                      <Input
                        type="number"
                        min={0.05}
                        max={1}
                        step={0.01}
                        value={selectedRegion.bounds.height}
                        onChange={(e) =>
                          handleRegionChange(selectedRegion.id, { height: Number(e.target.value || 0.05) })
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Regions JSON</p>
                  <Textarea
                    className="min-h-[140px] bg-slate-900 font-mono text-xs"
                    value={rawRegions}
                    onChange={(e) => setRawRegions(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleApplyRaw}>
                      Apply JSON
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Select a cell to edit bounds or drop an image to create a region.</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-400">No board selected yet.</p>
      )}
    </div>
  );
}

function AssetPalette({ images }: { images: Asset[] }) {
  if (!images.length) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
        Upload images in Assets step to enable drag-drop.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>Image palette</span>
        <span className="text-xs text-slate-500">Drag onto a cell</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {images.map((img) => (
          <div
            key={img.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("assetId", img.id)}
            className="group relative overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-500/60"
          >
            <img src={img.upscaledPath || img.path} alt={img.filename} className="h-20 w-full object-cover" />
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 transition group-hover:opacity-100" />
            <div className="px-2 py-1 text-[11px] text-slate-200">{img.filename}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoardPreviewStrip({
  boards,
  images,
  onSelect,
}: {
  boards: Board[];
  images: Asset[];
  onSelect: (id: string) => void;
}) {
  if (!boards.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em] text-slate-400">
        <span>Board previews</span>
        <span className="text-[11px] text-slate-500">Click to focus</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {boards.map((board) => (
          <button
            key={board.id}
            className={cn(
              "min-w-[160px] rounded-lg border bg-slate-950/70 p-2 text-left text-xs text-slate-200 transition",
              "hover:border-brand-400/60",
              "border-slate-800"
            )}
            onClick={() => onSelect(board.id)}
          >
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${board.layout.columns}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${board.layout.rows}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: board.layout.columns * board.layout.rows }).map((_, idx) => {
                const row = Math.floor(idx / board.layout.columns);
                const col = idx % board.layout.columns;
                const region = board.regions.find((r) => r.position.row === row && r.position.col === col);
                const asset = region ? images.find((img) => img.id === region.assetId) : null;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "aspect-video overflow-hidden rounded border border-slate-800 bg-slate-900/70",
                      asset && "border-brand-500/40"
                    )}
                  >
                    {asset && <img src={asset.upscaledPath || asset.path} alt={asset.filename} className="h-full w-full object-cover" />}
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-[11px] text-slate-400">Board {board.index + 1}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
