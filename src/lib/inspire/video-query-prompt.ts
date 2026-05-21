import { z } from "zod";
import { deepseekChat } from "../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING, SHOT_TARGET_SECONDS } from "../config";
import type { SentenceTiming } from "./sentence-segmenter";

// ── Clip plan schema (v2 — shot-based) ──────────────────────────────────
const ShotPlanItemSchema = z.object({
  query: z.string().min(1),
  mediaType: z.enum(["image", "video"]).default("video"),
});

const ClipPlanItemSchema = z.object({
  sentenceIndexes: z.array(z.number().int().min(0)).min(1),
  shots: z.array(ShotPlanItemSchema).min(1),
});

export const ClipPlanSchema = z.object({
  schemaVersion: z.literal(2),
  strategy: z.enum(["single", "multi"]),
  clips: z.array(ClipPlanItemSchema).min(1),
});

export type ClipPlanItem = z.infer<typeof ClipPlanItemSchema>;
export type ClipPlan = z.infer<typeof ClipPlanSchema>;
export type ShotPlanItem = z.infer<typeof ShotPlanItemSchema>;

const SYSTEM_PROMPT = `You are a video director choosing stock video clips for an inspirational narration video.

Given a narration and its sentence-level timings, decide how many background clips (narrative scenes) to use and what shots (2-5 second visual beats) belong to each clip.

## Strategy
- "single": One clip for the entire narration. Use when the narration has a single cohesive theme or visual mood.
- "multi": Multiple clips, each covering a group of thematically related sentences. Use when the narration shifts topics or visual moods.

## Rules
1. Every sentence must be covered by exactly one clip (no gaps, no overlaps).
2. Sentence indexes must be contiguous within each clip group.

## SHOT PLANNING

For each clip (narrative scene), plan exactly the number of shots computed by the formula below.

**targetShotCount formula:**
  targetShotCount = ceil(totalSentenceSeconds / ${SHOT_TARGET_SECONDS})

Where totalSentenceSeconds = sum of (endSeconds - startSeconds) across all sentences in the clip.
Clamp: minimum 1 shot per clip.

Each shot must have:
1. query — a visually specific keyword phrase extracted from the covered sentence content:
   - Pull the most concrete noun phrase, named entity, or visual concept from the sentence
   - "Jerry Seinfeld sat at a small desk in 1976" → "vintage desk small room 1970s"
   - "A meta-analysis in Perspectives on Psychological Science" → "research papers academic journal"
   - "The Beatles played marathon sets in Hamburg" → "band performing nightclub stage"
   - "Most of us carry a notebook somewhere" → "blank notebook open pages pen"
   - Abstract sentences with no concrete visual → "contemplative person window light" (fallback)

2. mediaType — "image" or "video" using these rules:
   - "video" for reflective, emotional, nature, motion-adds-depth moments
   - "image" for factual, action-narrative, keyword-specific b-roll
   - Default to "video"
   - Aim for roughly 20-40% image shots for visual variety

## SHOT QUERY RULES
- Each shot within a clip MUST be visually DISTINCT from the others
- If a sentence has no unique sub-concept for a shot, vary the angle/context:
  "busy city street morning" → shot 2: "pedestrian crossing commute" → shot 3: "office building entrance"
- Never repeat the same query within a clip
- All forbidden content rules apply to each shot query
- Last shot in each clip MUST have a generic fallback quality query (still keyword-specific but safe)

## Approved visual categories — mix them across clips for variety:
- Nature / landscape (emotionally evocative): "mountain sunrise mist", "ocean waves calm", "forest light morning",
  "rain drops leaves", "sunset clouds golden", "river flowing forest", "fog rolling hills"
- Moody cityscapes (cinematic, atmospheric): "city rain night", "neon reflections rain", "empty street dawn",
  "city skyline dusk", "bridge fog morning"
- Human subject (contemplative): a single person in a reflective, introspective, or emotional state.
  Prefer everyday, non-glamour contexts with clear clothing and no beachwear or sensual posing.
  Examples: "person window light", "person train window reflection", "man silhouette mountain",
  "figure hill overlook", "person rain street", "walker empty road dawn"

For motivational or introspective narrations, include at least one clip from the
"Human subject (contemplative)" category and at least one from "Nature / landscape".
Aim for emotional resonance in every shot selection.

## Narrative Specificity

When the covered sentences describe a concrete, visualizable scene — a specific activity, setting, or person doing something identifiable — lead with content-matched shot queries:
- "man walking empty road" (not "person silhouette")
- "hands writing journal candlelight" (not "person reflection window")
- "elderly man porch rocking chair" (not "solitary figure sunset")
- "child running field sunset" (not "nature landscape golden")

If the sentences are abstract or thematic (discipline, resilience, purpose, growth) with no concrete visual anchor, use generic emotion/landscape/human queries from the approved categories.

All queries must still obey the FORBIDDEN content rules.

## REQUIRED CONTENT — every shot MUST be one of these
Every shot must clearly depict one of the following subjects:
- A REAL LANDSCAPE or NATURAL SCENERY (mountains, oceans, forests, deserts, rivers, skies, fields)
- A REAL CITYSCAPE or URBAN SCENE (skylines, streets, bridges, architecture at dawn/dusk/night)
- A REAL HUMAN in a contemplative, reflective, or emotional state (silhouette, walking alone, looking out)
- WEATHER or ATMOSPHERIC phenomena in context (rain on a city, fog over hills, storm over ocean, sunrise)

The shots must feel cinematic, emotionally evocative, and appropriate for a motivational/inspirational narration.

## FORBIDDEN content — NEVER use queries that could return any of these
Content that is off-topic, distracting, or tonally wrong for inspirational videos:

### Animals & Pets (STRICTLY FORBIDDEN)
- No dogs, cats, birds, fish, horses, deer, rabbits, or ANY domestic/wild animals
- No pets of any kind — no animal close-ups, no animals in yards/parks/nature
- No wildlife footage (lions, eagles, wolves, etc.) — even if metaphorically relevant
- No insects, reptiles, marine animals

### Toys, Objects & Holiday Items (STRICTLY FORBIDDEN)
- No stuffed animals, plush toys, dolls, figurines, action figures
- No Christmas decorations, Santa hats, Easter bunnies, Halloween items
- No seasonal/holiday-themed content of any kind
- No product shots, commercial items, branded merchandise

### Abstract & Non-Scenic Visuals (STRICTLY FORBIDDEN)
- No smoke, particles, fractals, bokeh, CGI, motion graphics, flowing light
- No inanimate close-ups: candles, clocks, gears, machinery, food, text on screen
- No random motion: ink in water, paint mixing, bubbles, liquid pour
- No screen recordings, presentations, slideshows, or text overlays

### Unsuitable Tone (STRICTLY FORBIDDEN)
- No comedy, slapstick, bloopers, pranks, memes
- No sports highlights, competitions, gaming footage
- No children's content, cartoons, animations
- No crowds, parties, concerts, festivals, celebrations
- No medical, surgical, or clinical footage

### Sexualized Or Glamour Imagery (STRICTLY FORBIDDEN)
- No sexy, sensual, seductive, or erotic themes
- No bikinis, swimsuits, swimwear, lingerie, underwear, or boudoir imagery
- No glamour-model framing, suggestive posing, body-emphasis shots, or exposed-body closeups
- No beachwear or shirtless/body-display footage unless the subject is incidental in a wide scenic landscape

### KEY PRINCIPLE
Every shot must show a RECOGNIZABLE CINEMATIC SCENE — a real place, a real person in reflection, or real weather/nature at scale — that evokes deep emotion suitable for a 10-15 minute motivational narration. If a query could plausibly return animals, toys, holiday items, or random objects, DO NOT use it.

## Output
Return a JSON object matching this shape:
\`\`\`json
{
  "schemaVersion": 2,
  "strategy": "single" | "multi",
  "clips": [
    {
      "sentenceIndexes": [0, 1, 2],
      "shots": [
        { "query": "vintage desk small room 1970s", "mediaType": "image" },
        { "query": "stand-up comedian notebook writing", "mediaType": "video" },
        { "query": "new notebook blank pages pen", "mediaType": "image" }
      ]
    }
  ]
}
\`\`\``;

