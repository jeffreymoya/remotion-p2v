import { z } from "zod";
import { deepseekChat, deepseekChatJson } from "../deepseek";
import {
  CODE_GEN_TEMPERATURE,
  MAX_ANCHORS_PER_CHAPTER,
  NARRATION_REASONING,
} from "../config";
import { NARRATION_GUIDELINES, VOICE_SAMPLES } from "./narration-guidelines";
import { BANNED_LEXICON, BANNED_PHRASES } from "./gates/banned-phrases";
import {
  ARCHETYPES,
  ARCHETYPES_FOR_PROMPT,
  ARCHETYPE_KEYS,
  DEFAULT_ARCHETYPE,
  getRoleGuidance,
} from "./narration-archetypes";
import type { NarrationArchetype } from "./narration-archetypes";
import type { Anchor, ResearchBundle } from "./research/research-schema";

const LongformSegmentSchema = z.object({
  title: z.string().min(1),
  narration: z.string().min(1),
});

const POLARITY_ARC_VALUES = [
  "low-to-high",
  "high-to-low",
  "low-mid-high",
  "high-mid-low",
  "flat-deepening",
] as const;

function normalizePolarityArc(rawValue: string): (typeof POLARITY_ARC_VALUES)[number] {
  const normalized = rawValue
    .trim()
    .toLowerCase()
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[\s_]+/g, "-");

  switch (normalized) {
    case "low-to-high":
    case "low-high":
    case "rising":
      return "low-to-high";
    case "high-to-low":
    case "high-low":
    case "falling":
      return "high-to-low";
    case "low-mid-high":
    case "low-to-mid-to-high":
    case "crescendo":
      return "low-mid-high";
    case "high-mid-low":
    case "high-to-mid-to-low":
    case "decrescendo":
      return "high-mid-low";
    case "flat-deepening":
    case "flat-to-deepening":
    case "steady-deepening":
      return "flat-deepening";
    default:
      throw new Error(`Unsupported polarityArc: ${rawValue}`);
  }
}

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

  return `You are an essayist writing long-form narration for inspirational YouTube videos (${totalMinMin}–${totalMaxMin} minutes total). You write in a warm but argumentative voice: open with misconceptions worth overturning, deploy verified quotes with attribution, and hand the reader new lenses.

You will write a complete ${segmentCount}-chapter narration. Each chapter is 2–3 minutes when spoken aloud at ~140 words per minute (${minWords}–${maxWords} words per chapter).

## Narrative Arc (MANDATORY)
The chapters must form one cohesive argument with a clear arc:
- Chapter 1: Open — state the misconception, introduce the thesis
- Chapter 2: Build — first proof point from canonical sources
${buildLines}- Chapter ${Math.max(2, segmentCount - 1)}: Turn — the deeper reframe, earned through accumulated citations
- Chapter ${segmentCount}: Land — synthesize the new lens, hand it to the reader

## Per-Chapter Rules
1. Each chapter must end at a natural break — not mid-thought or mid-sentence.
2. Use graduated prosody pauses: \`...\` (short), \`... ...\` (medium), \`... ... ...\` (long). Also \`—\` (abrupt shift), \`( )\` (aside), \`\\n\\n\` (section break). At least 3 pause marks per chapter, at least 2 different types.
3. Analytical but warm tone — write as an essayist speaking to one engaged reader.
4. Word count per chapter: ${minWords}–${maxWords} words.
5. Each chapter needs specific attributions (named authors, works, dates).
6. ≤35% of sentences should directly address the listener as "you". Most should be analytical prose, scene, or embedded-citation.

## Banned Vocabulary
Banned words (never use): ${BANNED_LEXICON.join(", ")}
Banned phrases (never use): ${BANNED_PHRASES.join("; ")}

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

function roleOpenerInstruction(role: string, archetype: NarrationArchetype): string {
  const archetypeGuidance = getRoleGuidance(archetype, role);
  if (archetypeGuidance) return archetypeGuidance;
  return "Open in a way that fits this chapter's role in the arc.";
}

function buildPriorChapterContext(
  priorChapters: readonly string[],
  plan: LongformPlan,
  research: ResearchBundle,
): string {
  if (priorChapters.length === 0) return "";

  const spans = priorChapters.map((c, i) => {
    const opener = c.slice(0, 200);
    const endpoint = c.slice(-500);
    const chapterPlan = plan.chapters[i];
    const citedAuthors = (chapterPlan?.anchorIds ?? [])
      .map((id) => research.anchors.find((a) => a.id === id))
      .filter((a): a is Anchor => a != null && a.attribution.person != null)
      .map((a) => a.attribution.person);
    const authorLine =
      citedAuthors.length > 0
        ? `\nAuthors already cited: ${[...new Set(citedAuthors)].join(", ")}`
        : "";
    return `Chapter ${i + 1} opener: ${opener}\nChapter ${i + 1} endpoint: ...${endpoint}${authorLine}`;
  });

  return `\n\n## Prior Chapters (for continuity — do not repeat their opener patterns, content, or author attributions)\n${spans.join("\n\n")}\n\nDo not repeat the rhetorical opener structure (sentence pattern or opening phrase) used in any prior chapter. Authors already cited per chapter are listed above — treat same-author references across chapters as the same source line.`;
}

