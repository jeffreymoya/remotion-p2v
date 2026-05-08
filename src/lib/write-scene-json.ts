import fs from "node:fs";
import path from "node:path";
import { SceneScriptSchema } from "./scene-script-schema";
import type { SceneScript } from "./scene-script-schema";
import { SCENE_MODULE_PATH } from "./config";

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

  return fs
    .readdirSync(sceneDir)
    .filter((file) => file.endsWith("-scene.json"))
    .sort()
    .map((file) => {
      const raw = fs.readFileSync(path.join(sceneDir, file), "utf-8");
      return SceneScriptSchema.parse(JSON.parse(raw));
    });
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
  fs.writeFileSync(modulePath, contents, "utf-8");
}

export function writeSceneJson(
  rawResponse: string,
  slug: string,
  sceneDir: string,
): { path: string; script: SceneScript } {
  const cleaned = stripJsonFences(rawResponse);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new SceneJsonValidationError(`Invalid JSON: ${message}`);
  }

  const result = SceneScriptSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new SceneJsonValidationError(`Schema validation failed:\n${issues}`);
  }

  const script = result.data;
  const outPath = path.join(sceneDir, `${slug}-scene.json`);

  if (!fs.existsSync(sceneDir)) {
    fs.mkdirSync(sceneDir, { recursive: true });
  }

  fs.writeFileSync(outPath, JSON.stringify(script, null, 2), "utf-8");
  writeSceneScriptsModule(sceneDir);
  return { path: outPath, script };
}
