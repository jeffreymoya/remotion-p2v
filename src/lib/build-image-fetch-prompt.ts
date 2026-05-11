import fs from "node:fs";
import path from "node:path";
import type { StylePreset } from "./config";

const T2I_EXEMPLAR_PHOTOREAL_PATH = path.join("prompts", "t2i-single-object.txt");
const T2I_EXEMPLAR_FLAT_ICON_PATH = path.join("prompts", "t2i-flat-icon.txt");

function loadExemplar(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8").trim();
  } catch {
    return "(exemplar file not found)";
  }
}

export function buildImageFetchPrompt(
  narrative: string,
  visualGoal: string,
): { system: string; user: string } {
  const photorealExemplar = loadExemplar(T2I_EXEMPLAR_PHOTOREAL_PATH);
  const flatIconExemplar = loadExemplar(T2I_EXEMPLAR_FLAT_ICON_PATH);

  const system = `You are an image asset planner for Remotion video compositions. Given a scene narrative and visual goal, extract every visual asset referenced and produce a JSON asset plan.

Assets are acquired in two ways depending on role:
- **background** assets → downloaded from Pixabay via search query
- **non-background** assets (animated_object, static_overlay, screen_mockup) → generated via Runware text-to-image API

Workflow:
 1. Read the narrative and visual goal carefully.
2. Identify every visual asset the composition needs (backgrounds, props, screens, UI mockups, objects, people).
3. For each asset, determine the filename, visual requirements, rationale, and role-specific fields.
 4. Preserve the intended visual style from the visual goal.

Rules:
- Use .jpg for backgrounds and .png for all generated (non-background) assets.
- Every filename must live under public/images/.
- Categorize each asset_role precisely:
  - "background": full-frame scene/backdrop assets only.
  - "animated_object": props, people, products, icons, or visual elements that move independently.
  - "static_overlay": fixed foreground overlays, labels, decor, composited elements.
  - "screen_mockup": generic UI, device screens, app panels, charts, rectangular inserts.

BACKGROUND ASSETS (asset_role = "background"):
- Provide "query": a concise Pixabay search query (3–5 words, descriptive, photo-friendly).
- Do NOT provide t2i_prompt, model_tier, style_preset, or aspect_ratio.
- Requirements: landscape/full-frame, 1920x1080-safe, negative space for overlays.

NON-BACKGROUND ASSETS (all other roles):
- Provide "t2i_prompt": a detailed text-to-image generation prompt tailored to the chosen style_preset.
  - For style_preset "flat-illustration": write in this style —
    ---
    ${flatIconExemplar}
    ---
  - For style_preset "editorial-photoreal", "cinematic", or "3d-render": write in this style —
    ---
    ${photorealExemplar}
    ---
  Include: subject description, form/shape, materials/textures, color palette, background requirements (transparent/clean), technical specs. Match the tone of the chosen exemplar.
  Length: for model_tier "basic", keep t2i_prompt under 60 words — subject and key visual traits only, no alpha or background instructions (background removal is handled automatically). For model_tier "complex" or "portrait", write a full detailed prompt.
  Do NOT include style keywords that match your chosen style_preset — those are appended automatically.

- Provide "style_preset": choose ONE of the following based on the asset's visual intent:
  - "flat-illustration": icons, logos, simple props, screen mockups, data charts, UI overlays, any asset that should look 2D/vector/flat. DEFAULT for animated_object and static_overlay unless the asset is explicitly a person or a photorealistic product.
  - "editorial-photoreal": photorealistic people, faces, real-world objects shot as product photography.
  - "3d-render": objects that benefit from dimensional depth — physical products, architecture, 3D diagrams.
  - "cinematic": dramatic scenes with mood lighting (use rarely; only when ambience is the point).

- Provide "model_tier":
  - "basic": single, simple shape or icon (< 2 distinct elements, no masking or layering)
  - "complex": multi-element compositions, layered subjects, architecture, or any asset where one element is rendered in front of or cut out of another
  - "portrait": people, faces, characters
  Rule: if the subject contains two or more overlapping elements (e.g. a lock on a building, a logo on a device, a chart inside a frame) always use "complex".

- Provide "aspect_ratio": pick by natural object shape — "1:1" (square objects), "16:9" (wide/landscape), "9:16" (tall/portrait), "4:3", "3:2", or "21:9" (ultrawide).
- Do NOT provide "query".
- Set "needs_background_removal" true only if the object must be composited over another layer and needs transparent background via AI background removal after generation.

FUNCTIONAL ASSET GATE:
Each asset must state its visual_purpose. Permitted values: "diagram", "comparison", "concrete", "callout".
Do not plan assets that are purely decorative.

SIMULTANEOUS COUNT CHECK:
At no moment should more than 4 assets be visible at once.

Output ONLY a JSON array. Each item must include:
- "label": exact filename (e.g. "beach.jpg" for backgrounds, "laptop.png" for generated)
- "asset_role": "background" | "animated_object" | "static_overlay" | "screen_mockup"
- "visual_purpose": "diagram" | "comparison" | "concrete" | "callout"
- "needs_background_removal": boolean
- "visual_requirements": compact description of required subject, style, framing, exclusions
- "rationale": why this image fits the composition

Background-only fields:
- "query": Pixabay search query (3–5 words)

Non-background-only fields:
- "t2i_prompt": detailed text-to-image generation prompt
- "style_preset": "flat-illustration" | "editorial-photoreal" | "3d-render" | "cinematic"
- "model_tier": "basic" | "complex" | "portrait"
- "aspect_ratio": "1:1" | "16:9" | "9:16" | "4:3" | "3:2" | "21:9"`;

  const user = `Here is the scene narrative and visual goal. Extract all visual assets and produce the JSON asset plan.

--- Narrative ---
${narrative}

--- Visual Goal ---
${visualGoal}

--- End ---

Output ONLY the JSON array.`;
  return { system, user };
}

