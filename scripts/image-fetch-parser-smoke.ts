import assert from "node:assert/strict";
import { parseImageFetchResponse } from "../src/lib/build-image-fetch-prompt";

const parsed = parseImageFetchResponse(`
Here is the plan:
[
  {
    "label": "backdrop.jpg",
    "asset_role": "background",
    "needs_background_removal": false,
    "preferred_format": "jpg",
    "image_url": "",
    "source_url": "",
    "query": "wide office background with negative space",
    "visual_requirements": "Landscape office backdrop, 1920x1080 safe, clean overlay space.",
    "rationale": "Provides the full-frame scene."
  },
  {
    "label": "paper-plane.png",
    "asset_role": "animated_object",
    "needs_background_removal": true,
    "preferred_format": "png",
    "image_url": "",
    "source_url": "",
    "query": "isolated paper plane transparent png",
    "visual_requirements": "Fully visible paper plane with padded edges and clean silhouette.",
    "rationale": "Moves independently in the composition."
  },
  {
    "label": "legacy.jpg",
    "image_url": "",
    "source_url": "",
    "query": "legacy plan item",
    "visual_requirements": "Older schema item without role metadata.",
    "rationale": "Ensures older image plans still parse."
  }
]
`);

assert.equal(parsed.length, 3);
assert.equal(parsed[0].asset_role, "background");
assert.equal(parsed[0].needs_background_removal, false);
assert.equal(parsed[1].asset_role, "animated_object");
assert.equal(parsed[1].needs_background_removal, true);
assert.equal(parsed[2].asset_role, undefined);

const legacy = parseImageFetchResponse(`
[
  {
    "label": "legacy-plane.png",
    "asset_role": "animated_object",
    "needs_cutout": true,
    "visual_requirements": "Legacy item using deprecated background-removal flag.",
    "rationale": "Ensures older image plans still parse."
  }
]
`);

assert.equal(legacy[0].needs_background_removal, true);
assert.equal(legacy[0].needs_cutout, true);

assert.throws(
  () =>
    parseImageFetchResponse(`
[
  {
    "label": "broken.png"
  }
]
`),
  /label and visual_requirements/,
);

console.log("Image fetch parser smoke passed");
