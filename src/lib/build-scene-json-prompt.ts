import fs from "node:fs";
import path from "node:path";
import { renderCatalogForPrompt } from "./component-catalog";
import type { ImageFetchItem } from "./build-image-fetch-prompt";

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
\`\`\``;

function loadExemplar(): string {
  const exemplarPath = path.join("prompts", "the-secret-rise-of-quiet-vacationing-0-00-0-30-scene.json");
  if (fs.existsSync(exemplarPath)) {
    return fs.readFileSync(exemplarPath, "utf-8");
  }
  return "";
}

export function buildSceneJsonPrompt(
  remotionPrompt: string,
  imageItems: ImageFetchItem[] = [],
  slug: string,
  durationInFrames: number,
): { system: string; user: string } {
  const catalog = renderCatalogForPrompt();
  const exemplar = loadExemplar();
  const assetManifest = formatAssetManifest(imageItems);

  const system = `You are a Remotion scene script author. Return ONLY valid JSON matching the SceneScript schema. No markdown fences. No prose.

--- BLOCK CATALOG ---
${catalog}

--- SCHEMA SUMMARY ---
${SCHEMA_SUMMARY}

${exemplar ? `--- EXEMPLAR ---\n${exemplar}\n` : ""}
--- CONSTRAINTS ---
- Total durationInFrames = ${durationInFrames}
- Frame ranges should cover the full duration with intentional spacing
- Scenes are rendered with cross-fade overlap at boundaries (default 15 frames)
- Every asset used in a block must appear in the top-level assets[] array with its exact label and path from the asset manifest
- Scene block asset fields must use asset labels, not paths. The renderer resolves labels to their public static paths
- NEVER use CustomScene — it renders a placeholder error. Every scene MUST use a typed block from the catalog above. If no block fits perfectly, pick the closest match and adapt the props
- Max 4 simultaneous visual elements at any frame
- slug must be "${slug}"
- fps must be 30, width 1920, height 1080
- No markdown fences, no prose — JSON only`;

  const assetInstructions = assetManifest
    ? `\nAvailable image assets:\n${assetManifest}\n\nUse these exact label values when referencing assets in blocks. Copy the matching path value into assets[].path for every asset you include.\n`
    : "";

  const user = `Write a scene script JSON for this Remotion prompt:

${remotionPrompt}
${assetInstructions}
Return ONLY the JSON. No explanation. No markdown fences.`;

  return { system, user };
}
