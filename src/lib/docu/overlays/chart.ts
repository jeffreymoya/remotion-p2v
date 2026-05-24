import { z } from "zod";
import { phraseAnchorStrategy } from "./anchor-strategies";
import type { DataItem } from "./types";
import type { SelectionInput } from "./registry";

function populateChart(dataItem: DataItem, selection: SelectionInput): Record<string, unknown> {
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
  return {
    type: "chart" as const,
    chartKind: dataItem.kind,
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

export const chartDef = {
  id: "chart" as const,
  schema: z.object({
    type: z.literal("chart"),
    chartKind: z.enum(["timeseries", "comparison", "composition"]),
    label: z.string().min(1),
    points: z.array(z.object({ x: z.union([z.string(), z.number()]), y: z.number() })).min(2),
    unit: z.enum(["$", "%", "x", "T", "B"]),
    source: z.string().optional(),
    palette: z.enum(["cool-tech", "warm-real"]),
    anchorPhrase: z.string().min(1),
    holdSec: z.number().positive(),
    leadSec: z.number().optional(),
  }),
  anchorStrategy: phraseAnchorStrategy,
  promptRule: "chart: timeseries/comparison/composition chart from research data. Uses dataItemId to pull in pre-extracted numeric series — do NOT fabricate numbers. Label is the chart title.",
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
};
