import type { DeepSeekMessage } from "../../deepseek";
import type { LongformPlan } from "../longform-narration-prompt";

/**
 * Build prompt for the internal-consistency cross-chapter gate.
 */
export function buildInternalConsistencyPrompt(chapters: readonly string[]): DeepSeekMessage[] {
  const joined = chapters
    .map((ch, i) => `[CHAPTER ${i + 1}]\n${ch}`)
    .join("\n\n");

  return [
    {
      role: "system",
      content: `You are reading all chapters of one inspirational long-form video script.
Identify any factual inconsistency in how recurring objects, characters,
places, or events are described across chapters.

Examples:
- Chapter 1: "Maria, a 38-year-old project manager in Boston"
- Chapter 3: "Maria, the engineer who lived in Chicago"  ← INCONSISTENT

- Chapter 1: "her pothos plant, on her desk for eight years"
- Chapter 4: "her fern, which she'd kept for a decade"   ← INCONSISTENT

Do not flag legitimate evolution (a yellowing plant becoming a healthy
plant, a character changing jobs). Only flag contradictions.

OUTPUT (JSON only):
{
  "pass": true | false,
  "inconsistencies": [
    {
      "subject": "<the recurring entity>",
      "chapters": [<chapter indexes involved, 1-based>],
      "evidence": "<both quoted spans>",
      "fix": "<which version to keep>"
    }
  ]
}`,
    },
    { role: "user", content: joined },
  ];
}

/**
 * Build prompt for the seed-payoff cross-chapter gate.
 */
export function buildSeedPayoffPrompt(chapters: readonly string[]): DeepSeekMessage[] {
  const joined = chapters
    .map((ch, i) => `[CHAPTER ${i + 1}]\n${ch}`)
    .join("\n\n");

  return [
    {
      role: "system",
      content: `You are reading all chapters of one inspirational long-form video script.
A "seed" is something planted in an early chapter with implicit or explicit
promise of return: a recurring object, a phrase, a named figure, or an
explicit forward reference ("I'll come back to this", "we'll meet her
again").

Identify every seed planted in chapters 1-N. For each, decide whether it
pays off in a later chapter. Pay-off means: the seed is referenced again,
its meaning is extended, or its open question is closed.

Only treat as "seeds" things with explicit forward-reference language
("we'll come back to", "I'll tell you more about", "remember this") or
clearly recurring narrative objects (a named plant, a specific phrase
repeated as motif). Do NOT treat incidental mentions as seeds.

OUTPUT (JSON only):
{
  "pass": true | false,
  "seeds": [
    {
      "plantedInChapter": <int, 1-based>,
      "seed": "<one short phrase>",
      "paidOffInChapter": <int, 1-based> | null,
      "fix": "<if null: which chapter should pay it off and how>"
    }
  ]
}

PASS if every seed has paidOffInChapter != null.`,
    },
    { role: "user", content: joined },
  ];
}

/**
 * Build prompt for the through-line cross-chapter gate.
 */
export function buildThroughLinePrompt(chapters: readonly string[]): DeepSeekMessage[] {
  const joined = chapters
    .map((ch, i) => `[CHAPTER ${i + 1}]\n${ch}`)
    .join("\n\n");

  return [
    {
      role: "system",
      content: `Read all chapters of one inspirational long-form video script.
Decide whether they trace a single connected arc, or read as disconnected
essays on the same theme.

A connected arc has: a clear progression of stakes, a thread of recurring
imagery, a single character or perspective that develops, or a narrative
question that opens in chapter 1 and resolves by the end.

Disconnected essays: each chapter introduces a fresh angle on the topic
with no connecting tissue to what came before.

OUTPUT (JSON only):
{
  "pass": true | false,
  "arcScore": 0-3,
  "weakness": "<one sentence if arcScore < 2>",
  "fix": "<what would tighten the arc>",
  "breakChapter": <1-based index of the last chapter that could resolve the arc weakness by adding connecting tissue; null if the arc is strong>
}

PASS if arcScore >= 2.`,
    },
    { role: "user", content: joined },
  ];
}

/**
 * Build prompt for the escalation cross-chapter gate.
 */
export function buildEscalationPrompt(chapters: readonly string[]): DeepSeekMessage[] {
  const joined = chapters
    .map((ch, i) => `[CHAPTER ${i + 1}]\n${ch}`)
    .join("\n\n");

  return [
    {
      role: "system",
      content: `Read all chapters. Decide whether stakes, intensity, or specificity rise
from chapter to chapter, or stay flat.

Rising stakes: by chapter N the listener has more invested than they did
in chapter 1. Specificity rises: each chapter narrows in on the topic
rather than restating it.

Flat: each chapter operates at the same emotional and abstraction level.

OUTPUT (JSON only):
{
  "pass": true | false,
  "curve": [<intensity 0-3 per chapter>],
  "weakness": "<one sentence if not strictly non-decreasing>",
  "fix": "<which chapter should raise stakes>"
}

PASS if the curve is non-decreasing AND ends >= 2.`,
    },
    { role: "user", content: joined },
  ];
}

export function buildEmotionalArcPrompt(
  chapters: readonly string[],
  plan: LongformPlan,
): DeepSeekMessage[] {
  const planSummary = plan.chapters
    .map(
      (chapter, index) => `Chapter ${index + 1}: target=${chapter.targetFeeling.dominant} intensity=${chapter.targetFeeling.intensity} arc=${chapter.polarityArc}`,
    )
    .join("\n");

  const joined = chapters
    .map((ch, i) => `[CHAPTER ${i + 1}]\n${ch}`)
    .join("\n\n");

  return [
    {
      role: "system",
      content: `You are reading all chapters of one inspirational long-form video script.

For each chapter, judge the dominant achieved emotion and intensity (0-3). Compare the achieved arc to the designed arc.

The script passes if the achieved intensity stays within 1 point of the planned intensity for each chapter and the final chapter lands at intensity >= 2.

Identify the single chapter where the emotional arc most clearly breaks down, if any.

Return JSON only in this shape:
{
  "achieved": [
    { "chapter": 1, "emotion": "recognition", "intensity": 2 }
  ],
  "breakChapter": 2,
  "weakness": "<short explanation or null>",
  "fix": "<short fix or null>"
}`, 
    },
    {
      role: "user",
      content: `Planned emotional arc:\n${planSummary}\n\nChapters:\n${joined}`,
    },
  ];
}
