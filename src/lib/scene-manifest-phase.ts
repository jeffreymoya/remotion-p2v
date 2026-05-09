import fs from "node:fs";
import path from "node:path";
import type { Segment } from "./parse-script";
import { deepseekChat, DeepSeekError } from "./deepseek";
import {
  parseSceneManifest,
  manifestPath,
  isArtifactReady,
  writeFileAtomically,
  type SceneManifest,
} from "./scene-manifest";
import { buildSceneManifestPrompt } from "./build-scene-manifest-prompt";
import { type Phase, shouldRunPhase } from "./cli-args";
import { makeDeepSeekRecorders } from "./deepseek-recorders";

export async function loadOrGenerateManifest(
  slug: string,
  effectiveSegment: Segment,
  runDir: string,
  args: { from: Phase; only?: Phase; verbose: boolean },
): Promise<{ manifest: SceneManifest | null; manifestGenerated: boolean }> {
  const manifestFilePath = manifestPath(slug);
  let manifest: SceneManifest | null = null;
  let manifestGenerated = false;

  if (isArtifactReady(manifestFilePath)) {
    try {
      manifest = parseSceneManifest(
        fs.readFileSync(manifestFilePath, "utf-8"),
      );
      console.log(`Loaded scene manifest: ${manifest.scenes.length} scene(s)\n`);
    } catch (err) {
      console.warn(
        `Scene manifest parse error: ${err instanceof Error ? err.message : String(err)}. Regenerating.`,
      );
    }
  }

  if (!manifest && shouldRunPhase("prompt", args.from, args.only)) {
    console.log("Generating scene manifest from segment narrative...");
    const { system, user } = buildSceneManifestPrompt(
      effectiveSegment,
      slug,
    );
    try {
      const raw = await deepseekChat(
        [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        0.3,
        {
          effort: "medium",
          thinking: { type: "disabled" as const },
        },
        {
          verbose: args.verbose,
          ...makeDeepSeekRecorders(
            "manifest",
            path.join(runDir, "00-manifest.response.txt"),
            path.join(runDir, "00-manifest.thinking.txt"),
            args.verbose,
          ),
        },
      );
      manifest = parseSceneManifest(raw);
      writeFileAtomically(manifestFilePath, raw);
      manifestGenerated = true;
      console.log(
        `Saved scene manifest: ${manifestFilePath} (${manifest.scenes.length} scene(s))\n`,
      );
    } catch (err) {
      if (err instanceof DeepSeekError) {
        console.error(
          `DeepSeek API error (scene manifest): ${err.message}. Falling back to legacy single-composition mode.`,
        );
      } else {
        console.error(
          `Scene manifest generation error: ${err instanceof Error ? err.message : String(err)}. Falling back to legacy single-composition mode.`,
        );
      }
      manifest = null;
    }
  }

  return { manifest, manifestGenerated };
}
