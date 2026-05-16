import { z } from "zod";
import { deepseekChat } from "../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../config";
import { NARRATION_GUIDELINES } from "./narration-guidelines";

const LongformSegmentSchema = z.object({
  title: z.string().min(1),
  narration: z.string().min(1),
});

export const LongformScriptSchema = z.object({
  segmentCount: z.number().int().min(1).max(8),
  segments: z.array(LongformSegmentSchema).min(1).max(8),
});

export type LongformScript = z.infer<typeof LongformScriptSchema>;
export type LongformSegment = z.infer<typeof LongformSegmentSchema>;

function stripJsonFences(raw: string): string {
  return raw
    .replace(/^[\s\n]*```(?:json)?\s*\n?/, "")
    .replace(/[\s\n]*```[\s\n]*$/, "")
    .trim();
}

function buildSystemPrompt(segmentCount: number): string {
  const minWords = 280;
  const maxWords = 420;
  const totalMinMin = Math.round((minWords * segmentCount) / 140);
  const totalMaxMin = Math.round((maxWords * segmentCount) / 140);

  const developmentLine =
    segmentCount > 4
      ? `- Chapters 3 to ${segmentCount - 2}: Development — explore the tension, provide evidence, deepen the argument\n`
      : "";

  return `You are a professional scriptwriter for long-form inspirational YouTube videos (${totalMinMin}–${totalMaxMin} minutes total).

You will write a complete ${segmentCount}-chapter narration. Each chapter is 2–3 minutes when spoken aloud at ~140 words per minute (${minWords}–${maxWords} words per chapter).

## Narrative Arc (MANDATORY)
The chapters must form one cohesive story with a clear arc:
- Chapter 1: Hook — disrupt the viewer's assumptions, create an immediate question
- Chapter 2: Setup — establish the problem or context in depth
${developmentLine}- Chapter ${Math.max(2, segmentCount - 1)}: Turning Point / Reveal — the insight or reframe
- Chapter ${segmentCount}: Payoff — landing lines, call to action, lasting impression

## Per-Chapter Rules
1. Each chapter must end at a natural break — not mid-thought or mid-sentence.
2. Each chapter uses graduated prosody pauses: \`...\` (short pause / hesitation), \`... ...\` (medium pause / pre-reveal suspense), \`... ... ...\` (long pause / major emotional beat or silence after climactic lines). Also \`—\` (abrupt shift), \`( )\` (aside), \`\\n\\n\` (section break). Use at least 3 pause marks per chapter with at least 2 different pause lengths.
3. Each chapter must contain EXACTLY ONE standalone sentence wrapped in double quotes — the internal voice, a belief, or an aphorism. Length: 5–12 words. Placed at the emotional peak of that chapter.
4. Conversational tone — write as if speaking to one person.
5. Word count per chapter: ${minWords}–${maxWords} words.

${NARRATION_GUIDELINES}

## Output Format
Return ONLY a JSON object matching this shape exactly:
\`\`\`json
{
  "segmentCount": ${segmentCount},
  "segments": [
    { "title": "Chapter 1: The Hook", "narration": "..." },
    { "title": "Chapter 2: The Setup", "narration": "..." }
  ]
}
\`\`\`

No markdown outside the JSON, no explanations, no stage directions. The segments array must have exactly ${segmentCount} entries.`;
}

export async function generateLongformScript(
  topic: string,
  segmentCount: number,
  options?: { verbose?: boolean },
): Promise<LongformScript> {
  const userPrompt = `Write a ${segmentCount}-chapter long-form inspirational narration about: "${topic}"

Remember:
- ${segmentCount} chapters, each ${280}–${420} words (2–3 min at 140 WPM)
- One cohesive narrative arc across all chapters
- Exactly ONE quoted sentence per chapter (5–12 words, at the emotional peak)
- Use graduated pauses: ... (short), ... ... (medium), ... ... ... (long) — at least 3 per chapter with varied lengths
- Each chapter ends at a natural break
- Return ONLY the JSON`;

  const raw = await deepseekChat(
    [
      { role: "system", content: buildSystemPrompt(segmentCount) },
      { role: "user", content: userPrompt },
    ],
    CODE_GEN_TEMPERATURE,
    NARRATION_REASONING,
    { verbose: options?.verbose },
  );

  const cleaned = stripJsonFences(raw);
  const parsed = JSON.parse(cleaned);
  const result = LongformScriptSchema.parse(parsed);

  if (result.segments.length !== segmentCount) {
    throw new Error(
      `Expected ${segmentCount} segments, got ${result.segments.length}`,
    );
  }

  return result;
}
