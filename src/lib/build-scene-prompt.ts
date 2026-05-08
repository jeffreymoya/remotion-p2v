import type { SceneSpec } from "./scene-manifest";

export function buildScenePrompt(
  scene: SceneSpec,
  segmentTitle: string,
  segmentSlug: string,
  exemplars: string[],
): { system: string; user: string } {
  const exemplarText = exemplars
    .map((e, i) => `--- Example Remotion Prompt ${i + 1} ---\n${e}`)
    .join("\n\n");

  const sceneDuration = scene.endSeconds - scene.startSeconds;

  const system = `You are an expert Remotion animator. Given a single scene from a larger video segment, produce a detailed Remotion prompt for a self-contained Remotion composition for that scene.

The Remotion prompt must include:
- Composition dimensions: 1920x1080
- Duration: ${sceneDuration} seconds (${Math.round(sceneDuration * 30)} frames at 30fps)
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

This scene is ${sceneDuration}s. Include a viewer promise element only if this scene is the last one of the segment. For scenes ≥ 10s, include at least one retention beat (micro-question, contrast reveal, or reframe).

This scene's visual goal: "${scene.visualGoal}"

OUTPUT FORMAT:
After your composition narrative description, append:

ELEMENT TABLE:
| Element | Visual role | Frame range | Simultaneous count |
| ------- | ----------- | ----------- | ------------------ |
(one row per scene element)

RUBRIC SCORE:
Score each category 1–5:
- Hook/opening creates curiosity immediately: /5
- Every element has a functional visual role: /5
- Max 4 elements on screen at once: /5
- Scene matches the visual goal: /5
Total: /20

Do NOT emit a composition prompt scoring below 14/20. Revise first.

Keep the prompt focused on what to build. Do NOT write the React code yet — just describe the composition in natural language.`;

  const user = `${exemplarText}

---
Now write a Remotion prompt for scene ${scene.sceneIndex} "${scene.title}" from the segment "${segmentTitle}" (${segmentSlug}):

Scene timing: ${scene.startSeconds}s to ${scene.endSeconds}s (duration: ${sceneDuration}s, ${Math.round(sceneDuration * 30)} frames at 30fps)

Scene visual goal: ${scene.visualGoal}

Scene narrative (derive all visual direction from this):
${scene.narrative}

Produce a detailed Remotion prompt for this single scene. Design all visuals, animations, transitions, and scene composition from scratch based on the narrative and visual goal.`;

  return { system, user };
}