function stripJsonFences(raw: string): string {
  return raw
    .replace(/^[\s\n]*```(?:json)?\s*\n?/, "")
    .replace(/[\s\n]*```[\s\n]*$/, "")
    .trim();
}

export async function generateClipPlan(
  narration: string,
  sentences: SentenceTiming[],
  options?: { verbose?: boolean },
): Promise<ClipPlan> {
  const sentenceSummary = sentences
    .map(
      (s) =>
        `[${s.sentenceIndex}] ${s.startSeconds.toFixed(1)}s–${s.endSeconds.toFixed(1)}s (${((s.endSeconds - s.startSeconds)).toFixed(1)}s): "${s.text}"`,
    )
    .join("\n");

  const userPrompt = `Here is the narration:

"""
${narration}
"""

Sentence timings (with durations for shot count calculation):
${sentenceSummary}

Choose a video strategy and plan shots per clip using the targetShotCount formula.
Return ONLY the JSON.`;

  const raw = await deepseekChat(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    CODE_GEN_TEMPERATURE,
    NARRATION_REASONING,
    { verbose: options?.verbose, runName: "video-query" },
  );

  const cleaned = stripJsonFences(raw);
  const parsed = JSON.parse(cleaned);
  return ClipPlanSchema.parse(parsed);
}
