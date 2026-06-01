import { z } from "zod";
import { phraseAnchorStrategy } from "./anchor-strategies";
import { overlayBaseSchema } from "./types";

export const contextBarDef = {
  id: "context-bar" as const,
  schema: overlayBaseSchema.extend({
    type: z.literal("context-bar"),
    cycleItems: z.array(z.string().min(1)).min(1),
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
