import { z } from "zod";
import { deepseekChat } from "../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../config";
import {
  NARRATION_RUBRICS,
  RUBRIC_CATEGORIES,
  type RubricCategory,
} from "./narration-guidelines";

export type SegmentRole =
  | "hook"
  | "setup"
  | "development"
  | "turning_point"
  | "payoff";

export interface ReviewSegmentInput {
  chapterIndex: number; // 0-based
  chapterCount: number;
  role: SegmentRole;
  title: string;
  narration: string;
  topic: string;
}

const ScoreSchema = z.number().int().min(0).max(3);

const ScoresSchema = z.object(
  Object.fromEntries(RUBRIC_CATEGORIES.map((c) => [c, ScoreSchema])) as Record<
    RubricCategory,
    typeof ScoreSchema
  >,
);

const NoteSchema = z.object({
  criterion: z.string().min(1),
  issue: z.string().min(1),
  suggestion: z.string().min(1),
});

export const SegmentReviewSchema = z.object({
  verdict: z.enum(["pass", "revise"]),
  scores: ScoresSchema,
  notes: z.array(NoteSchema),
  overall_summary: z.string().min(1),
});

export type SegmentReview = z.infer<typeof SegmentReviewSchema>;

function stripJsonFences(raw: string): string {
  return raw
    .replace(/^[\s\n]*```(?:json)?\s*\n?/, "")
    .replace(/[\s\n]*```[\s\n]*$/, "")
    .trim();
}

function buildSystemPrompt(): string {
  const categoriesList = RUBRIC_CATEGORIES.map((c) => `"${c}"`).join(", ");

  return `You are a senior script editor reviewing a single chapter of a long-form inspirational narration written for a text-to-speech narrator. Your job is to score the chapter against a fixed rubric and produce concrete revision notes — not to rewrite the chapter.

You apply the rubric strictly. You do not invent new categories. You do not skip categories. Every category in the rubric must receive a score.

${NARRATION_RUBRICS}

## Output Format

Return ONLY a JSON object matching this shape exactly:

\`\`\`json
{
  "verdict": "pass" | "revise",
  "scores": {
    ${RUBRIC_CATEGORIES.map((c) => `"${c}": 0`).join(",\n    ")}
  },
  "notes": [
    {
      "criterion": "<one of: ${categoriesList}>",
      "issue": "<what is wrong in the chapter, specific to its text>",
      "suggestion": "<concrete fix — what to add, remove, or change>"
    }
  ],
  "overall_summary": "<1–2 sentences summarizing the chapter's strengths and weaknesses>"
}
\`\`\`

Rules for the JSON:
- "scores" must contain exactly these ${RUBRIC_CATEGORIES.length} keys: ${categoriesList}.
- Each score is an integer 0, 1, 2, or 3.
- "verdict" must be "revise" if ANY score is ≤ 1, OR if the sum of all scores is < 22. Otherwise "pass".
- "notes" must include one entry for every category scored ≤ 2. Categories scored 3 do not need notes. Use the exact category key as "criterion".
- No markdown outside the JSON, no preamble, no explanation.`;
}

function buildUserPrompt(input: ReviewSegmentInput): string {
  const { chapterIndex, chapterCount, role, title, narration, topic } = input;
  return `Topic of the overall script: "${topic}"

Chapter ${chapterIndex + 1} of ${chapterCount}
Role: ${role}
Title: ${title}

Chapter narration:
"""
${narration}
"""

Score this chapter against the rubric. Apply the role-specific rules — for example, "hook" only applies strictly to Chapter 1 (chapterIndex 0). Return ONLY the JSON.`;
}

export async function reviewSegment(
  input: ReviewSegmentInput,
  options?: { verbose?: boolean },
): Promise<SegmentReview> {
  const raw = await deepseekChat(
    [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(input) },
    ],
    CODE_GEN_TEMPERATURE,
    NARRATION_REASONING,
    { verbose: options?.verbose },
  );

  const cleaned = stripJsonFences(raw);
  const parsed = JSON.parse(cleaned);
  return SegmentReviewSchema.parse(parsed);
}
