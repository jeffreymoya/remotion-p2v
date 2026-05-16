import { z } from "zod";
import { deepseekChat, deepseekChatJson } from "../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../config";
import { NARRATION_GUIDELINES, VOICE_SAMPLE } from "./narration-guidelines";
import type { Anchor, ResearchBundle } from "./research/research-schema";

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

  const buildLines =
    segmentCount > 4
      ? `- Chapters 3 to ${segmentCount - 2}: Build / Complicate — deepen the story, add texture, raise stakes through specifics\n`
      : "";

  return `You are a storyteller writing long-form narration for inspirational YouTube videos (${totalMinMin}–${totalMaxMin} minutes total). You write in the voice of an older person telling stories to a friend over coffee — warm, self-deprecating, sometimes uncertain, always concrete.

You will write a complete ${segmentCount}-chapter narration. Each chapter is 2–3 minutes when spoken aloud at ~140 words per minute (${minWords}–${maxWords} words per chapter).

## Narrative Arc (MANDATORY)
The chapters must form one cohesive story with a clear arc:
- Chapter 1: Open — drop into a specific scene, introduce a controlling object, create curiosity
- Chapter 2: Build — establish the problem through concrete detail and observation
${buildLines}- Chapter ${Math.max(2, segmentCount - 1)}: Turn — the quiet reframe, earned through accumulated detail
- Chapter ${segmentCount}: Land — bring back the controlling object, end on a small image not a big declaration

## Per-Chapter Rules
1. Each chapter must end at a natural break — not mid-thought or mid-sentence.
2. Use graduated prosody pauses: \`...\` (short), \`... ...\` (medium), \`... ... ...\` (long). Also \`—\` (abrupt shift), \`( )\` (aside), \`\\n\\n\` (section break). At least 3 pause marks per chapter, at least 2 different types.
3. Conversational tone — write as if speaking to one person sitting across from you.
4. Word count per chapter: ${minWords}–${maxWords} words.
5. Each chapter needs ≥2 named entities (people, places, objects) and ≥1 dated moment.
6. ≤30% of sentences should directly address the listener as "you". Most should be in-scene narration or narrator-aside.

${NARRATION_GUIDELINES}

## Output Format
Return ONLY a JSON object matching this shape exactly:
\`\`\`json
{
  "segmentCount": ${segmentCount},
  "segments": [
    { "title": "Chapter 1: ...", "narration": "..." },
    { "title": "Chapter 2: ...", "narration": "..." }
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
  const userPrompt = `Write a ${segmentCount}-chapter long-form narration about: "${topic}"

Remember:
- ${segmentCount} chapters, each ${280}–${420} words (2–3 min at 140 WPM)
- One cohesive narrative arc — commit to a controlling object in chapter 1
- Wise-elder voice: warm, concrete, self-deprecating, story-driven
- ≥2 named entities and ≥1 dated moment per chapter
- ≤30% of sentences directly address "you" — most should be in-scene
- No banned vocabulary (agency, forge, drift, paralysis, transformation, becoming, etc.)
- Use prosody pauses: ... (short), ... ... (medium), ... ... ... (long) — at least 3 per chapter
- Each chapter ends at a natural break with an open loop to the next
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

// ── Research-grounded plan + per-chapter draft ──────────────────────────

const LongformChapterPlanSchema = z.object({
  title: z.string().min(1),
  role: z.string().min(1),
  intent: z.string().min(1),
  sceneSeed: z.string().min(1),
  anchorIds: z.array(z.string()),
});

export const LongformPlanSchema = z.object({
  segmentCount: z.number().int().min(1).max(8),
  chapters: z.array(LongformChapterPlanSchema).min(1).max(8),
});

export type LongformPlan = z.infer<typeof LongformPlanSchema>;
export type LongformChapterPlan = z.infer<typeof LongformChapterPlanSchema>;

function formatAnchorsForPrompt(anchors: readonly Anchor[]): string {
  return anchors
    .map((a) => {
      const parts = [`[${a.id}] (${a.kind}) ${a.claim}`];
      if (a.detail) parts.push(`  Detail: ${a.detail}`);
      if (a.quote) parts.push(`  Quote: "${a.quote}"`);
      if (a.attribution.person) parts.push(`  Person: ${a.attribution.person}`);
      if (a.attribution.work) parts.push(`  Work: ${a.attribution.work} (${a.attribution.year ?? "?"})`);
      parts.push(`  Confidence: ${a.citation.verifierConfidence}`);
      return parts.join("\n");
    })
    .join("\n\n");
}

