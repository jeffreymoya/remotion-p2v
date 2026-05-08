export function buildImageFetchPrompt(
  remotionPrompt: string,
): { system: string; user: string } {
  const system = `You are an image asset planner for Remotion video compositions. Given a Remotion composition prompt, extract every visual asset referenced and produce a JSON download plan.

Workflow:
1. Read the Remotion prompt carefully.
2. Identify every visual asset the composition needs (backgrounds, props, screens, UI mockups, objects, people).
3. For each asset, determine the filename, search query, visual requirements, rationale, and optional direct image URL/source URL hints.
4. Preserve the intended visual style of the Remotion composition. Treat the composition prompt as the creative brief, not just a list of nouns.

Rules:
- Use .jpg for full-screen photographic backgrounds and .png for overlays / transparent-isolated assets.
- Every filename must live under public/images/.
- Image URLs may come from any reputable source, not only Unsplash.
- The CLI will run live image search from the "query" value, so the query must be the primary source of truth.
- If you are certain of a stable direct URL, "image_url" may be a direct, publicly fetchable HTTPS URL that returns an image file, not an HTML source page. Otherwise set it to an empty string.
- Prefer stable direct image URL hints from hosts that allow automated unauthenticated downloads, such as images.pexels.com, images.unsplash.com, upload.wikimedia.org, official media/press CDNs, or other public image hosts.
- Do not use cdn.pixabay.com URLs. They are commonly hotlink-protected and return HTTP 403 in automated downloads.
- Do not invent plausible-looking historical CDN URLs. Use only URLs that are likely to be stable, current, and directly fetchable.
- Do not use URLs that require authentication, cookies, JavaScript, anti-bot checks, signed short-lived tokens, or manual download confirmation.
- Search queries must be specific enough to recover a visually equivalent replacement, including subject, style, angle, background, mood, color, composition, and isolated/transparent needs.
- Prefer isolated/subject-on-clean-background assets for overlays.
- For assets requiring transparency, avoid preview PNGs with checkerboard backgrounds baked into the pixels. The downloaded file must either have real alpha transparency or a simple removable real background.
- No watermarks, no AI-looking artifacts, no copyrighted screenshots (use generic mockups).
- Do not drift from the composition's intended style. Match the prompt's described tone, palette, perspective, realism level, framing, and animation role.
- Do not pick generic images that only match the object name. The image must fit how the asset appears in the scene.
- Categorize each asset_role precisely:
  - "background": full-frame scene/backdrop assets only.
  - "animated_object": props, people, products, icons, or visual elements that move independently or are positioned at coordinates.
  - "static_overlay": fixed foreground overlays, labels, decor, cutout objects, or composited elements that sit over another scene.
  - "screen_mockup": generic UI, device screens, app panels, charts, or rectangular inserts.
- Role-specific requirements:
  - background: landscape/full-frame, 1920x1080-safe, safe central subject placement, negative space requirements, and legible overlay zones.
  - animated_object: source-native sizing is fine, subject fully visible, padded edges, silhouette clarity, transparent PNG preferred, no forced 16:9 crop.
  - static_overlay: transparent or isolated preferred, object angle/style clarity, no forced 16:9 crop.
  - screen_mockup: flat/generic UI insert, clean rectangular crop, no copyrighted or real private content, not necessarily 1920x1080.
- Set needs_cutout true for animated_object/static_overlay items that should become transparent PNG cutouts after download. Prefer preferred_format "png" for those items.
- Add clear exclusions in "visual_requirements" when adjacent-looking assets would be wrong.

FUNCTIONAL ASSET GATE:
Each asset must state its visual_purpose. Permitted values: "diagram", "comparison", "concrete", "callout".
Do not plan assets that are purely decorative (e.g. random animals, generic crowd shots, abstract splatter).
If an asset exists only to fill space or "look dynamic", remove it.

SIMULTANEOUS COUNT CHECK:
At no moment in the composition should more than 4 assets be visible at once.
Flag any time window where the combined asset count exceeds this.

Output ONLY a JSON array. Each item must include:
- "label": exact filename used in the composition (e.g. "beach.jpg")
- "asset_role": "background", "animated_object", "static_overlay", or "screen_mockup"
- "visual_purpose": "diagram", "comparison", "concrete", or "callout"
- "needs_cutout": boolean
- "preferred_format": "jpg" or "png"
- "image_url": optional direct downloadable image URL hint, or empty string
- "source_url": optional source/attribution page URL for the image, or empty string
- "query": live image search query
- "visual_requirements": compact but specific description of the required subject, style, crop/framing, background, colors/mood, and exclusions
- "rationale": why this image fits the composition`;

  const user = `Here is the Remotion composition prompt. Extract all visual assets from it and produce the JSON download plan.

--- Remotion Prompt ---
${remotionPrompt}

--- End Prompt ---

Output ONLY the JSON array.`;
  return { system, user };
}

