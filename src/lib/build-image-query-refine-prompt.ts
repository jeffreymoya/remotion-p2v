import type { ImageFetchItem } from "./build-image-fetch-prompt";

export function buildImageQueryRefinePrompt(
  narrative: string,
  failedItems: ImageFetchItem[],
  acquisitionFailures: Array<{ label: string; reason: string }>,
): { system: string; user: string } {
  const system = `You are repairing a Remotion image acquisition plan after an acquisition attempt failed.

The previous attempt failed while acquiring the asset, downloading it, or validating required output properties such as an alpha PNG.

Rules:
- Output ONLY a JSON array.
- Return one replacement item for each failed label and no extra labels.
- Keep the exact same "label" values from the failed items.
- Preserve each failed item's asset_role, visual_purpose, and needs_background_removal values exactly.
- Use the failure reason to craft a more reliable Pixabay search query.
- Replace "query" with a more specific Pixabay search term that addresses the failure.

Each replacement item must include:
- "label"
- "asset_role"
- "visual_purpose"
- "needs_background_removal"
- "query"
- "visual_requirements"
- "rationale"`;

  const failureDetails = acquisitionFailures
    .map((f) => {
      const parts = [`- label: "${f.label}" | reason: ${f.reason}`];
      return parts.join("\n");
    })
    .join("\n");

  const user = `The previous acquisition attempt failed. Replace the search queries to find more reliable matches.

--- Scene Narrative ---
${narrative}
--- End Narrative ---

--- Failed Items ---
${JSON.stringify(failedItems, null, 2)}
--- End Failed Items ---

--- Acquisition Failures ---
${failureDetails}
--- End Acquisition Failures ---

Output ONLY the JSON array of replacement items.`;

  return { system, user };
}

export function buildT2iPromptRefinePrompt(
  item: ImageFetchItem,
  failureReason: string,
): { system: string; user: string } {
  const system = `You are refining a text-to-image generation prompt after image acquisition failed.

Rules:
- Output ONLY the refined t2i_prompt as a single string (no JSON wrapping).
- Keep the same subject and intent as the original prompt.
- Address the acquisition failure by being more explicit about the required output.
- Do not change the fundamental subject or purpose of the image.
- Keep the prompt detailed and descriptive (see the original for style reference).
- Do NOT include style keywords like "photorealistic" or "cinematic" — those are appended automatically.`;

  const user = `Image acquisition for "${item.label}" failed.

Original t2i_prompt:
${item.t2i_prompt ?? "(none)"}

Visual requirements:
${item.visual_requirements}

Failure reason:
${failureReason}

Write an improved t2i_prompt that addresses the failure. Output ONLY the refined prompt text.`;

  return { system, user };
}
