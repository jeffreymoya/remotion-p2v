import type { Segment } from "./parse-script";

export function buildPrompt(slug: string, segment: Segment, exemplars: string[]): { system: string; user: string } {
  const exemplarText = exemplars
    .map((e, i) => `--- Example Remotion Prompt ${i + 1} ---\n${e}`)
    .join("\n\n");

  const system = `You are an expert Remotion animator. Given a script segment and example Remotion prompts, produce a detailed Remotion prompt that describes a self-contained Remotion composition for that segment.

The Remotion prompt must include:
- Composition dimensions (typically 1920x1080 if not specified)
- Duration in frames (at 30fps)
- All visual elements: backgrounds, text, images, animations, transitions
- Timing for each element (exact frames)
- Sequence of animations
- Best practices: use staticFile() for any asset references

VISUAL DISCIPLINE RULES (mandatory):
Every visual element must serve exactly one of these four functional roles:
  - diagram: explains a mechanism or relationship
  - comparison: shows options, data, or a contrast (graph, table, split-screen)
  - concrete: makes an abstract idea tangible (b-roll, real-world image)
  - callout: emphasizes a single key phrase or conclusion

Do NOT include decorative visuals. If an element cannot be assigned one of the four roles, cut it.
Cap simultaneous on-screen elements at 4 at any given moment.

VIEWER PROMISE RULE:
Every segment composition must include an explicit "what you'll know by the end" card or text element — even if the script narrative does not have one. Place it in the last 5 seconds of the composition.

RETENTION BEATS:
For segments ≥ 20 seconds, include at least one retention beat (micro-question, contrast reveal, or reframe) between the hook and the closing.

OUTPUT FORMAT:
After your composition narrative description, append:

ELEMENT TABLE:
| Element | Visual role | Frame range | Simultaneous count |
| ------- | ----------- | ----------- | ------------------ |
(one row per scene element)

RUBRIC SCORE:
Score each category 1–5:
- Hook creates curiosity within 10 seconds: /5
- Viewer promise is explicit: /5
- Max 4 elements on screen at once: /5
- Every element has a functional visual role: /5
Total: /20

Do NOT emit a composition prompt scoring below 14/20. Revise first.

Keep the prompt focused on what to build. Do NOT write the React code yet — just describe the composition in natural language.`;

  const user = `${exemplarText}

---
Now write a Remotion prompt for the script segment titled "${segment.title}" (${slug}):

Timeline: ${segment.startSeconds}s to ${segment.endSeconds}s

Segment narrative (derive all visual direction from this):
${segment.narrative}

Produce a detailed Remotion prompt for this segment. Design all visuals, animations, transitions, and scene composition from scratch based on the narrative.`;

  return { system, user };
}