function buildChapterDraftSystemPrompt(archetype: NarrationArchetype): string {
  const arche = ARCHETYPES[archetype];
  const archetypeBlock = `## Archetype for this script: ${archetype}
${arche.description}
Narrative arc: ${arche.narrativeArc}
Hook preference: ${arche.hookPreference}
Close preference: ${arche.closePreference}
The user prompt below specifies the exact opener approach for this chapter's role under this archetype — follow it precisely.`;

  return `You are an essayist writing one chapter of a long-form narrated video that builds its argument from canonical sources.

${archetypeBlock}

Write in a warm but argumentative voice — open in a way that fits this chapter's role (the user prompt specifies the exact opener approach), deploy verified quotes with attribution as structural proof, and hand the reader a new lens by chapter's end.

Each chapter must build its argument around its assigned anchors. Deploy each verified quote with explicit attribution to its author and work, then extend the implication. Never paraphrase a quote when the verbatim text is available. If an assigned anchor genuinely cannot be made to fit, return it in droppedAnchorIds with a reason — but dropping is the exception, not the default.

Keep the hard floor: 280-420 words, specific attributions and sources, at least one dated moment, and audible prosody marks.

REQUIRED VOICE MOVES (per chapter):
- Load-bearing analogy: when you reach a genuinely complex mechanism, scaffold it once with a concrete everyday analogy from domestic or physical experience and sustain it through the explanation. One analogy per concept; never swap mid-explanation.
- Mid-chapter reflective pause: exactly once, at a natural inflection point (before a major citation or the pivot from problem to mechanism), use a "... ... ..." long pause followed by a concrete question about the protagonist's situation — never addressed to the viewer. The listener answers implicitly.

BANNED OPENER TECHNIQUES:
- Paradigm-challenge opener: opening with a collective-address claim ("most people / we / many of us")
  that something commonly believed is wrong — before placing a named person in a concrete scene.
  Why banned: viewers recognize this pattern in the first 3 seconds and disengage.
- Collective-direct-address opener: first sentence addressed to "we / us / you" before
  establishing who, where, and when. Scene must precede address.

BANNED CLOSING TECHNIQUES:
- Abstract pivot question: closing with a contrastive rhetorical question
  ("X vs Y", "not whether X but whether Y") that replaces a concrete image with abstraction.
- Affirmation stack: closing with a run of short imperative or hopeful sentences
  that feel like a sermon benediction rather than a scene or decision.

Close with: a specific image, a dateable action the protagonist takes,
or a single unanswered concrete question — not an abstraction.

## Banned Vocabulary
Banned words (never use): ${BANNED_LEXICON.join(", ")}
Banned phrases (never use): ${BANNED_PHRASES.join("; ")}

${NARRATION_GUIDELINES}

Reference exemplars:

${VOICE_SAMPLES.join("\n\n---\n\n")}`;
}

