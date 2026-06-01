import { z } from "zod";
import { phraseAnchorStrategy } from "./anchor-strategies";
import { overlayBaseSchema } from "./types";

export const titleCardOverlayDef = {
  id: "title-card" as const,
  schema: overlayBaseSchema.extend({
    type: z.literal("title-card"),
    text: z.string().min(1),
    subtitle: z.string().optional(),
  }),
  anchorStrategy: phraseAnchorStrategy,
  promptRule: "title-card: UNWIRED — TODO.",
  promotable: false,
  promptExample: "",
  mixWeight: 0,
  surface: "overlay" as const,
  placement: "manual" as const,
  category: "card" as const,
  consumes: "anchor" as const,
};