export function buildImageFetchRepairPrompt(
  remotionPrompt: string,
  failedItems: ImageFetchItem[],
  failures: Array<{ label: string; url?: string; error?: string }>,
): { system: string; user: string } {
  const system = `You are repairing a Remotion image download plan after deterministic URL validation failed.

Rules:
- Output ONLY a JSON array.
- Return one replacement item for each failed label and no extra labels.
- Keep the exact same "label" values from the failed items.
- Preserve each failed item's asset_role, visual_purpose, needs_cutout, and preferred_format values exactly when present. If a legacy failed item is missing one of those fields, infer the safest value from its label and visual_requirements.
- Preserve the original visual_requirements and intended Remotion composition style.
- Replace image_url with a different direct, publicly fetchable HTTP(S) image URL.
- Do not reuse any failed URL.
- Do not use URLs from hosts that block automated downloads, especially cdn.pixabay.com.
- Prefer stable direct image URLs from hosts that allow unauthenticated automated fetches, such as images.pexels.com, images.unsplash.com, upload.wikimedia.org, official press/media image CDNs, or other public image hosts.
- For latest product photos or famous people, prefer official product pages, official press kits, Wikimedia/Commons, reputable news/media image CDNs, or public profile/press photos when they expose direct image URLs.
- Do not use HTML pages as image_url. Use source_url for the page and image_url for the direct image file.
- Do not use URLs that require authentication, cookies, JavaScript, anti-bot checks, signed short-lived tokens, or manual download confirmation.

Each replacement item must include:
- "label"
- "asset_role"
- "visual_purpose"
- "needs_cutout"
- "preferred_format"
- "image_url"
- "source_url"
- "query"
- "visual_requirements"
- "rationale"`;

  const user = `The previous image URLs failed validation. Replace only the failed image_url values.

--- Remotion Prompt ---
${remotionPrompt}
--- End Prompt ---

--- Failed Items ---
${JSON.stringify(failedItems, null, 2)}
--- End Failed Items ---

--- Download Failures ---
${JSON.stringify(failures, null, 2)}
--- End Download Failures ---

Output ONLY the JSON array of replacement items.`;

  return { system, user };
}

export interface ImageFetchItem {
  label: string;
  asset_role?: "background" | "animated_object" | "static_overlay" | "screen_mockup";
  visual_purpose?: "diagram" | "comparison" | "concrete" | "callout";
  needs_cutout?: boolean;
  preferred_format?: "jpg" | "png";
  image_url?: string;
  source_url?: string;
  query: string;
  visual_requirements: string;
  rationale: string;
  resolved_path?: string;
  resolution_error?: string;
  cutout_path?: string;
  cutout_source_path?: string;
  cutout_success?: boolean;
  cutout_error?: string;
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
    if (!item.label || !item.query || !item.visual_requirements) {
      throw new Error("Each image fetch item must have label, query, and visual_requirements");
    }
  }
  return parsed as ImageFetchItem[];
}
