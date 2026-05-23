import { z } from "zod";
import { traceable } from "langsmith/traceable";
import { deepseekChatJson } from "../../deepseek";
import {
  CODE_GEN_TEMPERATURE,
  NARRATION_REASONING,
  RESEARCH_BRAINSTORM_TIMEOUT_MS,
} from "../../config";
import type { AnchorKind, RawCandidate } from "./research-schema";
import { AnchorKindSchema, RawCandidateSchema } from "./research-schema";
import type { ResearchCorpus } from "./corpus-schema";
import { enrichCurrentRun } from "../../tracing";

const CORPUS_EXCERPT_LIMIT = 40;
const CORPUS_HIGHLIGHT_PREVIEW_CHARS = 220;

const BrainstormCandidateSchema = z.object({
  kind: z.string(),
  claim: z.string(),
  detail: z.string().nullish(),
  attributionGuess: z.object({
    person: z.string().nullish(),
    work: z.string().nullish(),
    year: z.number().int().nullish(),
    publisher: z.string().nullish(),
  }),
  quote: z.string().nullish(),
  queryHint: z.string().nullish(),
  sceneMoment: z.string().nullish(),
});

const BrainstormResponseSchema = z.object({
  candidates: z.array(BrainstormCandidateSchema),
});

function normalizeKind(rawKind: string): AnchorKind {
  const normalized = rawKind.trim().toLowerCase().replace(/[\s-]+/g, "_");

  switch (normalized) {
    case "primary_quote":
    case "quote":
    case "quotation":
      return "primary_quote";
    case "book_excerpt":
    case "book_quote":
    case "canonical_book":
    case "essay_excerpt":
      return "book_excerpt";
    case "study":
    case "primary_study":
    case "definition_or_mechanism":
    case "statistics_or_distribution":
    case "framework_or_model":
      return "study";
    case "meta_analysis":
    case "review_article":
    case "systematic_review":
    case "critique_or_replication_failure":
      return "meta_analysis";
    case "case_study":
    case "real_world_example":
    case "example":
      return "case_study";
    case "historical_event":
    case "historical_context":
    case "timeline_event":
      return "historical_event";
    case "named_person_anecdote":
    case "named_anecdote":
    case "biographical_anecdote":
    case "person_story":
      return "named_person_anecdote";
    case "narrative":
    case "narrative_case_study":
    case "protagonist_arc":
    case "character_arc":
    case "transformation_story":
      return "narrative";
    default:
      throw new Error(`Unsupported brainstorm candidate kind: ${rawKind}`);
  }
}

function normalizeCandidate(
  candidate: z.infer<typeof BrainstormCandidateSchema>,
): RawCandidate {
  return RawCandidateSchema.parse({
    ...candidate,
    kind: normalizeKind(candidate.kind),
  });
}

function buildBrainstormPrompt(
  topic: string,
  targetCount: number,
  opts?: {
    excludeKinds?: AnchorKind[];
    priorRejections?: string[];
    corpus?: ResearchCorpus;
  },
): string {
  const kindList = AnchorKindSchema.options
    .filter((k) => !opts?.excludeKinds?.includes(k))
    .join(", ");

  const rejectionClause = opts?.priorRejections?.length
    ? `\n\nDo NOT propose any of these previously rejected claims (or minor rephrasings of them):\n${opts.priorRejections.map((r) => `- ${r}`).join("\n")}`
    : "";

  const canonicalWarning = `\nPrefer the most-cited canonical works on the topic. For each topic, identify the 5–10 seminal texts (popular books, foundational studies, major essays) most commonly referenced when this topic is discussed, and source verbatim excerpts from them. Lesser-known sources are acceptable only when they materially extend or challenge a canonical position. Canonical authors (Viktor Frankl, Angela Duckworth, Carol Dweck, Brené Brown, James Clear, Rick Hanson, etc.) are strongly preferred when they have relevant published passages.`;

  const corpusClause =
    opts?.corpus && opts.corpus.excerpts.length > 0
      ? `\n\n## Available Excerpts (preferred — propose anchors grounded in these real sources)
${opts.corpus.excerpts
  .slice(0, CORPUS_EXCERPT_LIMIT)
  .map((e) => {
    const preview = (e.highlights[0] ?? e.textExcerpt.slice(0, CORPUS_HIGHLIGHT_PREVIEW_CHARS))
      .replace(/\s+/g, " ")
      .trim();
    return `[${e.id}] (${e.lens}) ${e.domain} — ${e.title}\n  Highlight: ${preview}\n  URL: ${e.url}`;
  })
  .join("\n\n")}

When a candidate corresponds to one of these excerpts, set its queryHint to the excerpt's URL so verification finds it directly. You may still propose claims outside this list (especially canonical quotes the scan missed), but at least 60% of candidates should be grounded in the excerpts above. Favor excerpts from non-storytelling lenses (meta_analysis, review_article, primary_study, critique_or_replication_failure, definition_or_mechanism, statistics_or_distribution) to balance the bundle against narrative anchors.`
      : "";

  return `You are a research assistant preparing real-world anchors for a long-form narrated video about: "${topic}".

Brainstorm ${targetCount} candidate anchors. Each must be a REAL, verifiable claim — not invented.

Anchor kinds to include: ${kindList}
Ensure diversity: at least one candidate of each available kind.

For each candidate, provide:
- kind: one of [${kindList}] using those exact enum strings only
- claim: a one-sentence factual summary
- detail: 2-5 sentences of usable specifics (dates, names, numbers)
- attributionGuess: { person?, work?, year?, publisher? }
- quote: verbatim quote text (only for primary_quote or book_excerpt kinds)
- queryHint: a web search query likely to surface a credible source for this claim
- sceneMoment: (only for narrative kind) a specific dateable moment in the person's story that could open or anchor a chapter scene
${canonicalWarning}${corpusClause}${rejectionClause}

Return JSON: { "candidates": [ ... ] }`;
}

export async function brainstormCandidatesImpl(
  topic: string,
  targetCount: number,
  opts?: {
    verbose?: boolean;
    excludeKinds?: AnchorKind[];
    priorRejections?: string[];
    corpus?: ResearchCorpus;
  },
): Promise<RawCandidate[]> {
  enrichCurrentRun({ topic, phase: "research", provider: "deepseek" });
  const prompt = buildBrainstormPrompt(topic, targetCount, opts);

  const result = await deepseekChatJson(
    [
      { role: "system", content: "You are a meticulous research assistant. Return only valid JSON." },
      { role: "user", content: prompt },
    ],
    BrainstormResponseSchema,
    CODE_GEN_TEMPERATURE,
    NARRATION_REASONING,
    {
      verbose: opts?.verbose,
      timeoutMs: RESEARCH_BRAINSTORM_TIMEOUT_MS,
      runName: "research/brainstorm",
    },
  );

  if (opts?.verbose) {
    process.stderr.write(
      `[brainstorm] received ${result.candidates.length} candidates\n`,
    );
  }

  return result.candidates.map(normalizeCandidate);
}

export const brainstormCandidates = traceable(brainstormCandidatesImpl, {
  name: "brainstormCandidates",
  run_type: "llm",
}) as typeof brainstormCandidatesImpl;
