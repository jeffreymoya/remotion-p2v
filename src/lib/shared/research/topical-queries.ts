import { z } from "zod";
import { traceable } from "langsmith/traceable";
import { deepseekChatJson } from "../../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../../config";
import { enrichCurrentRun } from "../../tracing";

export const TopicalLensSchema = z.enum([
  "meta_analysis",
  "review_article",
  "primary_study",
  "critique_or_replication_failure",
  "definition_or_mechanism",
  "statistics_or_distribution",
  "framework_or_model",
  "canonical_book",
  "contrarian_essay",
  "historical_context",
  "narrative_case_study",
  "protagonist_arc",
]);
export type TopicalLens = z.infer<typeof TopicalLensSchema>;

export const TopicalQuerySchema = z.object({
  lens: TopicalLensSchema,
  query: z.string().min(3),
  rationale: z.string().min(1),
});
export type TopicalQuery = z.infer<typeof TopicalQuerySchema>;

const TopicalQueryPlanSchema = z.object({
  queries: z.array(TopicalQuerySchema).min(6).max(10),
});

async function planTopicalQueriesImpl(
  topic: string,
  opts?: { verbose?: boolean },
): Promise<TopicalQuery[]> {
  enrichCurrentRun({ topic, phase: "research", provider: "deepseek" });
  const systemPrompt = `You are designing a literature scan for a long-form essay video about: "${topic}".

Produce 6–10 Exa search queries that, *together*, map the empirical and intellectual landscape of this topic. The queries must cover different lenses — do NOT propose 8 variants of "famous author writes about X". A good scan finds meta-analyses, replication failures, contrarian essays, and definitional papers — not just bestsellers.

Available lenses (use each at most twice, cover at least 6 different ones):
- meta_analysis: aggregated effect sizes across studies
- review_article: narrative or systematic reviews of the field
- primary_study: a specific empirical paper with a memorable finding
- critique_or_replication_failure: papers that complicate or overturn a popular claim
- definition_or_mechanism: what is this thing, how does it work — encyclopedia/SEP style
- statistics_or_distribution: large datasets, base rates, prevalence
- framework_or_model: named conceptual models with citations
- canonical_book: foundational books (use sparingly — at most 2)
- contrarian_essay: serious essays that argue against the dominant view
- historical_context: long-arc historical pattern, not a single anecdote
- narrative_case_study: real named person who has gone through the topic's transformation — dateable, quotable, verifiable
- protagonist_arc: how practitioners/documentarians structure this topic as a character journey — controlling objects/settings used

Each query should be 4–10 words, written as if typed into a search engine. Avoid quoting a celebrity author's name unless that's the only way to find a specific contrarian piece.

Return JSON: { "queries": [{ "lens": "...", "query": "...", "rationale": "..." }] }`;

  const plan = await deepseekChatJson(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Plan a topical scan for: "${topic}". Return only JSON.` },
    ],
    TopicalQueryPlanSchema,
    CODE_GEN_TEMPERATURE,
    NARRATION_REASONING,
    { verbose: opts?.verbose, runName: "research/topical-plan" },
  );

  return plan.queries;
}

export const planTopicalQueries = traceable(planTopicalQueriesImpl, {
  name: "planTopicalQueries",
  run_type: "llm",
}) as typeof planTopicalQueriesImpl;
