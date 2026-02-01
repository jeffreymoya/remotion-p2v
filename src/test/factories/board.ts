import type {
  Board,
  BoardPlan,
  BoardRegion,
  BoardSegmentMapping,
  GridPosition,
  RegionBounds,
  ViewportTrigger,
} from "@/src/lib/storyflow/types";

import { createId, mergeFactory, now } from "./base";

export function buildGridPosition(overrides: Partial<GridPosition> = {}): GridPosition {
  return mergeFactory<GridPosition>(
    {
      row: overrides.row ?? 0,
      col: overrides.col ?? 0,
      rowSpan: overrides.rowSpan ?? 1,
      colSpan: overrides.colSpan ?? 1,
    },
    overrides
  );
}

export function buildRegionBounds(overrides: Partial<RegionBounds> = {}): RegionBounds {
  return mergeFactory<RegionBounds>(
    {
      x: overrides.x ?? 0,
      y: overrides.y ?? 0,
      width: overrides.width ?? 1,
      height: overrides.height ?? 1,
    },
    overrides
  );
}

export function buildBoardRegion(overrides: Partial<BoardRegion> = {}): BoardRegion {
  return mergeFactory<BoardRegion>(
    {
      id: overrides.id ?? createId("region"),
      elementId: overrides.elementId ?? createId("element"),
      gridPosition: overrides.gridPosition ?? buildGridPosition(),
      bounds: overrides.bounds ?? buildRegionBounds(),
      label: overrides.label ?? "Focus region",
      salience: overrides.salience ?? 0.8,
    },
    overrides
  );
}

export function buildBoard(overrides: Partial<Board> = {}): Board {
  const createdAt = overrides.createdAt ?? now();
  const updatedAt = overrides.updatedAt ?? now();
  const projectId = overrides.projectId ?? createId("project");

  return mergeFactory<Board>(
    {
      id: overrides.id ?? createId("board"),
      projectId,
      index: overrides.index ?? 0,
      layout: overrides.layout ?? { columns: 3, rows: 2 },
      regions: overrides.regions ?? [buildBoardRegion()],
      triggers: overrides.triggers ?? null,
      createdAt,
      updatedAt,
    },
    overrides
  );
}

export function buildBoardSegmentMapping(
  overrides: Partial<BoardSegmentMapping> = {}
): BoardSegmentMapping {
  return mergeFactory<BoardSegmentMapping>(
    {
      boardId: overrides.boardId ?? createId("board"),
      segmentIndices: overrides.segmentIndices ?? [0],
      totalDurationMs: overrides.totalDurationMs ?? 30_000,
      topicSummary: overrides.topicSummary ?? "Summary of the board",
    },
    overrides
  );
}

export function buildBoardPlan(overrides: Partial<BoardPlan> = {}): BoardPlan {
  return mergeFactory<BoardPlan>(
    {
      version: "1.0",
      scriptPath: overrides.scriptPath ?? "/projects/test/script.json",
      totalSegments: overrides.totalSegments ?? 3,
      totalDurationMs: overrides.totalDurationMs ?? 90_000,
      boards: overrides.boards ?? [buildBoardSegmentMapping()],
      generatedAt: overrides.generatedAt ?? now().toISOString(),
    },
    overrides
  );
}

export function buildViewportTrigger(
  overrides: Partial<ViewportTrigger> = {}
): ViewportTrigger {
  return mergeFactory<ViewportTrigger>(
    {
      triggerId: overrides.triggerId ?? createId("trigger"),
      wordId: overrides.wordId ?? createId("word"),
      globalWordIndex: overrides.globalWordIndex ?? 0,
      segmentIndex: overrides.segmentIndex ?? 0,
      localWordIndex: overrides.localWordIndex ?? 0,
      word: overrides.word ?? "hello",
      wordStartMs: overrides.wordStartMs ?? 0,
      targetRegionId: overrides.targetRegionId ?? createId("region"),
      targetBoardId: overrides.targetBoardId ?? createId("board"),
      transitionMs: overrides.transitionMs ?? 800,
      triggerType: overrides.triggerType ?? "segment_start",
    },
    overrides
  );
}