export async function generateLongformScript(
  topic: string,
  segmentCount: number,
  options?: { verbose?: boolean },
): Promise<LongformScript> {
  const userPrompt = `Write a ${segmentCount}-chapter long-form narration about: "${topic}"

Remember:
- ${segmentCount} chapters, each ${280}–${420} words (2–3 min at 140 WPM)
- One cohesive argument — state the misconception in chapter 1, build proof, land the new lens
- Essayist voice: warm, argumentative, flowing analytical prose with citations
- Deploy verbatim quotes with attribution to named authors and works
- ≤35% of sentences directly address "you" — most should be analytical prose
- No banned vocabulary: ${BANNED_LEXICON.join(", ")}
- No staccato runs, no meta-narration, no two-part contrastive reveals
- Use prosody pauses: ... (short), ... ... (medium), ... ... ... (long) — at least 3 per chapter
- Each chapter ends at a natural break with an open question to the next
- Return ONLY the JSON`;

  const raw = await deepseekChat(
    [
      { role: "system", content: buildSystemPrompt(segmentCount) },
      { role: "user", content: userPrompt },
    ],
    CODE_GEN_TEMPERATURE,
    NARRATION_REASONING,
    { verbose: options?.verbose, runName: "longform/narration-draft" },
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
  controllingObject: z.string().min(1),
  targetFeeling: z.object({
    dominant: z.string().min(1),
    secondary: z.string().min(1).optional(),
    intensity: z.coerce.number().int().min(1).max(3),
  }),
  recognitionMoment: z.string().min(1),
  polarityArc: z.string().transform(normalizePolarityArc),
  anchorIds: z.array(z.string()).max(MAX_ANCHORS_PER_CHAPTER),
});

const ProtagonistSchema = z.object({
  name: z.string().min(1),
  situation: z.string().min(1),
  controllingImage: z.string().min(1),
  transformationBefore: z.string().min(1),
  transformationAfter: z.string().min(1),
});

export const LongformPlanSchema = z.object({
  segmentCount: z.number().int().min(1).max(8),
  archetype: z
    .enum([
      "essayist-with-sources",
      "storytelling-arc",
      "analytical-argument",
      "personal-meditation",
    ])
    .default(DEFAULT_ARCHETYPE),
  protagonist: ProtagonistSchema,
  chapters: z.array(LongformChapterPlanSchema).min(1).max(8),
});

export type LongformPlan = z.infer<typeof LongformPlanSchema>;
export type LongformChapterPlan = z.infer<typeof LongformChapterPlanSchema>;
export type Protagonist = z.infer<typeof ProtagonistSchema>;
export type TargetFeeling = LongformChapterPlan["targetFeeling"];
export type PolarityArc = LongformChapterPlan["polarityArc"];

