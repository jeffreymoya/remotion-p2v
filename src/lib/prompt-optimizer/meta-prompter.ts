import { z } from "zod";

import { runClaudeJson } from "./cli-runner";
import type { DimensionName, OptimizerModelConfig } from "./types";

const VariationsSchema = z
  .object({
    variations: z.array(z.string()).min(1),
  })
  .strict();

export async function generateInitialVariations(
  topic: string,
  context: string,
  rubricSummary: string,
  count: number,
  modelConfig: OptimizerModelConfig
): Promise<string[]> {
  const systemPrompt = `You are a prompt engineer. Generate ${count} distinctly different prompt strategies
for instructing Gemini to write a narration script about: ${topic}

Context: ${context}

The script will be evaluated on these dimensions (higher weight = more important):
${rubricSummary}

Each prompt must be a complete, standalone instruction for Gemini.
Explore diverse strategies: conversational, storytelling, Socratic, rhetorical,
stream-of-consciousness, documentary, provocative, etc.

Return JSON: { "variations": ["prompt1", "prompt2", ...] }`;

  return generateWithRetry(
    "Generate the prompt variations now.",
    systemPrompt,
    count,
    modelConfig.claudeMetaModel
  );
}

export async function generateMutations(
  winningPrompt: string,
  winningWeightedScores: Record<DimensionName, number>,
  judgeRationales: string[],
  rubricSummary: string,
  count: number,
  modelConfig: OptimizerModelConfig
): Promise<string[]> {
  const systemPrompt = `You are a prompt engineer. The following prompt scored highest in the previous round:

--- WINNING PROMPT ---
${winningPrompt}
--- END ---

Weighted scores (higher weight = more important for this use case):
${JSON.stringify(winningWeightedScores, null, 2)}

Judge feedback:
${judgeRationales.map((rationale, index) => `Judge ${index + 1}: ${rationale}`).join("\n")}

Generate ${count} improved variations. Keep what scored well on high-weight dimensions.
Focus improvements on weak high-weight dimensions first.
Try targeted mutations: adjust tone, restructure, add/remove constraints, shift style.
At least 1 variation should be a bold departure from the winning prompt's style.

Return JSON: { "variations": ["prompt1", "prompt2", ...] }`;

  return generateWithRetry("Generate the improved prompt variations now.", systemPrompt, count, modelConfig.claudeMetaModel);
}

async function generateWithRetry(
  userPrompt: string,
  systemPrompt: string,
  count: number,
  model: string
): Promise<string[]> {
  const first = normalize(
    (await runClaudeJson(userPrompt, systemPrompt, VariationsSchema, model)).data.variations
  );
  if (first.length >= count) {
    return first.slice(0, count);
  }

  const second = normalize(
    (
      await runClaudeJson(
        `${userPrompt}\n\nThe previous response under-produced or duplicated prompts. Return exactly ${count} unique, substantially different prompts.`,
        systemPrompt,
        VariationsSchema,
        model
      )
    ).data.variations
  );

  if (second.length < count) {
    throw new Error(`Claude produced ${second.length}/${count} unique prompt variations after retry.`);
  }

  return second.slice(0, count);
}

function normalize(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
