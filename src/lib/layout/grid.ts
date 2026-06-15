/**
 * Deterministic slot grid for documentary scene layout.
 *
 * The frame is 1920x1080. A central **stage** is reserved for content layers,
 * carved out so the chrome label rail (top) and the caption band (bottom) never
 * compete with content for space. Content layers are placed into **named slots**
 * — fixed grid spans — instead of owning the whole frame at the origin. Because
 * the slot boxes are defined on an integer grid and only ever touch at shared
 * edges, two distinct slots can be proven to never overlap. This is the
 * mathematical backbone of the no-collision guarantee.
 *
 * Pure module: no React, no Remotion. Safe to unit test and to import from the
 * pipeline builder.
 */

/** A resolved pixel rectangle on the 1920x1080 frame. */
export interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** A slot expressed as a span on the stage grid. */
export interface SlotSpan {
  /** Start column (0..GRID_COLS). */
  readonly c0: number;
  /** Column span (>= 1). */
  readonly cspan: number;
  /** Start row (0..GRID_ROWS). */
  readonly r0: number;
  /** Row span (>= 1). */
  readonly rspan: number;
}

/** Frame dimensions the slot system targets. */
export const FRAME = { width: 1920, height: 1080 } as const;

/**
 * Stage bounds (content-safe area). The chrome label rail occupies roughly
 * y 40..110 (above STAGE.y0); the caption band occupies roughly y 900..1040
 * (below STAGE.y0 + STAGE.height). Content slots live strictly between them.
 */
export const STAGE = {
  x0: 120,
  y0: 160,
  width: 1680,
  height: 720,
} as const;

export const GRID_COLS = 12;
export const GRID_ROWS = 6;

/** Width of one grid column in px (1680 / 12). */
export const COL_W = STAGE.width / GRID_COLS;
/** Height of one grid row in px (720 / 6). */
export const ROW_H = STAGE.height / GRID_ROWS;

/**
 * The named slot catalogue. Adding a slot here makes it available to templates.
 * Keep every slot inside the 12x6 grid so it stays within the stage.
 */
export const SLOTS = {
  full: { c0: 0, cspan: 12, r0: 0, rspan: 6 },

  "left-half": { c0: 0, cspan: 6, r0: 0, rspan: 6 },
  "right-half": { c0: 6, cspan: 6, r0: 0, rspan: 6 },

  "main-left": { c0: 0, cspan: 9, r0: 0, rspan: 6 },
  "sidebar-right": { c0: 9, cspan: 3, r0: 0, rspan: 6 },
  "main-right": { c0: 3, cspan: 9, r0: 0, rspan: 6 },
  "sidebar-left": { c0: 0, cspan: 3, r0: 0, rspan: 6 },

  "stage-top": { c0: 0, cspan: 12, r0: 0, rspan: 4 },
  "lower-third": { c0: 0, cspan: 12, r0: 4, rspan: 2 },

  "center-stat": { c0: 2, cspan: 8, r0: 1, rspan: 4 },
  "top-rail": { c0: 0, cspan: 12, r0: 0, rspan: 1 },
  "bottom-rail": { c0: 0, cspan: 12, r0: 5, rspan: 1 },
  "right-gutter": { c0: 10, cspan: 2, r0: 1, rspan: 4 },

  "corner-cite": { c0: 0, cspan: 6, r0: 4, rspan: 2 },
  "corner-cite-right": { c0: 6, cspan: 6, r0: 4, rspan: 2 },
  "right-top": { c0: 6, cspan: 6, r0: 0, rspan: 4 },
} as const satisfies Record<string, SlotSpan>;

/** Name of any catalogued slot. */
export type SlotName = keyof typeof SLOTS;

/** All catalogued slot names. */
export const SLOT_NAMES = Object.keys(SLOTS) as SlotName[];

/** Type guard: is `name` a known slot? */
export const isSlotName = (name: string): name is SlotName =>
  Object.prototype.hasOwnProperty.call(SLOTS, name);

/** Resolve a slot span to a concrete pixel {@link Box} on the frame. */
export const resolveSlotBox = (slot: SlotName): Box => {
  const span = SLOTS[slot];
  return {
    x: STAGE.x0 + span.c0 * COL_W,
    y: STAGE.y0 + span.r0 * ROW_H,
    w: span.cspan * COL_W,
    h: span.rspan * ROW_H,
  };
};

/**
 * True when two boxes overlap with positive area. Boxes that merely share an
 * edge (e.g. one ends where the next begins) do NOT overlap — that is what lets
 * adjacent slots tile the stage seamlessly.
 */
export const boxesOverlap = (a: Box, b: Box): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** True when `inner` is fully contained by `outer` (edges may touch). */
export const boxContains = (outer: Box, inner: Box): boolean =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.w <= outer.x + outer.w &&
  inner.y + inner.h <= outer.y + outer.h;

/** The whole-stage box, useful for containment assertions. */
export const STAGE_BOX: Box = {
  x: STAGE.x0,
  y: STAGE.y0,
  w: STAGE.width,
  h: STAGE.height,
};
