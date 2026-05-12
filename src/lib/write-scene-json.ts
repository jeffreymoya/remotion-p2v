import fs from "node:fs";
import path from "node:path";
import { SceneScriptSchema } from "./scene-script-schema";
import type { SceneScript } from "./scene-script-schema";
import { SCENE_MODULE_PATH } from "./config";
import { writeFileAtomically } from "./scene-manifest";

export class SceneJsonValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SceneJsonValidationError";
  }
}

function stripJsonFences(raw: string): string {
  return raw
    .replace(/^[\s\n]*```(?:json)?\s*\n?/, "")
    .replace(/[\s\n]*```[\s\n]*$/, "")
    .trim();
}

function escapeNonAscii(value: string): string {
  return value.replace(/[\u007f-\uffff]/g, (char) => {
    return `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`;
  });
}

function toTsLiteral(value: unknown): string {
  return escapeNonAscii(JSON.stringify(value, null, 2));
}

function readSceneScripts(sceneDir: string): SceneScript[] {
  if (!fs.existsSync(sceneDir)) return [];

  const scripts: SceneScript[] = [];
  const entries = fs.readdirSync(sceneDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      scripts.push(...readSceneScripts(path.join(sceneDir, entry.name)));
    } else if (entry.isFile() && entry.name.endsWith("-scene.json")) {
      const raw = fs.readFileSync(path.join(sceneDir, entry.name), "utf-8");
      try {
        scripts.push(SceneScriptSchema.parse(JSON.parse(raw)));
      } catch {
        // Skip corrupted or unparseable scene files
      }
    }
  }

  return scripts.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function writeSceneScriptsModule(
  sceneDir: string,
  modulePath = SCENE_MODULE_PATH,
): void {
  const scripts = readSceneScripts(sceneDir);
  const contents = `import { SceneScriptSchema } from "../lib/scene-script-schema";
import type { SceneScript } from "../lib/scene-script-schema";

const rawSceneScripts = ${toTsLiteral(scripts)} as const;

export const sceneScripts: SceneScript[] = rawSceneScripts.map((script) =>
  SceneScriptSchema.parse(script),
);
`;
  fs.mkdirSync(path.dirname(modulePath), { recursive: true });
  writeFileAtomically(modulePath, contents);
}

export function writeSceneJson(
  rawResponse: string,
  slug: string,
  sceneDir: string,
  options?: {
    expectedDurationFrames?: number;
    expectedCompositionId?: string;
    skipRegeneration?: boolean;
  },
): { path: string; script: SceneScript } {
  const cleaned = stripJsonFences(rawResponse);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new SceneJsonValidationError(`Invalid JSON: ${message}`);
  }

  const rawDebugPath = path.join(sceneDir, `${slug}-scene.raw.txt`);
  fs.mkdirSync(sceneDir, { recursive: true });
  fs.writeFileSync(rawDebugPath, cleaned, "utf-8");

  const result = SceneScriptSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new SceneJsonValidationError(`Schema validation failed:\n${issues}`);
  }

  let script = result.data;

  if (options?.expectedCompositionId && script.slug !== options.expectedCompositionId) {
    script = { ...script, slug: options.expectedCompositionId };
  }

  if (options?.expectedDurationFrames !== undefined && script.durationInFrames !== options.expectedDurationFrames) {
    script = { ...script, durationInFrames: options.expectedDurationFrames };
  }

  const outPath = path.join(sceneDir, `${slug}-scene.json`);
  if (!fs.existsSync(sceneDir)) {
    fs.mkdirSync(sceneDir, { recursive: true });
  }

  writeFileAtomically(outPath, JSON.stringify(script, null, 2));

  if (!options?.skipRegeneration) {
    writeSceneScriptsModule(sceneDir);
  }

  return { path: outPath, script };
}
