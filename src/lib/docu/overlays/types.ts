import type { DocuPalette } from "../../../components/docu/docu-tokens";
import type { WordTiming } from "../../audio-wav";
import { z } from "zod";

export const OVERLAY_UNITS = ["$", "%", "x", "T", "B"] as const;
export type OverlayUnit = typeof OVERLAY_UNITS[number];

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

export const DataItemSchema = z.discriminatedUnion("kind", [
  z.object({ id: z.string(), kind: z.literal("scalar"), value: z.number(), unit: z.enum(OVERLAY_UNITS), label: z.string(), sourceAnchorId: z.string(), sourceUrl: z.string() }),
  z.object({ id: z.string(), kind: z.literal("timeseries"), points: z.array(z.object({ x: z.union([z.string(), z.number()]), y: z.number() })), unit: z.enum(OVERLAY_UNITS), label: z.string(), sourceAnchorId: z.string(), sourceUrl: z.string() }),
  z.object({ id: z.string(), kind: z.literal("comparison"), points: z.array(z.object({ x: z.union([z.string(), z.number()]), y: z.number() })), unit: z.enum(OVERLAY_UNITS), label: z.string(), sourceAnchorId: z.string(), sourceUrl: z.string() }),
  z.object({ id: z.string(), kind: z.literal("composition"), points: z.array(z.object({ x: z.union([z.string(), z.number()]), y: z.number() })), unit: z.enum(OVERLAY_UNITS), label: z.string(), sourceAnchorId: z.string(), sourceUrl: z.string() }),
]);

export type DataItem =
  | { id: string; kind: "scalar"; value: number; unit: OverlayUnit; label: string; sourceAnchorId: string; sourceUrl: string }
  | { id: string; kind: "timeseries"; points: Array<{ x: string | number; y: number }>; unit: OverlayUnit; label: string; sourceAnchorId: string; sourceUrl: string }
  | { id: string; kind: "comparison"; points: Array<{ x: string | number; y: number }>; unit: OverlayUnit; label: string; sourceAnchorId: string; sourceUrl: string }
  | { id: string; kind: "composition"; points: Array<{ x: string | number; y: number }>; unit: OverlayUnit; label: string; sourceAnchorId: string; sourceUrl: string };
