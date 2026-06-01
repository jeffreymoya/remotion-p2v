import type { DocuPalette } from "../../../components/docu/docu-tokens";
import type { WordTiming } from "../../audio-wav";
import { z } from "zod";
import { ENTER_PRESET_KEYS, EXIT_PRESET_KEYS } from "./overlay-animations";

export const OVERLAY_UNITS = ["$", "%", "x", "T", "B", "M", "K"] as const;
export type OverlayUnit = typeof OVERLAY_UNITS[number];

const UNIT_SYNONYMS: Record<string, OverlayUnit> = {
  "dollars": "$", "usd": "$", "dollar": "$",
  "percent": "%", "pct": "%", "percentage": "%", "pct.": "%",
  // basis points — render as % (25 bp = 0.25%; value stays as-is, label clarifies)
  "bp": "%", "bps": "%", "basis points": "%", "basis point": "%",
  "times": "x", "x times": "x", "mult": "x", "multiplier": "x",
  "trillion": "T", "trillions": "T",
  "billion": "B", "billions": "B",
  "million": "M", "millions": "M",
  "thousand": "K", "thousands": "K",
};

function normalizeUnit(val: unknown): unknown {
  if (typeof val !== "string") return val;
  const lower = val.trim().toLowerCase();
  return UNIT_SYNONYMS[lower] ?? val;
}

export const UnitSchema = z.preprocess(normalizeUnit, z.enum(OVERLAY_UNITS));

export const animationParamsSchema = z.record(z.string(), z.number()).optional();

export const overlayBaseSchema = z.object({
  palette: z.enum(["cool-tech", "warm-real"]),
  anchorPhrase: z.string().min(1),
  holdSec: z.number().positive(),
  leadSec: z.number().optional(),
  enter: z.enum(ENTER_PRESET_KEYS).optional(),
  enterParams: animationParamsSchema,
  exit: z.enum(EXIT_PRESET_KEYS).optional(),
  exitParams: animationParamsSchema,
});

export interface OverlaySpecBase {
  anchorPhrase: string;
  holdSec: number;
  leadSec?: number;
  palette: DocuPalette;
}

export interface AnchorStrategyContext {
  spec: OverlaySpecBase;
  wordTimings: WordTiming[];
  fps: number;
}

export interface AnchorResult {
  startFrame: number;
  endFrame: number;
}

export type AnchorStrategy = (ctx: AnchorStrategyContext) => AnchorResult;

export const DATA_ITEM_KINDS = ["scalar", "timeseries", "comparison", "composition"] as const;
export type DataItemKind = typeof DATA_ITEM_KINDS[number];

export const OVERLAY_CATEGORIES = ["card", "number", "bar", "chart"] as const;
export type OverlayCategory = typeof OVERLAY_CATEGORIES[number];

// Note: id is optional in schema because assignIds() fills it after LLM extraction.
export const DataItemSchema = z.discriminatedUnion("kind", [
  z.object({ id: z.string().optional(), kind: z.literal("scalar"), value: z.number(), unit: UnitSchema, label: z.string(), sourceAnchorId: z.string(), sourceUrl: z.string() }),
  z.object({ id: z.string().optional(), kind: z.literal("timeseries"), points: z.array(z.object({ x: z.union([z.string(), z.number()]), y: z.number() })), unit: UnitSchema, label: z.string(), sourceAnchorId: z.string(), sourceUrl: z.string() }),
  z.object({ id: z.string().optional(), kind: z.literal("comparison"), points: z.array(z.object({ x: z.union([z.string(), z.number()]), y: z.number() })), unit: UnitSchema, label: z.string(), sourceAnchorId: z.string(), sourceUrl: z.string() }),
  z.object({ id: z.string().optional(), kind: z.literal("composition"), points: z.array(z.object({ x: z.union([z.string(), z.number()]), y: z.number() })), unit: UnitSchema, label: z.string(), sourceAnchorId: z.string(), sourceUrl: z.string() }),
]);

export type DataItem =
  | { id: string; kind: "scalar"; value: number; unit: OverlayUnit; label: string; sourceAnchorId: string; sourceUrl: string }
  | { id: string; kind: "timeseries"; points: Array<{ x: string | number; y: number }>; unit: OverlayUnit; label: string; sourceAnchorId: string; sourceUrl: string }
  | { id: string; kind: "comparison"; points: Array<{ x: string | number; y: number }>; unit: OverlayUnit; label: string; sourceAnchorId: string; sourceUrl: string }
  | { id: string; kind: "composition"; points: Array<{ x: string | number; y: number }>; unit: OverlayUnit; label: string; sourceAnchorId: string; sourceUrl: string };
