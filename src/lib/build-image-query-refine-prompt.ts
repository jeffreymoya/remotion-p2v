import type { ImageFetchItem } from "./build-image-fetch-prompt";

export function buildImageQueryRefinePrompt(
  remotionPrompt: string,
  failedItems: ImageFetchItem[],
  qaFailures: Array<{ label: string; reason: string; suggestion?: string }>,
): { system: string; user: string } {
  const system = `You are repairing a Remotion image download plan after visual quality review failed.

The images were downloaded successfully but did not match the visual requirements semantically — wrong subject, poor angle, occluded, or unsuitable for cutout.

Rules:
- Output ONLY a JSON array.
- Return one replacement item for each failed label and no extra labels.
- Keep the exact same "label" values from the failed items.
- Preserve each failed item's asset_role, visual_purpose, needs_cutout, and preferred_format values exactly.
- Use the vision reviewer's reason and suggestion to craft a better search query.
- Replace "query" with a more specific search term that addresses the reviewer's feedback.
- Replace "image_url" with a different direct, publicly fetchable HTTP(S) image URL if you can find a better one, or set it to null to rely on search.
- Do not reuse any previous URL.
- Do not use URLs from hosts that block automated downloads.
- Prefer stable direct image URLs from hosts that allow unauthenticated automated fetches.

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

  const failureDetails = qaFailures
    .map((f) => {
      const parts = [`- label: "${f.label}" | reason: ${f.reason}`];
      if (f.suggestion) {
        parts.push(`  suggestion: ${f.suggestion}`);
      }
      return parts.join("\n");
    })
    .join("\n");

  const user = `The previous images were downloaded but failed visual quality review. Replace the search queries to find better matches.

--- Remotion Prompt ---
${remotionPrompt}
--- End Prompt ---

--- Failed Items ---
${JSON.stringify(failedItems, null, 2)}
--- End Failed Items ---

--- Vision QA Failures ---
${failureDetails}
--- End Vision QA Failures ---

Output ONLY the JSON array of replacement items.`;

  return { system, user };
}
