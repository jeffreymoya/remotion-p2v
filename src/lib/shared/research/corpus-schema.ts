import { z } from "zod";
import { TopicalLensSchema, TopicalQuerySchema } from "./topical-queries";

export const CorpusExcerptSchema = z.object({
  id: z.string(),
  lens: TopicalLensSchema,
  query: z.string(),
  url: z.string().url(),
  domain: z.string(),
  title: z.string(),
  highlights: z.array(z.string()),
  textExcerpt: z.string(),
  score: z.number().optional(),
  fetchedAt: z.string(),
});
export type CorpusExcerpt = z.infer<typeof CorpusExcerptSchema>;

export const ResearchCorpusSchema = z.object({
  topic: z.string(),
  slug: z.string(),
  generatedAt: z.string(),
  queries: z.array(TopicalQuerySchema),
  excerpts: z.array(CorpusExcerptSchema),
});
export type ResearchCorpus = z.infer<typeof ResearchCorpusSchema>;
