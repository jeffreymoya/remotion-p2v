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
- All images must work at 1920x1080 without important parts cut off.
- No watermarks, no AI-looking artifacts, no copyrighted screenshots (use generic mockups).
- Do not drift from the composition's intended style. Match the prompt's described tone, palette, perspective, realism level, framing, and animation role.
- Do not pick generic images that only match the object name. The image must fit how the asset appears in the scene.
- For full-screen backgrounds, specify landscape orientation, safe central subject placement, negative space requirements, and whether text/overlays must remain legible.
- For overlay props, specify transparent or clean removable background, object angle, silhouette clarity, padding around edges, and whether the asset should feel photographic, illustrated, flat-icon, UI mockup, or hand-drawn.
- For UI/screen assets, use generic mockups that evoke the described interface without copyrighted or real private content.
- Add clear exclusions in "visual_requirements" when adjacent-looking assets would be wrong.

Output ONLY a JSON array. Each item must include:
- "label": exact filename used in the composition (e.g. "beach.jpg")
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
  image_url?: string;
  source_url?: string;
  query: string;
  visual_requirements: string;
  rationale: string;
  resolved_path?: string;
  resolution_error?: string;
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
