import fs from "node:fs";
import path from "node:path";
import { renderCatalogForPrompt } from "./component-catalog";
import type { ImageFetchItem } from "./build-image-fetch-prompt";
import type { WordTiming } from "./tts-elevenlabs";

function toAssetPath(item: ImageFetchItem): string {
  const assetPath = item.cutout_path ?? item.resolved_path ?? item.label;
  return assetPath
    .replace(/\\/g, "/")
    .replace(/^\.?\//, "")
    .replace(/^public\//, "");
}

function formatAssetManifest(imageItems: ImageFetchItem[]): string {
  if (imageItems.length === 0) return "";

  return imageItems
    .map((item) => {
      const status = item.resolution_error ? `unresolved` : "available";
      return `- label: "${item.label}" | path: "${toAssetPath(item)}" | role: ${item.asset_role ?? "unspecified"} | status: ${status}`;
    })
    .join("\n");
}

const SCHEMA_SUMMARY = `\`\`\`typescript
SceneScript {
  schemaVersion: 1,
  title: string,
  slug: string,       // kebab-case composition ID
  durationInFrames: number,  // (endSeconds - startSeconds) * 30
  fps: 30,
  width: 1920,
  height: 1080,
  crossFadeFrames?: number,  // frames of overlap between scenes (default: 15)
  assets: Array<{ label: string, path?: string, role: "background"|"animated_object"|"static_overlay"|"screen_mockup", cutoutPath?: string }>,
  scenes: Array<SceneBlock>,  // ordered by frameRange; each block has { type, frameRange: [start, end], ...blockProps }>
}

// Each scene block also accepts:
// transition?: { kind: "fade" }
//            | { kind: "slide", direction?: "from-left"|"from-right"|"from-top"|"from-bottom" }
//            | { kind: "flip",  direction?: "from-left"|"from-right"|"from-top"|"from-bottom" }
//            | { kind: "wipe",  direction?: "from-left"|"from-right"|"from-top"|"from-bottom"|
//                                           "from-top-left"|"from-top-right"|
//                                           "from-bottom-left"|"from-bottom-right" }
\`\`\``;

// Stable hand-crafted exemplar demonstrating professional block variety.
const EXEMPLAR_PATH = path.join("prompts", "exemplar-professional-scene.json");

function loadExemplar(): string {
  if (fs.existsSync(EXEMPLAR_PATH)) {
    return fs.readFileSync(EXEMPLAR_PATH, "utf-8");
  }
  return "";
}

const NARRATIVE_RULES = `--- MANDATORY NARRATIVE RULES (violations = bad output) ---

1. OPENING HOOK (REQUIRED): The FIRST block in "scenes" MUST be one of:
   ContradictionHook, CostOfIgnoranceHook, HiddenMechanismHook, MythVsEvidenceHook.
   No other block type is permitted in position 0. This is non-negotiable.

2. BLOCK VARIETY (REQUIRED): Use at least 4 DISTINCT block types per script.
   Repeating the same block type back-to-back is forbidden.
   BRoll may appear at most TWICE total per script.

3. BRoll DISCIPLINE (CRITICAL): BRoll is a STANDALONE cutaway (30–90 frames).
   NEVER use BRoll as a persistent backdrop for text blocks (Callout, MicroQuestion, Reveal, etc.).
   Text blocks must have their own dedicated frame range on a clean dark background.
   Layering text over BRoll creates illegible, amateurish visuals.

4. TRANSITIONS (REQUIRED): Every block AFTER the first MUST include a "transition" field.
   Vary the kinds — do not repeat the same kind more than twice.
   Use: slide (directional movement), wipe (masked reveal), flip (3D), fade (subtle).
   Diagonal wipes (from-top-left, from-top-right, etc.) require kind "wipe".

5. RETENTION BLOCK (REQUIRED): Every script MUST include at least ONE of:
   StatCounter, ContrastReveal, Reveal, Reframe, MiniPayoff, Foreshadow.

6. FRAME BUDGET per block type:
   - Hook blocks (ContradictionHook, etc.): 90–150 frames minimum
   - BRoll cutaways: 30–90 frames only
   - Data/comparison (StatCounter, ComparisonSplit, DiagramScene): 90–180 frames
   - Text reveal (ContrastReveal, Reveal, Reframe, ContrastReveal): 90–150 frames
   - Callout: 45–90 frames — maximum, this is a punch not a lecture
   - MicroQuestion, PromiseCard, ContextCard: 60–120 frames

7. CALLOUT QUALITY: Callout "phrase" must NEVER be an empty string.
   Every Callout must have substantive, non-empty text.

8. DIAGRAM QUALITY: DiagramScene must have at least 3 meaningful nodes.
   A single "?" node is meaningless — use MicroQuestion instead.

9. ASSET DISCIPLINE: Only reference labels from the asset manifest.
   If no assets are available, use ZERO BRolls and rely on text-based blocks.
   Do not fabricate asset labels.

10. OVERLAY ENTRANCE VARIETY: BRoll overlayAssets should use a MIX of entrance styles
    (springPop, slideUp, slideLeft) — not just fadeIn for every overlay.`;

function formatWordTimingHint(wordTimings: WordTiming[], fps: number): string {
  if (wordTimings.length === 0) return "";

  // Group words into ~1.5-second chunks for a compact frame guide
  const chunks: Array<{ startFrame: number; endFrame: number; text: string }> = [];
  let chunkWords: string[] = [];
  let chunkStart = Math.round(wordTimings[0].startSeconds * fps);

  for (const wt of wordTimings) {
    chunkWords.push(wt.word);
    const elapsed = wt.endSeconds - wordTimings[0].startSeconds;
    const chunkDuration = wt.endSeconds - (chunkWords.length > 1
      ? wordTimings[wordTimings.indexOf(wt) - chunkWords.length + 1]?.startSeconds ?? 0
      : wt.startSeconds);

    if (chunkDuration >= 1.5 || wt === wordTimings[wordTimings.length - 1]) {
      const endFrame = Math.round(wt.endSeconds * fps);
      chunks.push({
        startFrame: chunkStart,
        endFrame,
        text: chunkWords.join(" "),
      });
      chunkWords = [];
      chunkStart = endFrame;
    }
  }

  return chunks
    .map((c) => `frame ${c.startFrame}–${c.endFrame}: "${c.text}"`)
    .join("\n");
}

export function buildSceneJsonPrompt(
  remotionPrompt: string,
  imageItems: ImageFetchItem[] = [],
  slug: string,
  durationInFrames: number,
  wordTimings?: WordTiming[],
  audioFile?: string,
): { system: string; user: string } {
  const catalog = renderCatalogForPrompt();
  const exemplar = loadExemplar();
  const assetManifest = formatAssetManifest(imageItems);

  const system = `You are a Remotion scene script author. Return ONLY valid JSON matching the SceneScript schema. No markdown fences. No prose.

--- BLOCK CATALOG ---
${catalog}

--- SCHEMA SUMMARY ---
${SCHEMA_SUMMARY}

${exemplar ? `--- EXEMPLAR (study this — it shows professional block variety and proper transitions) ---\n${exemplar}\n` : ""}
${NARRATIVE_RULES}

--- HARD CONSTRAINTS ---
- Total durationInFrames = ${durationInFrames}
- Frame ranges must cover the full duration with no dead frames at the end
- crossFadeFrames = 15 (default); only increase to 30 for deliberate slow dissolves
- Every asset used in a block must appear in top-level assets[] with its exact label and path
- Scene block asset fields use asset labels (not paths) — renderer resolves them
- NEVER use CustomScene — it renders a red error box
- Max 4 simultaneous visual elements at any frame
- slug must be "${slug}"
- fps must be 30, width 1920, height 1080
- No markdown fences, no prose — JSON only`;

  const assetInstructions = assetManifest
    ? `\nAvailable image assets:\n${assetManifest}\n\nUse these exact label values when referencing assets in blocks. Copy the matching path value into assets[].path for every asset you include.\n`
    : "";

  const timingHint = wordTimings && wordTimings.length > 0
    ? `\n--- WORD TIMING GUIDE (align block frameRanges to these boundaries) ---\n${formatWordTimingHint(wordTimings, 30)}\n`
    : "";

  const audioInstruction = audioFile
    ? `\nIMPORTANT: Include "audioFile": "${audioFile}" in the top-level JSON object.\n`
    : "";

  const user = `Write a scene script JSON for this Remotion prompt:

${remotionPrompt}
${assetInstructions}${timingHint}${audioInstruction}
Return ONLY the JSON. No explanation. No markdown fences.`;

  return { system, user };
}
