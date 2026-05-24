import { z } from "zod";
import { phraseAnchorStrategy } from "./anchor-strategies";

export const headlineCardDef = {
  id: "headline-card" as const,
  schema: z.object({
    type: z.literal("headline-card"),
    text: z.string().min(1),
    source: z.string().optional(),
    palette: z.enum(["cool-tech", "warm-real"]),
    anchorPhrase: z.string().min(1),
    holdSec: z.number().positive(),
    leadSec: z.number().optional(),
  }),
  anchorStrategy: phraseAnchorStrategy,
  promptRule: 'headline-card: event labels, institution names, regulatory actions with source attribution; ~40% of overlays.',
  promotable: true,
  promptExample: '{"type":"headline-card","text":"FED BALANCE SHEET","source":"Fed H.4.1 2024","palette":"cool-tech","anchorPhrase":"balance sheet","holdSec":3.5}',
  mixWeight: 0.4,
  placementHint: "middle 60% of segment sentences",
  surface: "overlay" as const,
  placement: "llm" as const,
  category: "card" as const,
  consumes: "anchor" as const,
};
