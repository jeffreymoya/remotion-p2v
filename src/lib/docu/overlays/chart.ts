import { z } from "zod";
import { phraseAnchorStrategy } from "./anchor-strategies";
import { UnitSchema, overlayBaseSchema } from "./types";
import type { DataItem } from "./types";
import type { SelectionInput } from "./registry";

// Render style → data shape it consumes. Render style is decoupled from data
// shape: several styles legitimately render the same DataItem kind. The
// canonical (default) render style for a data shape is the same-named kind.
export const CHART_KIND_CONSUMES = {
  timeseries: "timeseries",
  area: "timeseries",
  comparison: "comparison",
  "horizontal-bar": "comparison",
  composition: "composition",
  radial: "composition",
} as const satisfies Record<string, DataItem["kind"]>;

export type ChartKind = keyof typeof CHART_KIND_CONSUMES;

// Canonical render style per data shape (used when no override is supplied).
const DEFAULT_CHART_KIND: Record<"timeseries" | "comparison" | "composition", ChartKind> = {
  timeseries: "timeseries",
  comparison: "comparison",
  composition: "composition",
};

// `chartKind` override is reserved for the variety controller (Step 2) to drive
// the per-video skin axis. The LLM never selects render style — it selects data.
function populateChart(dataItem: DataItem, selection: SelectionInput, chartKind?: ChartKind): Record<string, unknown> {
  if (dataItem.kind === "scalar") {
    console.warn(`[chart] scalar DataItem "${dataItem.id}" assigned to chart overlay — use kinetic-number for scalar data`);
    return {
      type: "chart" as const,
      chartKind: "timeseries" as const,
      label: selection.text ?? dataItem.label,
      points: [],
      unit: dataItem.unit,
      source: selection.source ?? dataItem.sourceUrl,
      palette: selection.palette as "cool-tech" | "warm-real",
      anchorPhrase: selection.anchorPhrase,
      holdSec: selection.holdSec,
      leadSec: selection.leadSec,
    };
  }
  const resolvedKind = chartKind && CHART_KIND_CONSUMES[chartKind] === dataItem.kind
    ? chartKind
    : DEFAULT_CHART_KIND[dataItem.kind];
  if (chartKind && CHART_KIND_CONSUMES[chartKind] !== dataItem.kind) {
    console.warn(`[chart] chartKind "${chartKind}" consumes "${CHART_KIND_CONSUMES[chartKind]}" but DataItem "${dataItem.id}" is "${dataItem.kind}" — falling back to "${resolvedKind}"`);
  }
  return {
    type: "chart" as const,
    chartKind: resolvedKind,
    label: selection.text ?? dataItem.label,
    points: "points" in dataItem && Array.isArray(dataItem.points) ? dataItem.points : [],
    unit: dataItem.unit,
    source: selection.source ?? dataItem.sourceUrl,
    palette: selection.palette as "cool-tech" | "warm-real",
    anchorPhrase: selection.anchorPhrase,
    holdSec: selection.holdSec,
    leadSec: selection.leadSec,
  };
}

const ChartKindEnum = z.enum([
  "timeseries",
  "comparison",
  "composition",
  "horizontal-bar",
  "area",
  "radial",
]);

export const chartDef = {
  id: "chart" as const,
  schema: overlayBaseSchema.extend({
    type: z.literal("chart"),
    chartKind: ChartKindEnum,
    label: z.string().min(1),
    points: z.array(z.object({ x: z.union([z.string(), z.number()]), y: z.number() })).optional().default([]),
    unit: UnitSchema,
    source: z.string().optional(),
    forecastFromIndex: z.number().int().nonnegative().optional(),
  }).superRefine((val, ctx) => {
    if (!val.points || val.points.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "points must have at least 2 entries for this chart kind" });
    }
  }),
  anchorStrategy: phraseAnchorStrategy,
  promptRule: "chart: render styles timeseries/comparison/composition/horizontal-bar/area/radial drawn from research data. Uses dataItemId to pull in pre-extracted numeric series — do NOT fabricate numbers, and do NOT pick a render style (it is chosen automatically). Label is the chart title.",
  promotable: true,
  promptExample: '{"type":"chart","dataItemId":"timeseries-01","text":"SaaS Revenue Growth 2020–2024","anchorPhrase":"revenue growth","holdSec":4.5,"palette":"cool-tech"}',
  mixWeight: 0.2,
  placementHint: "near data-heavy sentences",
  surface: "overlay" as const,
  placement: "llm" as const,
  category: "chart" as const,
  consumes: "timeseries" as const,
  consumesKinds: ["timeseries", "comparison", "composition"] as const,
  populate: populateChart,
  defaultEnter: "fadeIn" as const,
};
