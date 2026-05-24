import { z } from "zod";
import { phraseAnchorStrategy } from "./anchor-strategies";

export const contextBarDef = {
  id: "context-bar" as const,
  schema: z.object({
    type: z.literal("context-bar"),
    cycleItems: z.array(z.string().min(1)).min(1),
    palette: z.enum(["cool-tech", "warm-real"]),
    anchorPhrase: z.string().min(1),
    holdSec: z.number().positive(),
    leadSec: z.number().optional(),
  }),
  anchorStrategy: phraseAnchorStrategy,
  promptRule: "context-bar: UNWIRED — TODO.",
  promotable: false,
  promptExample: "",
  mixWeight: 0,
  surface: "overlay" as const,
  placement: "manual" as const,
  category: "bar" as const,
  consumes: "anchor" as const,
};
