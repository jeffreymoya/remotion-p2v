import { z } from "zod";
import { phraseAnchorStrategy } from "./anchor-strategies";
import { overlayBaseSchema } from "./types";

export const articleCardDef = {
  id: "article-card" as const,
  schema: overlayBaseSchema.extend({
    type: z.literal("article-card"),
    id: z.string().min(1),
    category: z.string().min(1),
    headline: z.string().min(1),
    authors: z.array(z.string()),
    date: z.string(),
    time: z.string(),
    tz: z.string(),
    source: z.string(),
  }),
  anchorStrategy: phraseAnchorStrategy,
  promptRule: "article-card: UNWIRED — director-authored only.",
  promotable: false,
  promptExample: "",
  mixWeight: 0,
  surface: "scene" as const,
  placement: "manual" as const,
  category: "card" as const,
  consumes: "anchor" as const,
  defaultEnter: "fadeIn" as const,
};
