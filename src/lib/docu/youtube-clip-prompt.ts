import { z } from "zod";
import { callStructured } from "./llm-client";
import { LLM_DEFAULT, LLM_JUDGE } from "../config";
import type { Anchor } from "../shared/research/research-schema";
import type { SentenceDef } from "./tts-pipeline";
import type { DocuSegmentPlan } from "./segment-types";
import type { YouTubeClipSpec } from "./youtube-pipeline";

// ── Zod schema ──────────────────────────────────────────────────────────

const YouTubeClipAnnotationSchema = z.object({
  clips: z.array(z.object({
    sentenceIndex: z.number().int().min(0),
    searchQuery: z.string().min(1),
    targetPhrases: z.array(z.string()).min(1),
    leadSec: z.number().positive().optional(),
    trailSec: z.number().positive().optional(),
  })).max(5),
});

// ── Prompt ──────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are selecting moments in a Bloomberg-style documentary narration that would benefit from authoritative interview footage. Identify up to 5 sentences where a speaker on camera would reinforce credibility.

## Selection Guidelines
1. Prefer sentences that cite data claims, institutional statements, historical events, or expert testimony.
2. Each clip gets a "searchQuery" — a 3–7 word YouTube search string likely to find interview footage of someone speaking on this topic.
3. PERSON NAME RULE (highest priority): When the provided anchor summaries name a specific person (e.g. "Jerome Powell", "Janet Yellen") and the sentence you select draws from that anchor, that person's full name MUST appear in the searchQuery. Generic institutional queries like "Federal Reserve rate hike" are low-value — YouTube returns explainer content, not interview footage. Queries with a named person like "Jerome Powell interview inflation" surface actual interview clips.
4. Each clip gets 1–3 "targetPhrases" ordered by priority — these are exact phrases you expect to hear spoken in the interview. Only pick phrases likely to appear in spoken word (captions/transcripts). The first match found wins.
5. leadSec (default 5) and trailSec (default 8) control the clip window around the matched phrase.
6. Select at most 5 sentences. Choose the ones where an interview clip adds the most authority — skip narrative transitions, hooks, and pure descriptions.
7. Assign sentence indices based on the 0-indexed sentence list provided below.
8. If no sentence would benefit from an interview clip, return an empty clips array.

## Output Format
Return JSON only, no markdown fences.
{
  "clips": [
    {
      "sentenceIndex": 7,
      "searchQuery": "Jerome Powell average inflation targeting interview",
      "targetPhrases": ["average inflation", "flexible target"],
      "leadSec": 5,
      "trailSec": 8
    }
  ]
}`;
}

// ── Deterministic person-name injection ─────────────────────────────────

function buildSentenceToAnchors(
  segmentPlans: DocuSegmentPlan[],
  verifiedAnchors: Anchor[],
  totalSentences: number,
): Map<number, Anchor[]> {
  const anchorMap = new Map(verifiedAnchors.map((a) => [a.id, a]));
  const sentenceToAnchors = new Map<number, Anchor[]>();
  let offset = 0;

  for (const plan of segmentPlans) {
    const anchors = plan.assignedAnchorIds
      .map((id) => anchorMap.get(id))
      .filter((a): a is Anchor => a != null);
    for (let i = 0; i < plan.targetSentenceCount; i++) {
      sentenceToAnchors.set(offset + i, anchors);
    }
    offset += plan.targetSentenceCount;
  }

  return sentenceToAnchors;
}

function personNamesFromAnchors(anchors: Anchor[]): string[] {
  const names = new Set<string>();
  for (const a of anchors) {
    if (a.attribution.person) {
      names.add(a.attribution.person.toLowerCase());
    }
  }
  return Array.from(names);
}

function injectPersonName(
  query: string,
  sentenceText: string,
  anchorNames: string[],
): string {
  const queryLower = query.toLowerCase();
  const sentenceLower = sentenceText.toLowerCase();

  for (const name of anchorNames) {
    if (queryLower.includes(name)) continue;
    if (!sentenceLower.includes(name.split(" ")[0])) continue;

    return `${query} ${name.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}`;
  }

  return query;
}

function enforcePersonNames(
  clips: YouTubeClipSpec[],
  sentences: SentenceDef[],
  sentenceToAnchors: Map<number, Anchor[]>,
): YouTubeClipSpec[] {
  return clips.map((clip, i) => {
    const sentence = sentences[clip.sentenceIndex];
    if (!sentence) return clip;

    const anchors = sentenceToAnchors.get(clip.sentenceIndex) ?? [];
    const names = personNamesFromAnchors(anchors);
    if (names.length === 0) return clip;

    const updatedQuery = injectPersonName(clip.searchQuery, sentence.text, names);
    if (updatedQuery !== clip.searchQuery) {
      console.log(
        `[youtube-clips] Clip ${i}: Injected person name into query — "${clip.searchQuery}" → "${updatedQuery}"`,
      );
    }

    return { ...clip, searchQuery: updatedQuery };
  });
}

// ── YouTube clip relevance judge (LLM) ─────────────────────────────────

const MAX_CLIP_JUDGE_RETRIES = 1;

const ClipJudgeResponseSchema = z.object({
  verdicts: z.array(z.object({
    clipIndex: z.number().int().min(0),
    relevant: z.boolean(),
    reason: z.string().optional(),
  })),
});

function buildClipJudgeSystemPrompt(): string {
  return `You are reviewing YouTube interview clip selections for a Bloomberg-style documentary.
