import { z } from "zod";
import { traceable } from "langsmith/traceable";
import { llmChatJson } from "../../llm-provider";
import { llmTopicalQueriesPrompt } from "../../prompts";
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
  "institutional_report",
  "expert_testimony",
  "personal_impact",
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
  const systemPrompt = llmTopicalQueriesPrompt(topic);

  const plan = await llmChatJson(
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