const LongformChapterDraftSchema = z.object({
  narration: z.string().min(1),
  droppedAnchorIds: z.array(z.string()),
  dropReason: z
    .union([z.string().min(1), z.literal("")])
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

export type LongformChapterDraft = z.infer<typeof LongformChapterDraftSchema>;

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

You have ${usableAnchors.length} verified real-world anchors from research. Your job is to:
1. Establish a single named protagonist who persists across all chapters.
2. Design the emotional arc.
3. Assign 2–4 anchors per chapter — anchors are the argumentative spine of each chapter.

## Protagonist Requirement
Before planning chapters, establish one protagonist:
- Must be a real, named person (from narrative or named_person_anecdote anchors) or a clearly composite character (named, dated, situated).
- The protagonist's transformation arc spans all chapters — they are the human thread.
- Choose a controlling image (a recurring object/setting) that represents the protagonist's journey.

## Available Anchors
${formatAnchorsForPrompt(usableAnchors)}

## Archetype Selection (MANDATORY — select one before planning chapters)
Based on the topic, choose the archetype whose description and topicSignals best fit:
${JSON.stringify(ARCHETYPES_FOR_PROMPT, null, 2)}

Include "archetype": "<selected-key>" in the output JSON. Valid keys: ${ARCHETYPE_KEYS.map((k) => `"${k}"`).join(", ")}.
The archetype determines how chapters open, develop, and close — pick the one whose narrative arc matches the topic, not the default.

## Chapter Roles
- Chapter 1: Open — state the misconception, introduce the thesis, place protagonist in scene
- Chapter 2: Build — first proof point from canonical sources, protagonist's situation deepens
${segmentCount > 4 ? `- Chapters 3 to ${segmentCount - 2}: Build / Complicate\n` : ""}- Chapter ${Math.max(2, segmentCount - 1)}: Turn — the deeper reframe, earned through accumulated citations
- Chapter ${segmentCount}: Land — synthesize the new lens, protagonist's transformation complete

## Output
Return JSON:
{
  "segmentCount": ${segmentCount},
  "archetype": "essayist-with-sources",
  "protagonist": {
    "name": "Hannah Reyes",
    "situation": "a 34-year-old project manager who has not finished a personal project in three years",
    "controllingImage": "the open laptop on her kitchen table at 5:40am",
    "transformationBefore": "believes consistency requires willpower she doesn't have",
    "transformationAfter": "treats showing up as identity maintenance, not performance"
  },
  "chapters": [
    {
      "title": "Chapter 1: ...",
      "role": "open",
      "intent": "one sentence describing what this chapter accomplishes",
      "sceneSeed": "the concrete misconception or paradigm claim that opens this chapter",
      "controllingObject": "the specific object/setting anchoring this chapter",
      "targetFeeling": {
        "dominant": "recognition",
        "secondary": "hope",
        "intensity": 2
      },
      "recognitionMoment": "one sentence describing the exact human moment the listener should recognize",
      "polarityArc": "low-to-high",
      "anchorIds": ["anc-001", "anc-002"]
    }
  ]
}

Rules:
- Select the archetype FIRST based on topic — do not default to "essayist-with-sources" unless it actually fits the topic
- Establish protagonist FIRST from narrative/named_person_anecdote anchors — if none available, create a named composite
- Each chapter must have a controllingObject — a specific object/setting that anchors the scene
- The protagonist's controllingImage should recur or evolve across chapters
- Allocate one dominant feeling, one recognition moment, and one polarity arc for every chapter before assigning anchors
- targetFeeling.intensity must be an integer 1, 2, or 3
- polarityArc must use one of these exact values: ${POLARITY_ARC_VALUES.join(", ")}
- Design the chapter feelings so they read as a coherent emotional progression from chapter 1 through chapter ${segmentCount}
- Assign 2–${MAX_ANCHORS_PER_CHAPTER} anchors per chapter — anchors are the spine, not optional support
- At least one anchor per chapter should be of sourceTier "seminal" where available
- Chapters with no emotionally fitting anchor may use [] but this should be rare
- Use anchor IDs from the list above
- Each chapter needs a specific sceneSeed — a misconception or paradigm claim, not a vague theme`;

  const plan = await deepseekChatJson(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Plan a ${segmentCount}-chapter narration about "${topic}". Return only JSON.` },
    ],
    LongformPlanSchema,
    CODE_GEN_TEMPERATURE,
    NARRATION_REASONING,
    { verbose: options?.verbose, runName: "longform/plan" },
  );

  if (plan.chapters.length < segmentCount) {
    throw new Error(
      `Expected ${segmentCount} chapters in plan, got ${plan.chapters.length}`,
    );
  }

  return {
    ...plan,
    segmentCount,
    chapters: plan.chapters.slice(0, segmentCount),
  };
}

