import { z } from "zod";

export const AnchorKindSchema = z.enum([
  "primary_quote",
  "book_excerpt",
  "study",
  "meta_analysis",
  "case_study",
  "historical_event",
  "named_person_anecdote",
]);

export type AnchorKind = z.infer<typeof AnchorKindSchema>;

export const AnchorSchema = z.object({
  id: z.string(),
  kind: AnchorKindSchema,
  claim: z.string(),
  detail: z.string(),
  attribution: z.object({
    person: z.string().optional(),
    work: z.string().optional(),
    year: z.number().int().optional(),
    publisher: z.string().optional(),
  }),
  quote: z.string().optional(),
  citation: z.object({
    url: z.string().url(),
    title: z.string(),
    accessedAt: z.string(),
    verifierConfidence: z.enum(["high", "medium", "low"]),
    verifierNotes: z.string(),
  }),
  status: z.enum(["verified", "rejected", "needs_review"]),
});

export type Anchor = z.infer<typeof AnchorSchema>;

export const RawCandidateSchema = z.object({
  kind: AnchorKindSchema,
  claim: z.string(),
  detail: z.string().nullish().transform(v => v ?? undefined),
  attributionGuess: z.object({
    person: z.string().nullish().transform(v => v ?? undefined),
    work: z.string().nullish().transform(v => v ?? undefined),
    year: z.number().int().nullish().transform(v => v ?? undefined),
    publisher: z.string().nullish().transform(v => v ?? undefined),
  }),
  quote: z.string().nullish().transform(v => v ?? undefined),
  queryHint: z.string().nullish().transform(v => v ?? undefined),
});

export type RawCandidate = z.infer<typeof RawCandidateSchema>;

export const ResearchBundleSchema = z.object({
  topic: z.string(),
  slug: z.string(),
  generatedAt: z.string(),
  candidatesGenerated: z.number().int(),
  anchors: z.array(AnchorSchema),
  rejected: z.array(
    z.object({
      candidate: z.string(),
      reason: z.string(),
    }),
  ),
});

export type ResearchBundle = z.infer<typeof ResearchBundleSchema>;
