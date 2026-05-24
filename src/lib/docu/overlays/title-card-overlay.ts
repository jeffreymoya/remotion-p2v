import { z } from "zod";
import { phraseAnchorStrategy } from "./anchor-strategies";

export const titleCardOverlayDef = {
  id: "title-card" as const,
  schema: z.object({
    type: z.literal("title-card"),
    text: z.string().min(1),
    subtitle: z.string().optional(),
    palette: z.enum(["cool-tech", "warm-real"]),
    anchorPhrase: z.string().min(1),
    holdSec: z.number().positive(),
    leadSec: z.number().optional(),
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
