import { z } from "zod";
import { phraseAnchorStrategy } from "./anchor-strategies";

export const articleCardDef = {
  id: "article-card" as const,
  schema: z.object({
    type: z.literal("article-card"),
    id: z.string().min(1),
    category: z.string().min(1),
    headline: z.string().min(1),
    authors: z.array(z.string()),
    date: z.string(),
    time: z.string(),
    tz: z.string(),
    source: z.string(),
    palette: z.enum(["cool-tech", "warm-real"]),
    anchorPhrase: z.string().min(1),
    holdSec: z.number().positive(),
    leadSec: z.number().optional(),
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
};