export async function generateLongformPlan(
  topic: string,
  segmentCount: number,
  research: ResearchBundle,
  options?: { verbose?: boolean },
): Promise<LongformPlan> {
  const usableAnchors = research.anchors.filter((a) => a.status === "verified");

  const systemPrompt = `You are a story architect planning a ${segmentCount}-chapter long-form narrated video about: "${topic}".

You have ${usableAnchors.length} verified real-world anchors from research. Your job is to assign 1-3 anchors per chapter to ground the narration in reality. Not every chapter needs anchors — at most 1 chapter should be "anchor-heavy" (2-3 anchors). The rest should weave a single anchor into mostly scene-led prose, or have no anchors at all.

## Available Anchors
${formatAnchorsForPrompt(usableAnchors)}

## Chapter Roles
- Chapter 1: Open — drop into a specific scene
- Chapter 2: Build — establish the problem through concrete detail
${segmentCount > 4 ? `- Chapters 3 to ${segmentCount - 2}: Build / Complicate\n` : ""}- Chapter ${Math.max(2, segmentCount - 1)}: Turn — the quiet reframe
- Chapter ${segmentCount}: Land — bring back the controlling object

## Output
Return JSON:
{
  "segmentCount": ${segmentCount},
  "chapters": [
    {
      "title": "Chapter 1: ...",
      "role": "open",
      "intent": "one sentence describing what this chapter accomplishes",
      "sceneSeed": "the concrete scene or image that opens this chapter",
      "anchorIds": ["anc-001"]
    }
  ]
}

Rules:
- Total anchor assignments across all chapters: aim for ${Math.min(usableAnchors.length, segmentCount + 2)}
- At most 1 chapter with 3 anchors; prefer 0-1 per chapter
- Use anchor IDs from the list above
- Each chapter needs a specific sceneSeed — not a vague theme`;

  const plan = await deepseekChatJson(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Plan a ${segmentCount}-chapter narration about "${topic}". Return only JSON.` },
    ],
    LongformPlanSchema,
    CODE_GEN_TEMPERATURE,
    NARRATION_REASONING,
    { verbose: options?.verbose },
  );

  if (plan.chapters.length !== segmentCount) {
    throw new Error(
      `Expected ${segmentCount} chapters in plan, got ${plan.chapters.length}`,
    );
  }

  return plan;
}

export async function generateChapterDraft(
  plan: LongformPlan,
  chapterIndex: number,
  research: ResearchBundle,
  priorChapters: readonly string[],
  options?: { verbose?: boolean },
): Promise<string> {
  const chapter = plan.chapters[chapterIndex];
  const assignedAnchors = research.anchors.filter((a) =>
    chapter.anchorIds.includes(a.id),
  );

  const priorContext =
    priorChapters.length > 0
      ? `\n\n## Prior Chapters (for continuity — do not repeat their content)\n${priorChapters.map((c, i) => `Chapter ${i + 1}:\n${c.slice(0, 300)}...`).join("\n\n")}`
      : "";

  const anchorContext =
    assignedAnchors.length > 0
      ? `\n\n## Assigned Anchors (MUST incorporate — paraphrase, do not invent quotes)\n${formatAnchorsForPrompt(assignedAnchors)}\n\nIMPORTANT: Paraphrase these anchors naturally into the narration. Do NOT fabricate quotes. If an anchor has a verbatim quote with high confidence, you may use it — attributed correctly. Otherwise, paraphrase the claim in the narrator's voice.`
      : "\n\n(No research anchors assigned to this chapter — rely on concrete scene-driven observation.)";

  const systemPrompt = buildSystemPrompt(plan.segmentCount);

  const userPrompt = `Write chapter ${chapterIndex + 1} of ${plan.segmentCount} about: "${research.topic}"

Chapter plan:
- Title: ${chapter.title}
- Role: ${chapter.role}
- Intent: ${chapter.intent}
- Scene seed: ${chapter.sceneSeed}
${anchorContext}${priorContext}

Rules:
- 280–420 words (2–3 min at 140 WPM)
- Wise-elder voice
- ≥2 named entities and ≥1 dated moment
- ≤30% direct "you" address
- Prosody pauses: at least 3 per chapter
- End at a natural break
- Return ONLY the narration text — no JSON, no titles, no stage directions`;

  const raw = await deepseekChat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    CODE_GEN_TEMPERATURE,
    NARRATION_REASONING,
    { verbose: options?.verbose },
  );

  return raw.trim();
}