export async function generateChapterDraft(
  plan: LongformPlan,
  chapterIndex: number,
  research: ResearchBundle,
  priorChapters: readonly string[],
  options?: { verbose?: boolean },
): Promise<LongformChapterDraft> {
  const chapter = plan.chapters[chapterIndex];
  const assignedAnchors = research.anchors.filter((a) =>
    chapter.anchorIds.includes(a.id),
  );

  const priorContext = buildPriorChapterContext(priorChapters, plan, research);

  const anchorContext =
    assignedAnchors.length > 0
      ? `\n\n## Assigned Anchors (the argumentative spine of this chapter — deploy all)\n${formatAnchorsForPrompt(assignedAnchors)}\n\nBuild the chapter's argument around these anchors. Open with the paradigm claim, deploy each verified quote with explicit attribution to its author and work, then extend the implication. Never paraphrase a quote when the verbatim text is available. If an anchor genuinely cannot be made to fit, return it in droppedAnchorIds — but dropping is the exception.`
      : "\n\n(No research anchors assigned to this chapter — build the argument from direct observation and concrete examples.)";

  const systemPrompt = buildChapterDraftSystemPrompt(plan.archetype);

  const userPrompt = `Write chapter ${chapterIndex + 1} of ${plan.segmentCount} about: "${research.topic}"

PROTAGONIST (persists across all chapters):
Name: ${plan.protagonist.name}
Situation: ${plan.protagonist.situation}
Controlling image: ${plan.protagonist.controllingImage}
Transformation: ${plan.protagonist.transformationBefore} → ${plan.protagonist.transformationAfter}

THIS CHAPTER:
Controlling object: ${chapter.controllingObject}
Scene anchor: Open in a specific moment of ${plan.protagonist.name}'s experience.
             Every research citation must explain or deepen what is happening to them.

Chapter plan:
- Title: ${chapter.title}
- Role: ${chapter.role}
- Intent: ${chapter.intent}
- Scene seed: ${chapter.sceneSeed}
- Controlling object: ${chapter.controllingObject}
- Target feeling: ${chapter.targetFeeling.dominant}${chapter.targetFeeling.secondary ? ` with ${chapter.targetFeeling.secondary}` : ""} at intensity ${chapter.targetFeeling.intensity}/3
- Recognition moment: ${chapter.recognitionMoment}
- Polarity arc: ${chapter.polarityArc}
${anchorContext}${priorContext}

Archetype: ${plan.archetype} — ${ARCHETYPES[plan.archetype].narrativeArc}
Opener instruction for this chapter's role (${chapter.role}) under archetype "${plan.archetype}": ${roleOpenerInstruction(chapter.role, plan.archetype)}

The controlling object (${chapter.controllingObject}) must appear in the opening scene and recur at least once more in this chapter.

Rules:
- 280–420 words (2–3 min at 140 WPM)
- Essayist voice: warm, argumentative, flowing analytical prose
- Follow the opener instruction above — do NOT default to a misconception frame unless specified
- Open in scene with ${plan.protagonist.name} — place them in a specific moment before any direct address
- Deploy assigned anchors with verbatim quotes and attribution
- ≤35% direct "you" address — most sentences should be analytical prose or scene
- Prosody pauses: at least 3 per chapter
- End at a natural break
- Return ONLY JSON matching this shape exactly:
{
  "narration": "...",
  "droppedAnchorIds": ["anc-001"],
  "dropReason": "optional short reason when any anchors were dropped"
}`;

  return deepseekChatJson(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    LongformChapterDraftSchema,
    CODE_GEN_TEMPERATURE,
    NARRATION_REASONING,
    { verbose: options?.verbose, runName: "longform/chapter-draft" },
  );
}
