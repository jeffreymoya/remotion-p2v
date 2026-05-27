import { z } from "zod";
import { phraseAnchorStrategy } from "./anchor-strategies";
import type { DataItem } from "./types";
import { UnitSchema } from "./types";
import type { SelectionInput } from "./registry";

function populateKineticNumber(dataItem: DataItem, selection: SelectionInput): Record<string, unknown> {
  if (dataItem.kind !== "scalar") {
    console.warn(`[kinetic-number] non-scalar DataItem "${dataItem.id}" (kind: ${dataItem.kind}) assigned to kinetic-number — rendering 0`);
  }
  return {
    type: "kinetic-number" as const,
    text: selection.text ?? dataItem.label,
    value: dataItem.kind === "scalar" ? dataItem.value : 0,
    unit: dataItem.unit,
    source: selection.source ?? dataItem.sourceUrl,
    palette: selection.palette as "cool-tech" | "warm-real",
    anchorPhrase: selection.anchorPhrase,
    holdSec: selection.holdSec,
    leadSec: selection.leadSec,
  };
}

export const kineticNumberDef = {
  id: "kinetic-number" as const,
  schema: z.object({
    type: z.literal("kinetic-number"),
    text: z.string().min(1),
    value: z.number(),
    unit: UnitSchema,
    source: z.string().optional(),
    palette: z.enum(["cool-tech", "warm-real"]),
    anchorPhrase: z.string().min(1),
    holdSec: z.number().positive(),
    leadSec: z.number().optional(),
  }),
  anchorStrategy: phraseAnchorStrategy,
  promptRule: 'kinetic-number: numeric stat with value+unit ($/%/x/T/B); ~60% of overlays. Values come from extracted data items — do not fabricate numbers.',
  promotable: true,
  promptExample: '{"type":"kinetic-number","text":"FEDERAL FUNDS RATE","value":5.5,"unit":"%","source":"Federal Reserve 2024","anchorPhrase":"federal funds rate","holdSec":3.0,"palette":"cool-tech"}',
  mixWeight: 0.6,
  placementHint: "anywhere in segment, prefer near data sentences",
  surface: "overlay" as const,
  placement: "llm" as const,
  category: "number" as const,
  consumes: "scalar" as const,
  populate: populateKineticNumber,
};
