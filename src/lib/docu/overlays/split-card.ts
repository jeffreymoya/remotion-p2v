import { z } from "zod";
import { phraseAnchorStrategy } from "./anchor-strategies";
import { overlayBaseSchema } from "./types";

export const splitCardDef = {
  id: "split-card" as const,
  schema: overlayBaseSchema.extend({
    type: z.literal("split-card"),
    institution: z.string().min(1),
    headline: z.string().min(1),
    cite: z.string().optional(),
  }),
  anchorStrategy: phraseAnchorStrategy,
  promptRule: "split-card: UNWIRED — TODO.",
  promotable: false,
  promptExample: "",
  mixWeight: 0,
  surface: "overlay" as const,
  placement: "manual" as const,
  category: "card" as const,
  consumes: "anchor" as const,
};