export type AssetRole = "background" | "animated_object" | "static_overlay" | "screen_mockup";

export interface ImageFetchItem {
  label: string;
  asset_role?: AssetRole;
  visual_purpose?: "diagram" | "comparison" | "concrete" | "callout";
  needs_background_removal?: boolean;
  /** @deprecated Use needs_background_removal instead. */
  needs_cutout?: boolean;
  visual_requirements: string;
  rationale: string;
  // Background-only
  query?: string;
  // Non-background (Runware)
  t2i_prompt?: string;
  style_preset?: StylePreset;
  model_tier?: "basic" | "complex" | "portrait";
  aspect_ratio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:2" | "21:9";
  // Set after acquisition
  resolved_path?: string;
  resolution_error?: string;
  runware_image_uuid?: string;
  background_removed?: boolean;
  background_removal_model?: string;
  background_removal_error?: string;
  /** @deprecated Use resolved_path plus background_removed metadata instead. */
  cutout_path?: string;
  /** @deprecated Use background_removal_error instead. */
  cutout_error?: string;
  /** @deprecated Use background_removed instead. */
  cutout_success?: boolean;
  /** @deprecated Manual legacy background-removal scripts only. */
  cutout_source_path?: string;
}

export function parseImageFetchResponse(raw: string): ImageFetchItem[] {
  const trimmed = raw.trim();
  const jsonStart = trimmed.indexOf("[");
  const jsonEnd = trimmed.lastIndexOf("]");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("No JSON array found in DeepSeek image fetch response");
  }
  const json = trimmed.slice(jsonStart, jsonEnd + 1);
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) {
    throw new Error("Image fetch response is not an array");
  }
  for (const item of parsed) {
    if (!item.label || !item.visual_requirements) {
      throw new Error("Each image fetch item must have label and visual_requirements");
    }
    if (
      item.needs_background_removal === undefined &&
      item.needs_cutout !== undefined
    ) {
      item.needs_background_removal = item.needs_cutout;
    }
  }
  return parsed as ImageFetchItem[];
}
