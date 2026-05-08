import type { ImageFetchItem } from "./build-image-fetch-prompt";

function toStaticFilePath(item: ImageFetchItem): string {
  const assetPath = item.cutout_path ?? item.resolved_path ?? item.label;

  return assetPath
    .replace(/\\/g, "/")
    .replace(/^\.?\//, "")
    .replace(/^public\//, "");
}

function formatAssetManifest(imageItems: ImageFetchItem[]): string {
  if (imageItems.length === 0) {
    return "";
  }

  return imageItems
    .map((item) => {
      const status = item.resolution_error
        ? `unresolved: ${item.resolution_error}`
        : "available";

      return [
        `- ${item.label}`,
        `  staticFile: staticFile("${toStaticFilePath(item)}")`,
        `  role: ${item.asset_role ?? "unspecified"}`,
        `  status: ${status}`,
        `  visual_requirements: ${item.visual_requirements}`,
      ].join("\n");
    })
    .join("\n");
}

export function buildCompositionPrompt(
  remotionPrompt: string,
  imageItems: ImageFetchItem[] = [],
): { system: string; user: string } {
  const assetManifest = formatAssetManifest(imageItems);
  const system = `You are an expert Remotion developer. Write a complete, self-contained Remotion composition as a single .tsx file.

Requirements:
- The file must export a default function component that registers itself via <Composition> from remotion
- IMPORTANT: You MUST import {Composition} from "remotion" explicitly — it is a named export from the "remotion" package, not a default export or global
- Import React from "react" as a default import: import React from "react";
- Inside the default export: define an inner component that renders the actual frame content using useCurrentFrame(), useVideoConfig(), interpolate(), spring(), etc.
- The inner component name must uniquely describe the composition (not generic names like "Component" or "App")
- The outer default export renders <Composition id="<kebab-case-name>" component={InnerComponent} durationInFrames={N} fps={30} width={1920} height={1080} />
- The <Composition> component must be wrapped in a fragment: <>...</> (or <React.Fragment>...</React.Fragment>)
- All imports must be explicit (import each used item individually from remotion — no namespace imports like import * as Remotion)
- Use staticFile() for any asset references (images, audio, etc.)
- When an asset manifest is provided, use those exact staticFile() paths for matching visual assets. Assets are stored under public/, so do not include "public/" in staticFile() arguments.
- Prefer cutout/static overlay assets from the manifest over inventing new filenames. Do not reference missing assets.
- The inner component must be self-contained — all logic and styling inline
- Use TypeScript

Before emitting your final code, perform these checks:
1. TYPE CHECK: Verify every imported symbol is actually used and every used symbol is imported. Confirm JSX syntax is valid (matching open/close tags, self-closing tags). Confirm React is imported wherever JSX is used. Verify all Remotion APIs (spring, interpolate, useCurrentFrame, etc.) are called with correct argument signatures.
2. SYNTAX CHECK: The output must NOT contain markdown fences (\`\`\`), code block delimiters, or any explanatory text before or after the code. The first character of your output must be valid TypeScript (a comment, import, or code line).
3. LINT CHECK: No unused imports, no implicit any, no duplicate identifiers, no unreachable code. All local variables must be declared before use.

Output ONLY the raw TypeScript code. No markdown fences. No explanations. No preamble.`;

  const assetInstructions = assetManifest
    ? `Available image assets:
${assetManifest}

The image assets above are already downloaded. Reference them with the exact listed staticFile() calls when they match the scene.

`
    : "";

  const user = `Write a complete Remotion composition .tsx file for this prompt:

${remotionPrompt}

${assetInstructions}
The file must export a default component that self-registers via <Composition>. Before outputting, do a type-check pass (imports match usage, Remotion API signatures are correct) and a lint pass (no unused symbols, valid JSX, no markdown fences). Return ONLY the raw TypeScript code. No markdown fences. No explanations.`;

  return { system, user };
}
