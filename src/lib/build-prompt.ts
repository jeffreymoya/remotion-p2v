import type { Segment } from "./parse-script";

export function buildPrompt(slug: string, segment: Segment, exemplars: string[]): { system: string; user: string } {
  const exemplarText = exemplars
    .map((e, i) => `--- Example Remotion Prompt ${i + 1} ---\n${e}`)
    .join("\n\n");

  const system = `You are an expert Remotion animator. Given a script segment and example Remotion prompts, produce a detailed Remotion prompt that describes a self-contained Remotion composition for that segment.

The Remotion prompt must include:
- Composition dimensions (typically 1920x1080 if not specified)
- Duration in frames (at 30fps)
- Animation style: beat-synced motion collage using animated photo cutouts
- All visual elements: backgrounds, text, images, animations, transitions
- Timing for each element (exact frames)
- Sequence of animations
- Best practices: use staticFile() for any asset references

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
