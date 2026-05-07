export function buildCompositionPrompt(remotionPrompt: string): { system: string; user: string } {
  const system = `You are an expert Remotion developer. Write a complete, self-contained Remotion composition as a single .tsx file.

Requirements:
- The file must export a default function component that registers itself via <Composition> from remotion
- Inside the default export: define an inner component that renders the actual frame content using useCurrentFrame(), useVideoConfig(), interpolate(), spring(), etc.
- The inner component name must uniquely describe the composition (not generic names like "Component" or "App")
- The outer default export renders <Composition id="<kebab-case-name>" component={InnerComponent} durationInFrames={N} fps={30} width={1920} height={1080} />
- All imports must be explicit (import each used item individually from remotion — no namespace imports)
- Use staticFile() for any asset references (images, audio, etc.)
- The inner component must be self-contained — all logic and styling inline
- Use TypeScript
- Output ONLY the raw TypeScript code with no markdown fences, no explanations, no preamble`;

  const user = `Write a complete Remotion composition .tsx file for this prompt:

${remotionPrompt}

The file must export a default component that self-registers via <Composition>. Return ONLY the raw TypeScript code. No markdown fences.`;

  return { system, user };
}