For each clip, determine if its searchQuery and targetPhrases match the narration sentence
it is paired with. A clip is RELEVANT if a real YouTube search for the query would likely
return footage of someone discussing the concept in the paired sentence.

Rules:
1. searchQuery should be topically related to the sentence's core claim — not a tangential
   term that happens to appear.
2. targetPhrases should be words a speaker would actually say in an interview about this topic.
3. If the sentence is a hook/transition with no clear expert-interview subject, mark relevant=false.
4. When in doubt, relevant=true.

Return JSON only, no markdown fences.`;
}

export async function gateYouTubeClipRelevance(
  clips: YouTubeClipSpec[],
  sentences: SentenceDef[],
  opts?: { verbose?: boolean },
): Promise<YouTubeClipSpec[]> {
  if (clips.length === 0) return clips;

  let current = clips;
  let previousDropCount = 0;

  for (let attempt = 1; attempt <= MAX_CLIP_JUDGE_RETRIES + 1; attempt++) {
    const sentenceList = sentences
      .map((s, i) => `[sent-${i}] "${s.text}"`)
      .join("\n");

    const clipList = current
      .map((c, i) => `[clip-${i}] sentenceIndex=${c.sentenceIndex} searchQuery="${c.searchQuery}" targetPhrases=[${c.targetPhrases.map((p) => `"${p}"`).join(", ")}]`)
      .join("\n");

    const userPrompt = `Sentences:\n${sentenceList}\n\nClips:\n${clipList}\n\nReview each clip and determine if it is relevant to its paired sentence. Return JSON.`;

    try {
      const result = await callStructured({
        schema: ClipJudgeResponseSchema,
        system: buildClipJudgeSystemPrompt(),
        prompt: userPrompt,
        runName: `docu/youtube-clip-relevance-judge/attempt-${attempt}`,
        verbose: opts?.verbose,
        llm: LLM_JUDGE,
      });

      const dropSet = new Set(
        result.verdicts.filter((v) => !v.relevant).map((v) => v.clipIndex),
      );

      if (dropSet.size === 0) break;

      if (dropSet.size >= previousDropCount && attempt > 1) break;

      previousDropCount = dropSet.size;
      current = current.filter((_, i) => !dropSet.has(i));

      if (attempt <= MAX_CLIP_JUDGE_RETRIES) continue;
    } catch (err) {
      console.warn("[youtube-clips] Relevance judge call failed — returning original clips");
      return clips;
    }

    break;
  }

  return current;
}

// ── Public API ──────────────────────────────────────────────────────────

export async function generateYouTubeClipSpecs(
  sentences: SentenceDef[],
  segmentPlans: DocuSegmentPlan[],
  verifiedAnchors: Anchor[],
  topic: string,
  opts?: { verbose?: boolean },
): Promise<YouTubeClipSpec[]> {
  const numberedSentences = sentences
    .map((s, i) => `[${i}] ${s.text} (palette: ${s.palette})`)
    .join("\n");

  const anchorSummaries = verifiedAnchors
    .map((a) => `· ${a.id}: ${a.attribution.person ? `[${a.attribution.person}] ` : ""}${a.claim}${a.attribution.work ? ` (${a.attribution.work})` : ""}${a.attribution.year ? ` — ${a.attribution.year}` : ""}`)
    .join("\n");

  const segmentContext = segmentPlans
    .map((p) => {
      const role = ("arcRole" in p) ? (p as { arcRole: string }).arcRole : p.role ?? "context";
      return `· Segment ${p.index} "${p.title}" (${role}): ${p.intent}`;
    })
    .join("\n");

  const userPrompt = `Topic: ${topic}

## Segment Structure
${segmentContext}

## Research Anchors (with named authorities)
${anchorSummaries.length > 0 ? anchorSummaries : "No verified anchors available."}

## Full Narration (${sentences.length} sentences, 0-indexed)
${numberedSentences}

Select up to 5 sentences that would benefit most from authoritative interview footage. Remember: when a sentence references a named person from the anchors above, that person's name MUST appear in your searchQuery. Return your selections as JSON.`;

  try {
    const result = await callStructured({
      schema: YouTubeClipAnnotationSchema,
      system: buildSystemPrompt(),
      prompt: userPrompt,
      runName: "docu/youtube-clip-specs",
      verbose: opts?.verbose,
      llm: {
        ...LLM_DEFAULT,
        temperature: 0.5,
        maxTokens: 4000,
      },
    });

    if (!result.clips || result.clips.length === 0) {
      console.log("[youtube-clips] LLM selected 0 interview clips — video will use image B-roll only");
      return [];
    }

    console.log(`[youtube-clips] LLM selected ${result.clips.length} interview clips`);

    // Deterministic person-name injection
    const sentenceToAnchors = buildSentenceToAnchors(segmentPlans, verifiedAnchors, sentences.length);
    const enforcedClips = enforcePersonNames(result.clips, sentences, sentenceToAnchors);

    const gated = await gateYouTubeClipRelevance(enforcedClips, sentences, opts);
    if (gated.length < enforcedClips.length) {
      process.stderr.write(`[youtube-clips] Relevance gate dropped ${enforcedClips.length - gated.length} clip(s)\n`);
    }
    return gated;
  } catch (err) {
    console.warn(`[youtube-clips] LLM clip annotation failed: ${(err as Error).message}`);
    return [];
  }
}
