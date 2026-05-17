import { z } from "zod";
import { deepseekChat } from "../deepseek";
import { CODE_GEN_TEMPERATURE, NARRATION_REASONING } from "../config";
import type { SentenceTiming } from "./sentence-segmenter";

// ── Clip plan schema ────────────────────────────────────────────────────
const ClipPlanItemSchema = z.object({
  queries: z.array(z.string().min(1)).min(1).max(3),
  sentenceIndexes: z.array(z.number().int().min(0)).min(1),
});

export const ClipPlanSchema = z.object({
  strategy: z.enum(["single", "multi"]),
  clips: z.array(ClipPlanItemSchema).min(1),
});

export type ClipPlanItem = z.infer<typeof ClipPlanItemSchema>;
export type ClipPlan = z.infer<typeof ClipPlanSchema>;

const SYSTEM_PROMPT = `You are a video director choosing stock video clips for an inspirational narration video.

Given a narration and its sentence-level timings, decide how many background video clips to use and what Pixabay search queries to use for each.

## Strategy
- "single": One video clip for the entire narration. Use when the narration has a single cohesive theme or visual mood.
- "multi": Multiple clips, each covering a group of thematically related sentences. Use when the narration shifts topics or visual moods.

## Rules
1. Every sentence must be covered by exactly one clip (no gaps, no overlaps).
2. Sentence indexes must be contiguous within each clip group.
3. Approved visual categories — mix them across clips for variety:
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
   Aim for emotional resonance in every clip selection.
4. Prefer horizontal/landscape orientation footage.
5. Use 2-4 word queries for best Pixabay results.
6. For "single" strategy, clips array must have exactly 1 entry with ALL sentence indexes.

## Narrative Specificity — Ordered Query List

For each clip group, produce a \`queries\` array (1–3 items), ordered from MOST SPECIFIC to MOST GENERIC:

### When to use a specific query first:
If the covered sentences describe a concrete, visualizable scene — a specific activity, setting, or person doing something identifiable — lead with a content-matched query:
- "man walking empty road" (not "person silhouette")
- "hands writing journal candlelight" (not "person reflection window")
- "elderly man porch rocking chair" (not "solitary figure sunset")
- "child running field sunset" (not "nature landscape golden")

### When to use only generic queries:
If the sentences are abstract or thematic (discipline, resilience, purpose, growth) with no concrete visual anchor, skip specific queries and use 1–2 generic emotion/landscape queries from the approved categories.

### Always end with a generic fallback:
The LAST item in \`queries\` must always be a generic emotion/landscape or contemplative human query from the approved categories. This is the fallback if no specific clip is found.

### All queries must still obey the FORBIDDEN content rules.

## REQUIRED CONTENT — every clip MUST be one of these
Every video clip must clearly depict one of the following subjects:
- A REAL LANDSCAPE or NATURAL SCENERY (mountains, oceans, forests, deserts, rivers, skies, fields)
- A REAL CITYSCAPE or URBAN SCENE (skylines, streets, bridges, architecture at dawn/dusk/night)
- A REAL HUMAN in a contemplative, reflective, or emotional state (silhouette, walking alone, looking out)
- WEATHER or ATMOSPHERIC phenomena in context (rain on a city, fog over hills, storm over ocean, sunrise)

The video must feel cinematic, emotionally evocative, and appropriate for a motivational/inspirational narration.

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
Every clip must show a RECOGNIZABLE CINEMATIC SCENE — a real place, a real person in reflection, or real weather/nature at scale — that evokes deep emotion suitable for a 10-15 minute motivational narration. If a query could plausibly return animals, toys, holiday items, or random objects, DO NOT use it.

## Output
Return a JSON object matching this shape:
\`\`\`json
{
  "strategy": "single" | "multi",
  "clips": [
    { "queries": ["man sitting porch reflection", "person window reflection", "figure hill overlook"], "sentenceIndexes": [0, 1, 2] }
  ]
}
\`\`\`

Each clip's \`queries\` array is ordered specific-to-generic. The last entry must be a safe generic fallback.`;

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
        `[${s.sentenceIndex}] ${s.startSeconds.toFixed(1)}s–${s.endSeconds.toFixed(1)}s: "${s.text}"`,
    )
    .join("\n");

  const userPrompt = `Here is the narration:

"""
${narration}
"""

Sentence timings:
${sentenceSummary}

Choose a video strategy and Pixabay search queries. Return ONLY the JSON.`;

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
